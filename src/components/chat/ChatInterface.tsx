"use client";

import { useRef, useEffect, type FC, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChatStore, sendMessage } from '@/store/chat-store';
import ChatHeader from './ChatHeader';
import ChatMessageItem from './ChatMessageItem';
import ChatInputBar from './ChatInputBar';
import MathSection from '@/components/sections/MathSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  onSectionChange?: (section: string) => void;
  currentSection?: 'chat' | 'math';
}

const ChatInterface: FC<ChatInterfaceProps> = ({ onSectionChange, currentSection = 'chat' }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isStartingNewChatRef = useRef(false);
  const newChatKeyRef = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    messages,
    activeSessionId,
    setActiveSessionId,
    startNewChat,
    isGenerating,
    userId,
    isInitialized,
    initializeAuthAndFetchData,
    userEmail,
  } = useChatStore();

  useEffect(() => {
    initializeAuthAndFetchData();
  }, [initializeAuthAndFetchData]);

  useEffect(() => {
    if (!isInitialized) return;

    const sessionIdFromUrl = searchParams.get('session_id');
    const queryFromUrl = searchParams.get('q');

    console.log('ChatInterface: Effect triggered - sessionIdFromUrl:', sessionIdFromUrl, 'queryFromUrl:', queryFromUrl);

    if (isStartingNewChatRef.current) {
      isStartingNewChatRef.current = false;
      return;
    }

    if (sessionIdFromUrl) {
      console.log('ChatInterface: Found session_id in URL:', sessionIdFromUrl, 'Current activeSessionId:', activeSessionId);
      if (sessionIdFromUrl !== activeSessionId) {
        console.log('ChatInterface: Setting new active session ID');
        setActiveSessionId(sessionIdFromUrl);
      }
    } else if (activeSessionId && messages.length > 0) {
      router.replace(`/chat?session_id=${activeSessionId}`, { scroll: false });
    }
  }, [searchParams, activeSessionId, setActiveSessionId, router, messages.length, isInitialized]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector(
        'div[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  useEffect(() => {
    // If new_chat=true in URL, start a new chat (clear history)
    if (searchParams.get('new_chat') === 'true') {
      startNewChat();
      // Optionally, remove the param from the URL after clearing
      router.replace('/chat', { scroll: false });
    }
  }, [searchParams, startNewChat, router]);

  const handleSendMessage = (query: string, imageDataUri?: string | null) => {
    // Check if user is authenticated
    if (!userId && !userEmail) {
      console.error('User not authenticated. Cannot send message.');
      return;
    }

    const isNewChat = !activeSessionId;

    sendMessage(query, imageDataUri).then(newSessionId => {
      if (isNewChat && newSessionId) {
        router.push(`/chat?session_id=${newSessionId}`, { scroll: false });
      }
    });
  };

  const handleNewChat = () => {
    isStartingNewChatRef.current = true;
    newChatKeyRef.current += 1;
    startNewChat();
    setTimeout(() => {
      router.replace('/chat', { scroll: false });
    }, 10);
  };

  const handleSectionChange = (section: string) => {
    onSectionChange?.(section);
  };

  const handleBackToHome = () => {
    onSectionChange?.('chat');
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Initializing session...</p>
      </div>
    );
  }

  return (
    <div key={newChatKeyRef.current} className="flex flex-col h-full bg-background">
      {currentSection === 'chat' ? (
        <>
          <ChatHeader onNewChat={handleNewChat} />
          <ScrollArea className="flex-grow p-2 sm:p-3 md:p-4" ref={scrollAreaRef}>
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <ChatMessageItem key={`${message.id}-${index}`} message={message} />
              ))}
              {isGenerating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-muted/40 rounded-lg px-3 py-2 sm:px-4 sm:py-2">
                    <span className="mr-2 sm:mr-3 text-muted-foreground text-sm sm:text-base font-light">AI is thinking</span>
                    <span className="dot-typing" style={{ fontSize: '1.25rem', letterSpacing: '0.3em', color: '#888' }}>
                      <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <ChatInputBar 
            onSendMessage={handleSendMessage} 
            isGenerating={isGenerating} 
          />
        </>
      ) : (
        <MathSection onBackToHome={handleBackToHome} />
      )}
    </div>
  );
};

export default ChatInterface;