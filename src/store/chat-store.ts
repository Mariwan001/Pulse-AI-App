import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Message, ChatSession, ChatMessage, UserPreferences } from '@/lib/types';

// TypeScript: Extend window type for our custom property
declare global {
  interface Window {
    __pulse_ai_avatar_listener_attached?: boolean;
  }
}

// ----------------
// STATE INTERFACE
// ----------------
export interface ChatState {
  // State
  sessions: ChatSession[];
  userId: string | null;
  userEmail: string | null;
  activeSessionId: string | null;
  messages: Message[];
  isGenerating: boolean;
  abortController: AbortController | null;
  userPreferences: UserPreferences | null;
  isInitialized: boolean;
  lastAIPromptedMessageId: string | null;
  avatarUrl: string | null;
  // Actions
  initializeAuthAndFetchData: () => Promise<void>;
  setUserId: (userId: string | null) => void;
  setUserEmail: (userEmail: string | null) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  fetchSessions: () => Promise<void>;
  setActiveSessionId: (sessionId: string | null, loadMessages?: boolean) => void;
  loadMessagesForSession: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  appendToBuffer: (chunk: string) => void;
  flushStreamingBuffer: () => void;
  finishStreaming: (flush: boolean) => void;
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
  userEmail: null,
  activeSessionId: null,
  messages: [],
  isGenerating: false,
  abortController: null,
  userPreferences: null,
  isInitialized: false,
  lastAIPromptedMessageId: null,
  avatarUrl: null,

  // --- ACTIONS ---
  initializeAuthAndFetchData: async () => {
    const supabase = getSupabaseClient();
    if (get().isInitialized) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const userId: string | null = session?.user?.id || null;
      const userEmail: string | null = session?.user?.email || null;
      let avatarUrl: string | null = null;
      if (session?.user?.user_metadata?.avatar_url) {
        avatarUrl = session.user.user_metadata.avatar_url;
      }
      set({ userId, userEmail, avatarUrl });
      if (userId && userEmail) {
        // User is authenticated
        console.log('Chat store: User authenticated, loading data for:', userEmail);
        await get().fetchSessions();
        await get().getUserPreferences();
      } else {
        // User is not authenticated - check for anonymous session
        console.log('Chat store: User not authenticated, checking for anonymous session');
        const anonymousEmail = sessionStorage.getItem('anonymousEmail');
        if (anonymousEmail) {
          console.log('Chat store: Found anonymous session for:', anonymousEmail);
          set({ userId: null, userEmail: anonymousEmail, avatarUrl: null });
          await get().fetchSessions();
        } else {
          console.log('Chat store: No session found, user needs to authenticate');
          set({ userId: null, userEmail: null, avatarUrl: null });
        }
      }
    } catch (error) {
      console.error("Error during initialization:", error);
      set({ userId: null, userEmail: null, avatarUrl: null });
    } finally {
      set({ isInitialized: true });
    }
  },

  setUserId: (userId) => set({ userId }),
  setUserEmail: (userEmail) => set({ userEmail }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

  getUserPreferences: async () => {
    const supabase = getSupabaseClient();
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
    const { userId, userEmail } = get();
    if (!userId && !userEmail) return null;

    try {
      let query = supabase.from('user_preferences').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (userEmail) {
        query = query.eq('user_email', userEmail);
      } else {
        return null;
      }

      const { data, error } = await query.single();

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
    const supabase = getSupabaseClient();
    set({ userPreferences: preferences });
    sessionStorage.setItem('userPreferences', JSON.stringify(preferences));
  },

  fetchSessions: async () => {
    const supabase = getSupabaseClient();
    const { userEmail, userId } = get();
    if (!userEmail) {
      console.log('fetchSessions: No userEmail available, skipping session fetch');
      return;
    }

    console.log('fetchSessions: Fetching sessions for userEmail:', userEmail);

    const { data, error } = await supabase
      .from('chat_history')
      .select('session_id, content, created_at')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching session data:', error);
      // Don't clear existing sessions on error, just log the error
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('fetchSessions: No session data found for userEmail:', userEmail);
      // Only clear sessions if we have no data at all
      set({ sessions: [] });
      return;
    }

    console.log('fetchSessions: Found', data.length, 'messages for sessions');

    const sessionsMap = new Map<string, ChatSession>();
    for (const message of data) {
      if (!sessionsMap.has(message.session_id)) {
        sessionsMap.set(message.session_id, {
          id: message.session_id,
          topic: message.content.substring(0, 50),
          created_at: message.created_at,
          user_id: userId || userEmail,
        });
      }
    }

    const uniqueSessions = Array.from(sessionsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('fetchSessions: Setting', uniqueSessions.length, 'unique sessions');
    set({ sessions: uniqueSessions });
  },

  setActiveSessionId: (sessionId, loadMessages = true) => {
    console.log('setActiveSessionId called with sessionId:', sessionId, 'loadMessages:', loadMessages);
    set({ activeSessionId: sessionId, messages: [] }); // Always clear messages when switching sessions
    if (sessionId && loadMessages) {
      console.log('setActiveSessionId: Calling loadMessagesForSession');
      get().loadMessagesForSession(sessionId);
    }
  },

    loadMessagesForSession: async (sessionId: string) => {
    console.log('loadMessagesForSession called with sessionId:', sessionId);
    set({ messages: [] }); // Always clear messages before loading new ones
    const supabase = getSupabaseClient();
    let { userEmail, userId, isInitialized, isGenerating } = get();
    
    console.log('loadMessagesForSession: userEmail:', userEmail, 'userId:', userId, 'isInitialized:', isInitialized);
    
    // If no userEmail, try to get it from sessionStorage (for anonymous users)
    if (!userEmail) {
      const storedEmail = sessionStorage.getItem('userEmail');
      if (storedEmail) {
        console.log('loadMessagesForSession: Using email from sessionStorage:', storedEmail);
        userEmail = storedEmail;
        set({ userEmail: storedEmail });
      }
    }
    
    if (!userEmail) {
      console.error('Cannot load messages: no user email available.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        set({ isGenerating: false });
        return;
      }
      
      let formattedMessages: Message[] = [];
      if (data && data.length > 0) {
        formattedMessages = data.map((msg: any) => ({
          id: msg.id!.toString(),
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.created_at!),
          sessionId: msg.session_id,
          userId: msg.user_id || undefined,
          userEmail: msg.user_email || undefined,
        }));
        // Deduplicate by text, sender, and sessionId
        const seen = new Set();
        formattedMessages = formattedMessages.filter(msg => {
          const key = `${msg.text}|${msg.sender}|${msg.sessionId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      // Deduplicate with pending message in sessionStorage
      const pendingMessage = sessionStorage.getItem('pendingMessage');
      const pendingSessionId = sessionStorage.getItem('pendingSessionId');
      if (pendingMessage && pendingSessionId === sessionId) {
        const alreadyExists = formattedMessages.some(
          m => m.text === pendingMessage && m.sender === 'user' && m.sessionId === sessionId
        );
        if (!alreadyExists) {
          const fallbackMessage = {
            id: crypto.randomUUID(),
            text: pendingMessage,
            sender: 'user' as const,
            timestamp: new Date(),
            sessionId: sessionId,
          };
          formattedMessages.push(fallbackMessage);
        }
        sessionStorage.removeItem('pendingMessage');
        sessionStorage.removeItem('pendingSessionId');
      }
      set({ messages: formattedMessages, isGenerating: false });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ isGenerating: false });
    }
  },

  addMessage: (message) => {
    console.log('addMessage: Attempting to add message:', message);
    set((state) => {
      // Check if this message already exists to prevent duplicates
      const messageExists = state.messages.some(
        existingMsg => 
          existingMsg.text === message.text && 
          existingMsg.sender === message.sender &&
          existingMsg.sessionId === message.sessionId &&
          existingMsg.userId === message.userId &&
          existingMsg.userEmail === message.userEmail
      );
      if (messageExists) {
        console.log('addMessage: Message already exists, skipping duplicate:', message.text, 'userId:', message.userId, 'userEmail:', message.userEmail);
        return state;
      }
      console.log('addMessage: Adding new message:', message.text, 'userId:', message.userId, 'userEmail:', message.userEmail);
      return { messages: [...state.messages, message] };
    });
  },

  // New actions for buffered streaming
  appendToBuffer: (chunk) => set(state => ({
    messages: state.messages.map((msg, index) =>
      index === state.messages.length - 1 && msg.sender === 'ai'
        ? { ...msg, text: msg.text + chunk }
        : msg
    )
  })),

  flushStreamingBuffer: () => { /* This can be a no-op if logic is in component */ },

  finishStreaming: (flush = true) => {
    if (flush) {
      get().flushStreamingBuffer();
    }
    set({ isGenerating: false, abortController: null });
    
    // Only refresh sessions after streaming is complete for new sessions
    const { activeSessionId } = get();
    if (activeSessionId) {
      console.log('finishStreaming: Refreshing sessions after streaming complete');
      setTimeout(() => {
        get().fetchSessions();
      }, 1000);
    }
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
    const supabase = getSupabaseClient();
    const { userEmail, sessions, activeSessionId } = get();
    if (!userEmail) return;

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
      .eq('user_email', userEmail)
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
    const supabase = getSupabaseClient();
    const { userEmail, sessions, activeSessionId } = get();
    if (!userEmail) return;

    const sessionsToClear = sessions.filter(s => s.id !== activeSessionId);
    const sessionIdsToClear = sessionsToClear.map(s => s.id);

    if (sessionIdsToClear.length === 0) return; // Nothing to clear

    // Perform deletion from the database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_email', userEmail)
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
    const supabase = getSupabaseClient();
    const { userEmail } = get();
    if (!userEmail) return;

    // Perform deletion from the database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_email', userEmail)
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

// Attach Supabase auth state change listener ONCE on the client side to keep avatarUrl up-to-date
if (typeof window !== 'undefined' && !window.__pulse_ai_avatar_listener_attached) {
  window.__pulse_ai_avatar_listener_attached = true;
  const supabase = getSupabaseClient();
  supabase.auth.onAuthStateChange((event, session) => {
    let avatarUrl: string | null = null;
    if (session?.user?.user_metadata?.avatar_url) {
      avatarUrl = session.user.user_metadata.avatar_url;
    }
    useChatStore.getState().setAvatarUrl(avatarUrl);
  });
}

// ----------------
// EXTERNAL ACTIONS
// ----------------

/**
 * Sends a message to the AI and handles the streaming response.
 * This is the primary function for user interaction.
 */
export const sendMessage = async (query: string, imageDataUri?: string | null): Promise<string | null> => {
  let { isInitialized, userEmail, userId, activeSessionId, addMessage, setIsGenerating, setAbortController, appendToBuffer, finishStreaming, messages, isGenerating, lastAIPromptedMessageId } = useChatStore.getState();

  // Restore userEmail and userId from sessionStorage if missing
  if (!userEmail) {
    userEmail = sessionStorage.getItem('userEmail');
    if (userEmail) useChatStore.getState().setUserEmail(userEmail);
  }
  if (!userId) {
    userId = sessionStorage.getItem('userId');
    if (userId) useChatStore.getState().setUserId(userId);
  }
  if (!activeSessionId) {
    activeSessionId = sessionStorage.getItem('activeSessionId');
    if (activeSessionId) useChatStore.getState().setActiveSessionId(activeSessionId);
  }

  // Critical check: Do not proceed if the store is not initialized or if userEmail is missing.
  if (!isInitialized || !userEmail) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: Chat session is not initialized. Please refresh the page or try again later.',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
    return null;
  }

  // Prevent sending if already generating for this session
  if (isGenerating) {
    console.log('sendMessage: Already generating, skipping duplicate AI response');
    return activeSessionId;
  }

  // Check if this exact user message already exists to prevent duplicates
  const userMessageExists = messages.some(
    msg => msg.text === query && msg.sender === 'user' && msg.sessionId === activeSessionId && msg.userId === userId && msg.userEmail === userEmail
  );
  
  if (userMessageExists) {
    console.log('sendMessage: User message already exists, skipping duplicate:', query);
    // Don't return early - we still need to generate AI response if it doesn't exist
    const aiResponseExists = messages.some(
      msg => msg.sender === 'ai' && msg.sessionId === activeSessionId && 
             messages.indexOf(msg) > messages.findIndex(m => m.text === query && m.sender === 'user')
    );
    
    if (aiResponseExists) {
      console.log('sendMessage: AI response already exists for this user message');
      return activeSessionId;
    }
  }

  // Abort any ongoing generation
  useChatStore.getState().abortController?.abort();
  const newAbortController = new AbortController();
  setAbortController(newAbortController);

  // Only add user message if it doesn't already exist
  let userMessage = messages.find(
    msg => msg.text === query && msg.sender === 'user' && msg.sessionId === activeSessionId && msg.userId === userId && msg.userEmail === userEmail
  );
  if (!userMessage) {
    userMessage = {
      id: uuidv4(),
      sender: 'user',
      text: query,
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined, // Use existing or undefined for new chat
      imageDataUri: imageDataUri ?? undefined,
      userId: userId ?? undefined,
      userEmail: userEmail ?? undefined,
    };
    addMessage(userMessage);
    // Save as pending in sessionStorage for deduplication after refresh
    sessionStorage.setItem('pendingMessage', query);
    sessionStorage.setItem('pendingSessionId', activeSessionId ?? '');
  }

  // Check if we've already triggered AI for this user message
  if (lastAIPromptedMessageId === userMessage.id) {
    console.log('AI already responded to this user message, skipping.');
    return activeSessionId;
  }

  // Set the flag so we never trigger again for this message
  useChatStore.setState({ lastAIPromptedMessageId: userMessage.id });

  setIsGenerating(true);

  // Determine the session ID to use for the API call
  const sessionIdForApi = activeSessionId || uuidv4();

  // In sendMessage, log all relevant fields
  console.log('sendMessage: userId:', userId, 'userEmail:', userEmail, 'activeSessionId:', activeSessionId, 'query:', query);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userEmail: userEmail, // Ensure the correct userEmail is sent
        userId: userId, // Include userId in the request
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
    let buffer = '';
    let isFirstChunk = true;
    let newAiMessageId = uuidv4();

    const flushBuffer = () => {
      if (buffer) {
        appendToBuffer(buffer);
        buffer = '';
      }
    };

    const flushInterval = setInterval(flushBuffer, 20); // Flush buffer every 20ms

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearInterval(flushInterval);
        flushBuffer(); // Final flush
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsedChunk = JSON.parse(line);

          if (isFirstChunk && parsedChunk.type === 'text') {
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
            buffer += parsedChunk.content;
          }
          // Handle other chunk types if necessary (e.g., tool_code)

        } catch (e) {
          console.error('Error parsing streaming chunk:', e, 'Raw chunk:', line);
        }
      }
    }
    // Return the new session ID if one was created
    const newSessionId = !activeSessionId ? sessionIdForApi : null;
    
    // Refresh the sessions list to update the sidebar only for new sessions
    if (newSessionId) {
      console.log('sendMessage: New session created, refreshing sessions list');
      setTimeout(() => {
        useChatStore.getState().fetchSessions();
      }, 500);
    }
    
    return newSessionId;

  } catch (error) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: AI failed to respond. Please check your connection or try again. [Retry]',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
    return null;
  } finally {
    finishStreaming(true); // Ensure final flush and state update
  }
};

/**
 * Sends a message to the AI with ultra-humanization mode and handles the streaming response.
 * This creates incredibly realistic, deeply human responses.
 */
export const sendHumanizedMessage = async (query: string, imageDataUri?: string | null): Promise<string | null> => {
  let { isInitialized, userEmail, activeSessionId, addMessage, setIsGenerating, setAbortController, appendToBuffer, finishStreaming } = useChatStore.getState();

  // Restore userEmail and sessionId from sessionStorage/localStorage if missing
  if (!userEmail) {
    userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
    if (userEmail) useChatStore.getState().setUserEmail(userEmail);
  }
  if (!activeSessionId) {
    activeSessionId = sessionStorage.getItem('activeSessionId') || localStorage.getItem('activeSessionId');
    if (activeSessionId) useChatStore.getState().setActiveSessionId(activeSessionId);
  }

  // Critical check: Do not proceed if the store is not initialized or if userEmail is missing.
  if (!isInitialized || !userEmail) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: Chat session is not initialized. Please refresh the page or try again later.',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
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
    sessionId: activeSessionId ?? undefined,
    imageDataUri: imageDataUri ?? undefined,
  };

  addMessage(userMessage);
  setIsGenerating(true);

  // Determine the session ID to use for the API call
  const sessionIdForApi = activeSessionId || uuidv4();

  try {
    const response = await fetch('/api/ai/humanize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userEmail: userEmail,
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
    let buffer = '';
    let isFirstChunk = true;
    let newAiMessageId = uuidv4();

    const flushBuffer = () => {
      if (buffer) {
        appendToBuffer(buffer);
        buffer = '';
      }
    };

    const flushInterval = setInterval(flushBuffer, 20); // Flush buffer every 20ms

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearInterval(flushInterval);
        flushBuffer(); // Final flush
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsedChunk = JSON.parse(line);

          if (isFirstChunk && parsedChunk.type === 'text') {
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
            buffer += parsedChunk.content;
          }
          // Handle other chunk types if necessary (e.g., tool_code)

        } catch (e) {
          console.error('Error parsing streaming chunk:', e, 'Raw chunk:', line);
        }
      }
    }
    // Return the new session ID if one was created
    const newSessionId = !activeSessionId ? sessionIdForApi : null;
    
    // Refresh the sessions list to update the sidebar
    if (newSessionId) {
      setTimeout(() => {
        useChatStore.getState().fetchSessions();
      }, 500);
    }
    
    return newSessionId;

  } catch (error) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: AI failed to respond. Please check your connection or try again. [Retry]',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
    return null;
  } finally {
    finishStreaming(true); // Ensure final flush and state update
  }
};

/**
 * Sends a message to the AI with ultra-powerful math solving capabilities.
 * This creates extremely accurate, systematic, and comprehensive mathematical solutions.
 */
export const sendMathSolverMessage = async (query: string, imageDataUri?: string | null): Promise<string | null> => {
  let { isInitialized, userEmail, activeSessionId, addMessage, setIsGenerating, setAbortController, appendToBuffer, finishStreaming } = useChatStore.getState();

  // Restore userEmail and sessionId from sessionStorage/localStorage if missing
  if (!userEmail) {
    userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
    if (userEmail) useChatStore.getState().setUserEmail(userEmail);
  }
  if (!activeSessionId) {
    activeSessionId = sessionStorage.getItem('activeSessionId') || localStorage.getItem('activeSessionId');
    if (activeSessionId) useChatStore.getState().setActiveSessionId(activeSessionId);
  }

  // Critical check: Do not proceed if the store is not initialized or if userEmail is missing.
  if (!isInitialized || !userEmail) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: Chat session is not initialized. Please refresh the page or try again later.',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
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
    sessionId: activeSessionId ?? undefined,
    imageDataUri: imageDataUri ?? undefined,
  };

  addMessage(userMessage);
  setIsGenerating(true);

  // Determine the session ID to use for the API call
  const sessionIdForApi = activeSessionId || uuidv4();

  try {
    const response = await fetch('/api/ai/math-solver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userEmail: userEmail,
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
    let buffer = '';
    let isFirstChunk = true;
    let newAiMessageId = uuidv4();

    const flushBuffer = () => {
      if (buffer) {
        appendToBuffer(buffer);
        buffer = '';
      }
    };

    const flushInterval = setInterval(flushBuffer, 20); // Flush buffer every 20ms

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearInterval(flushInterval);
        flushBuffer(); // Final flush
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsedChunk = JSON.parse(line);

          if (isFirstChunk && parsedChunk.type === 'text') {
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
            buffer += parsedChunk.content;
          }
          // Handle other chunk types if necessary (e.g., tool_code)

        } catch (e) {
          console.error('Error parsing streaming chunk:', e, 'Raw chunk:', line);
        }
      }
    }
    // Return the new session ID if one was created
    const newSessionId = !activeSessionId ? sessionIdForApi : null;
    
    // Refresh the sessions list to update the sidebar
    if (newSessionId) {
      setTimeout(() => {
        useChatStore.getState().fetchSessions();
      }, 500);
    }
    
    return newSessionId;

  } catch (error) {
    addMessage({
      id: uuidv4(),
      sender: 'ai',
      text: '❌ Error: AI failed to respond. Please check your connection or try again. [Retry]',
      timestamp: new Date(),
      sessionId: activeSessionId ?? undefined,
    });
    return null;
  } finally {
    finishStreaming(true); // Ensure final flush and state update
  }
};

