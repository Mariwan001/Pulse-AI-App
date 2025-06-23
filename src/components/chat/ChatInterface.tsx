"use client";

import { useRef, useEffect, type FC } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChatStore, sendMessage } from '@/store/chat-store';
import ChatHeader from './ChatHeader';
import ChatMessageItem from './ChatMessageItem';
import ChatInputBar from './ChatInputBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const ChatInterface: FC = () => {
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
  } = useChatStore();

  useEffect(() => {
    initializeAuthAndFetchData();
  }, [initializeAuthAndFetchData]);

  useEffect(() => {
    if (!isInitialized) return;

    const sessionIdFromUrl = searchParams.get('session_id');

    if (isStartingNewChatRef.current) {
      isStartingNewChatRef.current = false;
      return;
    }

    if (sessionIdFromUrl) {
      if (sessionIdFromUrl !== activeSessionId) {
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

  const handleSendMessage = (query: string) => {
    if (!userId) {
      console.error('User ID not set. Cannot send message.');
      return;
    }

    const isNewChat = !activeSessionId;

    sendMessage(query).then(newSessionId => {
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
      <ChatHeader onNewChat={handleNewChat} />
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessageItem key={`${message.id}-${index}`} message={message} />
          ))}
        </div>
      </ScrollArea>
      <ChatInputBar 
        onSendMessage={handleSendMessage} 
        isGenerating={isGenerating} 
      />
    </div>
  );
};

export default ChatInterface;