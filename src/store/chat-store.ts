import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';
import type { Message, ChatSession, ChatMessage, UserPreferences } from '@/lib/types';



// ----------------
// STATE INTERFACE
// ----------------
export interface ChatState {
  // State
  sessions: ChatSession[];
  userId: string | null;
  activeSessionId: string | null;
  messages: Message[];
  isGenerating: boolean;
  abortController: AbortController | null;
  userPreferences: UserPreferences | null;
  isInitialized: boolean;
  // Actions
  initializeAuthAndFetchData: () => Promise<void>;
  setUserId: (userId: string | null) => void;
  fetchSessions: () => Promise<void>;
  setActiveSessionId: (sessionId: string | null, loadMessages?: boolean) => void;
  loadMessagesForSession: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateStreamingMessage: (chunk: string) => void;
  finishStreaming: () => void;
  startNewChat: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  deleteMultipleSessions: (sessionIds: string[]) => Promise<void>;
  setIsGenerating: (isGenerating: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  getUserPreferences: () => Promise<UserPreferences | null>;
  setUserPreferences: (preferences: UserPreferences) => void;
}

// ----------------
// ZUSTAND STORE
// ----------------
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial State
  sessions: [],
  userId: null,
  activeSessionId: null,
  messages: [],
  isGenerating: false,
  abortController: null,
  userPreferences: null,
  isInitialized: false,

  // --- ACTIONS ---
  initializeAuthAndFetchData: async () => {
    if (get().isInitialized) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      let userId: string | null = session?.user?.id || null;

      if (sessionError || !session) {
        console.log('No active session, signing in anonymously.');
        const { data: anonSession, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error('Error signing in anonymously:', signInError);
          set({ isInitialized: true });
          return;
        }
        userId = anonSession?.user?.id || null;
      }

      if (userId) {
        set({ userId });
        await get().fetchSessions();
        await get().getUserPreferences();
      } else {
        console.error('Failed to get user ID after auth check.');
      }
    } catch (error) {
      console.error("Error during initialization:", error);
    } finally {
      set({ isInitialized: true });
    }
  },

  setUserId: (userId) => set({ userId }),

  getUserPreferences: async () => {
    // First check sessionStorage for the current session's preferences
    const sessionPreferences = sessionStorage.getItem('userPreferences');
    if (sessionPreferences) {
      try {
        const preferences = JSON.parse(sessionPreferences);
        set({ userPreferences: preferences });
        return preferences;
      } catch (e) {
        console.error("Failed to parse userPreferences from sessionStorage", e);
        sessionStorage.removeItem('userPreferences'); // Clear corrupted data
      }
    }

    // If not in sessionStorage, check Supabase
    const { userId } = get();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error
        throw error;
      }
      
      if (!data) {
        return null;
      }

      const preferences: UserPreferences = {
        aiName: data.ai_name || '',
        userName: data.user_name || '',
        responseStyle: data.response_style || 'detailed',
        onboardingCompleted: data.onboarding_completed || false
      };

      set({ userPreferences: preferences });
      // Also update sessionStorage so it's cached for the next check
      sessionStorage.setItem('userPreferences', JSON.stringify(preferences));
      return preferences;
    } catch (error) {
      console.error("Error fetching user preferences from DB:", error);
      return null;
    }
  },

  setUserPreferences: (preferences: UserPreferences) => {
    set({ userPreferences: preferences });
    sessionStorage.setItem('userPreferences', JSON.stringify(preferences));
  },

  fetchSessions: async () => {
    const { userId } = get();
    if (!userId) return;

    const { data, error } = await supabase
      .from('chat_history')
      .select('session_id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching session data:', error);
      set({ sessions: [] });
      return;
    }
    if (!data) {
      set({ sessions: [] });
      return;
    }

    const sessionsMap = new Map<string, ChatSession>();
    for (const message of data) {
      if (!sessionsMap.has(message.session_id)) {
        sessionsMap.set(message.session_id, {
          id: message.session_id,
          topic: message.content.substring(0, 50),
          created_at: message.created_at,
          user_id: userId,
        });
      }
    }

    const uniqueSessions = Array.from(sessionsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    set({ sessions: uniqueSessions });
  },

  setActiveSessionId: (sessionId, loadMessages = true) => {
    set({ activeSessionId: sessionId });
    if (sessionId && loadMessages) {
      get().loadMessagesForSession(sessionId);
    } else if (!sessionId) {
      set({ messages: [] });
    }
  },

  loadMessagesForSession: async (sessionId) => {
    const { userId, isInitialized } = get();
    if (!isInitialized || !userId) {
      console.error('Cannot load messages: store not initialized or no user ID.');
      set({ messages: [], isGenerating: false });
      return;
    }

    set({ messages: [], isGenerating: true });
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        set({ isGenerating: false });
      } else {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id!.toString(),
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.created_at!),
          sessionId: msg.session_id,
        }));

        set({ messages: formattedMessages, isGenerating: false });
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ isGenerating: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateStreamingMessage: (chunk: string) => {
    set(state => {
      if (state.messages.length === 0 || !state.isGenerating) return {};

      const lastMessage = state.messages[state.messages.length - 1];

      // If the last message is from the assistant, append the chunk
      if (lastMessage.sender === 'ai') {
        return {
          messages: [
            ...state.messages.slice(0, -1),
            { ...lastMessage, text: lastMessage.text + chunk },
          ],
        };
      } else {
        // Otherwise, create a new assistant message
        return {
          messages: [
            ...state.messages,
            { id: uuidv4(), sender: 'ai', text: chunk, timestamp: new Date(), sessionId: state.activeSessionId ?? undefined },
          ],
        };
      }
    });
  },

  finishStreaming: () => {
    set({ isGenerating: false, abortController: null });
  },

  startNewChat: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    // Completely reset all chat-related state
    set({ 
      activeSessionId: null, 
      messages: [], 
      isGenerating: false, 
      abortController: null 
    });
  },

  deleteSession: async (sessionId: string) => {
    const { userId, sessions, activeSessionId } = get();
    if (!userId) return;

    // Optimistically update the UI
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    set({ sessions: updatedSessions });

    if (activeSessionId === sessionId) {
      set({ activeSessionId: null, messages: [] });
    }

    // Perform deletion from the database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error deleting session from database:', error);
      // Revert the optimistic update on error
      set({ sessions });
      if (activeSessionId === sessionId) {
        get().loadMessagesForSession(sessionId);
      }
    }
  },

  clearAllSessions: async () => {
    const { userId, sessions, activeSessionId } = get();
    if (!userId) return;

    const sessionsToClear = sessions.filter(s => s.id !== activeSessionId);
    const sessionIdsToClear = sessionsToClear.map(s => s.id);

    if (sessionIdsToClear.length === 0) return; // Nothing to clear

    // Perform deletion from the database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
      .in('session_id', sessionIdsToClear);

    if (error) {
      console.error('Error clearing sessions from database:', error);
      return; // Stop if the database operation fails
    }

    // If database deletion is successful, update the UI
    const remainingSessions = sessions.filter(s => s.id === activeSessionId);
    set({ sessions: remainingSessions });
  },

  deleteMultipleSessions: async (sessionIds: string[]) => {
    const { userId } = get();
    if (!userId) return;

    // Perform deletion from the database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
      .in('session_id', sessionIds);

    if (error) {
      console.error('Error deleting sessions from database:', error);
      return; // Stop if the database operation fails
    }

    // If database deletion is successful, update the UI
    const { sessions } = get();
    const remainingSessions = sessions.filter(s => !sessionIds.includes(s.id));
    set({ sessions: remainingSessions });
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setAbortController: (controller) => set({ abortController: controller }),
}));

// ----------------
// EXTERNAL ACTIONS
// ----------------

/**
 * Sends a message to the AI and handles the streaming response.
 * This is the primary function for user interaction.
 */
export const sendMessage = async (query: string, imageDataUri?: string | null): Promise<string | null> => {
  const { isInitialized, userId, activeSessionId, addMessage, setIsGenerating, setAbortController, updateStreamingMessage, finishStreaming } = useChatStore.getState();

  // Critical check: Do not proceed if the store is not initialized or if userId is missing.
  if (!isInitialized || !userId) {
    console.error("sendMessage aborted: Store not initialized or user ID is missing.");
    // Optionally, show a toast to the user here.
    return null;
  }

  // Abort any ongoing generation
  useChatStore.getState().abortController?.abort();
  const newAbortController = new AbortController();
  setAbortController(newAbortController);

  const userMessage: Message = {
    id: uuidv4(),
    sender: 'user',
    text: query,
    timestamp: new Date(),
    sessionId: activeSessionId ?? undefined, // Use existing or undefined for new chat
    imageDataUri: imageDataUri ?? undefined,
  };

  addMessage(userMessage);
  setIsGenerating(true);

  // Determine the session ID to use for the API call
  // If there's no active session, a new one will be created on the backend.
  const sessionIdForApi = activeSessionId || uuidv4();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userId: userId, // Ensure the correct userId is sent
        sessionId: sessionIdForApi,
        imageDataUri: imageDataUri,
      }),
      signal: newAbortController.signal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isFirstChunk = true;
    let newAiMessageId = uuidv4();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsedChunk = JSON.parse(line);
          
          if (isFirstChunk) {
            const aiMessage: Message = {
              id: newAiMessageId,
              sender: 'ai',
              text: '',
              timestamp: new Date(),
              sessionId: sessionIdForApi,
            };
            addMessage(aiMessage);
            isFirstChunk = false;
          }
          
          if (parsedChunk.type === 'text') {
            updateStreamingMessage(parsedChunk.content);
          }
          // Handle other chunk types if necessary (e.g., tool_code)
          
        } catch (e) {
          console.error('Error parsing streaming chunk:', e, 'Raw chunk:', line);
        }
      }
    }
    // Return the new session ID if one was created
    return !activeSessionId ? sessionIdForApi : null;

  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Stream aborted by user.');
    } else {
      console.error('Failed to send message:', error);
      // Optionally, add an error message to the chat UI
    }
    return null;
  } finally {
    finishStreaming();
  }
};
