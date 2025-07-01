"use client";

import { useState} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrainCircuit, Trash, Loader2, BookOpen, Volume2, Clock, Database, Info, ChevronDown, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatStore } from '@/store/chat-store';
import { DeleteModal } from '@/components/ui/delete-modal';

interface AppSidebarProps {
  onClearChat: () => Promise<void>;
  onSectionChange?: (section: string) => void;
  currentSection?: 'chat' | 'math';
}

const AppSidebar = ({ onClearChat, onSectionChange, currentSection }: AppSidebarProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeSessionId = searchParams.get('session_id');
  const { toast } = useToast();

  const {
    sessions,
    deleteSession,
    deleteMultipleSessions,
  } = useChatStore();

  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const handleClearChat = async () => {
    setIsClearing(true);
    
    await onClearChat();
    toast({
      title: "Chat History Cleared",
      description: "All other conversations have been deleted.",
    });
    setIsClearing(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    await deleteSession(sessionId);
    toast({
      title: "Conversation Deleted",
      description: "The chat history has been removed.",
    });
    // If the active chat is the one being deleted, navigate away
    if (activeSessionId === sessionId) {
      router.push('/chat');
    }
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    await handleClearChat();
  };

  const handleDeleteSelected = async (sessionIds: string[]) => {
    await deleteMultipleSessions(sessionIds);
    toast({
      title: "Conversations Deleted",
      description: `${sessionIds.length} conversation${sessionIds.length === 1 ? '' : 's'} have been removed.`,
    });
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <BrainCircuit size={24} className="text-primary" />
            <h2 className="text-lg font-semibold">Pulse AI</h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isClearing}
            className={cn(
              "text-muted-foreground hover:text-destructive h-7 rounded-md bg-card/[.15] hover:bg-destructive/10 shadow-[0_1px_2px_hsl(var(--foreground)_/_0.07)] hover:shadow-[0_1px_3px_hsl(var(--foreground)_/_0.1)]",
              isClearing ? "w-auto px-2 py-1 text-destructive" : "w-7 px-1 justify-center",
              "ultra-smooth-transition flex items-center"
            )}
            aria-label="Delete conversations"
          >
            <Trash size={15} />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuButton
            variant="outline"
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg border border-white/10 bg-black/10 shadow-sm transition-all duration-300 hover:border-gray-500/20 hover:bg-gray-500/5"
            onClick={() => setIsHistoryOpen((v) => !v)}
            aria-expanded={isHistoryOpen}
            aria-controls="chat-history-dropdown"
          >
            <span className="text-xs font-light tracking-wide">Chat History</span>
            <ChevronDown
              size={18}
              className={cn(
                "text-muted-foreground transition-transform duration-300",
                isHistoryOpen && "rotate-180"
              )}
            />
          </SidebarMenuButton>
          <div
            id="chat-history-dropdown"
            className={cn(
              "grid overflow-hidden transition-all duration-500 ease-in-out",
              isHistoryOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="row-span-2">
              <SidebarMenu>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <Link href={`/chat?session_id=${session.id}`} className="flex-grow">
                        <SidebarMenuButton 
                          isActive={activeSessionId === session.id}
                        >
                          <span className="truncate">{session.topic || 'New Chat'}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <span className="text-muted-foreground">No past chats</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </div>
          </div>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarMenuButton
            variant="outline"
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg border border-white/10 bg-black/10 shadow-sm transition-all duration-300 hover:border-gray-500/20 hover:bg-gray-500/5"
            onClick={() => setIsComponentsOpen((v) => !v)}
            aria-expanded={isComponentsOpen}
            aria-controls="components-dropdown"
          >
            <span className="text-xs font-light tracking-wide">Components</span>
            <ChevronDown
              size={18}
              className={cn(
                "text-muted-foreground transition-transform duration-300",
                isComponentsOpen && "rotate-180"
              )}
            />
          </SidebarMenuButton>
          <div
            id="components-dropdown"
            className={cn(
              "grid overflow-hidden transition-all duration-500 ease-in-out",
              isComponentsOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="row-span-2">
              <SidebarMenu>
                {[
                  {
                    tooltip: "Ultra-powerful math solver",
                    icon: <Calculator />,
                    label: "Math",
                    delay: "100ms",
                    onClick: () => onSectionChange?.('math'),
                    isActive: currentSection === 'math',
                  },
                  {
                    tooltip: "Grammar tools",
                    icon: <BookOpen />,
                    label: "Grammar",
                    delay: "150ms",
                  },
                  {
                    tooltip: "Voice tools",
                    icon: <Volume2 />,
                    label: "Voice",
                    delay: "200ms",
                  },
                  {
                    tooltip: "Temporary chat session",
                    icon: <Clock />,
                    label: "Temporary Chat",
                    delay: "250ms",
                  },
                  {
                    tooltip: "Database management",
                    icon: <Database />,
                    label: "Database",
                    delay: "300ms",
                  },
                ].map((item, index) => (
                  <SidebarMenuItem
                    key={index}
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      isComponentsOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    )}
                    style={{
                      transitionDelay: isComponentsOpen ? item.delay : "0ms",
                    }}
                  >
                    <SidebarMenuButton
                      tooltip={item.tooltip}
                      className="group/item flex w-full items-center"
                      onClick={item.onClick}
                      isActive={item.isActive}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      <Info
                        size={16}
                        className="ml-auto text-cyan-400 border-cyan-400 border rounded-full p-px opacity-0 scale-90 transition-all duration-300 ease-in-out group-hover/item:opacity-100 group-hover/item:scale-100"
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="p-2 text-xs text-muted-foreground">
          {new Date().getFullYear()} Pulse AI
        </div>
      </SidebarFooter>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        sessions={sessions}
        onDeleteAll={handleDeleteAll}
        onDeleteSelected={handleDeleteSelected}
        activeSessionId={activeSessionId}
      />
    </>
  );
};

export default AppSidebar;
