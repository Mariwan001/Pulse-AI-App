"use client"; 

import ChatInterface from '@/components/chat/ChatInterface';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import { useChatStore, sendMessage } from '@/store/chat-store';
import { useEffect as useAuthEffect, useState as useAuthState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useAuthState(false);
  useAuthEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
      } else {
        setChecked(true);
      }
    };
    check();
  }, [router]);
  if (!checked) return null;
  return <>{children}</>;
}

function ChatPageLayout() {
  // Select state individually to prevent re-renders from creating new objects.
  const userId = useChatStore((state) => state.userId);
  const userEmail = useChatStore((state) => state.userEmail);
  const isInitialized = useChatStore((state) => state.isInitialized);
  const initializeAuthAndFetchData = useChatStore((state) => state.initializeAuthAndFetchData);
  const clearAllSessions = useChatStore((state) => state.clearAllSessions);
  const loadMessagesForSession = useChatStore((state) => state.loadMessagesForSession);
  const addMessage = useChatStore((state) => state.addMessage);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQueryHandled = useRef(false);
  const sessionHandled = useRef<Set<string>>(new Set());
  const [currentSection, setCurrentSection] = useState<'chat' | 'math'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentSection');
      if (saved === 'math' || saved === 'chat') return saved;
    }
    return 'chat';
  });

  const handleSectionChange = (section: string) => {
    console.log('Section change requested:', section); // Debug log
    setCurrentSection(section as 'chat' | 'math');
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentSection', section);
    }
  };

  // Initialize auth on first render
  useEffect(() => {
    // We can call this unconditionally; the store itself prevents re-initialization.
    initializeAuthAndFetchData();
  }, [initializeAuthAndFetchData]);

  // Effect to handle the initial message send from a URL query, and new_chat clearing
  useEffect(() => {
    if (!isInitialized || initialQueryHandled.current) return;
    
    // Set the guard synchronously at the very top
    initialQueryHandled.current = true;
    
    console.log('Chat page: Effect triggered, checking URL parameters...');
    
    const query = searchParams.get('q');
    const sessionId = searchParams.get('session_id');
    const newChat = searchParams.get('new_chat');

    console.log('Chat page: URL params - query:', query, 'sessionId:', sessionId, 'newChat:', newChat);

    if (newChat === 'true') {
      console.log('Chat page: Starting new chat...');
      clearAllSessions();
      // Remove new_chat from URL
      const params = new URLSearchParams(window.location.search);
      params.delete('new_chat');
      router.replace(`/chat${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
      // Wait a tick to ensure chat is cleared, then send message
      setTimeout(() => {
        if (query) {
          console.log('Chat page: [new_chat] Calling sendMessage:', query);
          sendMessage(query).then(newSessionId => {
            if (newSessionId) {
              router.replace(`/chat?session_id=${newSessionId}`, { scroll: false });
            }
          });
        }
      }, 100);
      return;
    }
    
    // If session_id is present, load the existing session
    if (sessionId) {
      console.log('Chat page: Found session_id in URL, loading existing session:', sessionId);
      // Check if we've already handled this session to prevent duplication on refresh
      if (sessionHandled.current.has(sessionId)) {
        console.log('Chat page: Session already handled, skipping to prevent duplication');
        return;
      }
      sessionHandled.current.add(sessionId);
      // Set the active session ID first
      useChatStore.getState().setActiveSessionId(sessionId);
      // Load messages for this session (loadMessagesForSession will handle userEmail fallback)
      console.log('Chat page: Loading messages for session:', sessionId);
      loadMessagesForSession(sessionId).then(() => {
        // If both query and session_id are present, this might be a new message that just created a session
        // Check if the AI response is missing and trigger it if needed
        if (query) {
          const messages = useChatStore.getState().messages;
          console.log('Chat page: Checking for missing AI response with query:', query);
          // Find the user message that matches the query (robust: text, sender, sessionId)
          const userMessage = messages.find(m => 
            m.sender === 'user' && 
            m.text === query && 
            m.sessionId === sessionId
          );
          if (userMessage) {
            // Check if there's an AI response after this user message
            const userMessageIndex = messages.findIndex(m => m.id === userMessage.id);
            const aiResponseAfter = messages.slice(userMessageIndex + 1).find(m => 
              m.sender === 'ai' && 
              m.sessionId === sessionId
            );
            if (!aiResponseAfter) {
              console.log('Chat page: [session_id] User message found but no AI response, calling sendMessage:', query);
              sendMessage(query).then(() => {
                sessionStorage.removeItem('pendingMessage');
                sessionStorage.removeItem('pendingSessionId');
              });
            } else {
              console.log('Chat page: Both user message and AI response found, no action needed');
            }
          } else {
            console.log('Chat page: [session_id] User message not found in loaded messages, calling sendMessage:', query);
            sendMessage(query).then(() => {
              sessionStorage.removeItem('pendingMessage');
              sessionStorage.removeItem('pendingSessionId');
            });
          }
        }
        // Check if we have a pending message in sessionStorage as backup
        const pendingMessage = sessionStorage.getItem('pendingMessage');
        const pendingSessionId = sessionStorage.getItem('pendingSessionId');
        if (pendingMessage && pendingSessionId === sessionId) {
          console.log('Chat page: Found pending message in sessionStorage, clearing it');
          sessionStorage.removeItem('pendingMessage');
          sessionStorage.removeItem('pendingSessionId');
        }
      });
      return;
    }
    
    // If q param is present but no session_id, send the message to create a new session
    if (query) {
      console.log('Chat page: [no session_id] Calling sendMessage:', query);
      sendMessage(query).then(newSessionId => {
        if (newSessionId) {
          router.replace(`/chat?session_id=${newSessionId}`, { scroll: false });
        }
      });
    }
  }, [isInitialized, searchParams, router, clearAllSessions]);

  // Show a loading indicator until the entire store is initialized
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">Initializing chat...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar 
          onClearChat={clearAllSessions} 
          onSectionChange={handleSectionChange}
          currentSection={currentSection}
        />
      </Sidebar>
      <SidebarInset>
        <Suspense fallback={<div>Loading chat interface...</div>}>
          <ChatInterface 
            onSectionChange={handleSectionChange}
            currentSection={currentSection}
          />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ChatPage() {
  // Main export for the page still uses Suspense for the overall layout
  return (
    <Suspense fallback={<div>Loading chat page...</div>}>
      <AuthGate>
        <ChatPageLayout />
      </AuthGate>
    </Suspense>
  );
}
