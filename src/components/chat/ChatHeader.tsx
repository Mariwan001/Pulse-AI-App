import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserProfile from '@/components/ui/UserProfile';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  onNewChat: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({ onNewChat }) => {
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);

  const handleNewChat = () => {
    setIsStartingNewChat(true);
    onNewChat();
    // Reset the loading state after a short delay
    setTimeout(() => setIsStartingNewChat(false), 500);
  };

  return (
    <header className="relative flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10 h-16">
      {/* Left: Sidebar Toggle Icon */}
      <SidebarTrigger 
        aria-label="Toggle Sidebar" 
        className={cn(
          "h-8 w-8 rounded-md bg-background/50 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground",
          "shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.1),0_1px_2px_hsl(var(--foreground)_/_0.05)]",
          "hover:shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.15),0_2px_4px_hsl(var(--foreground)_/_0.08)]",
          "border border-border/30 hover:border-border/60",
          "ultra-smooth-transition"
        )}
      />

      {/* Center: Title */}
      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-headline font-semibold">
        Pulse Chat
      </h1>

      {/* Right: New Chat Icon & Profile Picture Spot */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNewChat} 
          aria-label="New Chat"
          disabled={isStartingNewChat}
          className={cn(
            "h-8 w-8 rounded-md bg-background/50 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground",
            "shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.1),0_1px_2px_hsl(var(--foreground)_/_0.05)]",
            "hover:shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.15),0_2px_4px_hsl(var(--foreground)_/_0.08)]",
            "border border-border/30 hover:border-border/60",
            "ultra-smooth-transition",
            isStartingNewChat ? "opacity-50" : ""
          )}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
        <UserProfile />
      </div>
    </header>
  );
};

export default ChatHeader;
