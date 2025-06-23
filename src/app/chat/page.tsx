"use client"; 

import ChatInterface from '@/components/chat/ChatInterface';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import { useChatStore, sendMessage } from '@/store/chat-store';


function ChatPageLayout() {
  // Select state individually to prevent re-renders from creating new objects.
  const userId = useChatStore((state) => state.userId);
  const isInitialized = useChatStore((state) => state.isInitialized);
  const initializeAuthAndFetchData = useChatStore((state) => state.initializeAuthAndFetchData);
  const clearAllSessions = useChatStore((state) => state.clearAllSessions);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQueryHandled = useRef(false);

  // Initialize auth on first render
  useEffect(() => {
    // We can call this unconditionally; the store itself prevents re-initialization.
    initializeAuthAndFetchData();
  }, [initializeAuthAndFetchData]);

  // Effect to handle the initial message send from a URL query
  useEffect(() => {
    const query = searchParams.get('q');
    // CRITICAL: Only run if the store is initialized, there's a query, and it hasn't been handled.
    if (query && isInitialized && !initialQueryHandled.current) {
      // Mark as handled immediately to prevent re-runs.
      initialQueryHandled.current = true;
      // sendMessage now handles starting a new chat internally
      sendMessage(query).then(newSessionId => {
        if (newSessionId) {
          // Replace the URL to clean it up and reflect the new session.
          router.replace(`/chat?session_id=${newSessionId}`, { scroll: false });
        }
      });
    }
  }, [isInitialized, searchParams, router]);

  // Show a loading indicator until the entire store is initialized
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">Initializing chat...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar onClearChat={clearAllSessions} />
      </Sidebar>
      <SidebarInset>
        <Suspense fallback={<div>Loading chat interface...</div>}>
          <ChatInterface />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ChatPage() {
  // Main export for the page still uses Suspense for the overall layout
  return (
    <Suspense fallback={<div>Loading chat page...</div>}>
      <ChatPageLayout />
    </Suspense>
  );
}
