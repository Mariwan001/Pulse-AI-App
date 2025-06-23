"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  LogOut,
  User,
  Crown,
  HelpCircle,
  Save,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const UserProfile: React.FC = () => {
  const handleFeedback = () => {
    window.open('https://www.instagram.com/com/', '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground p-0",
            "shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.1),0_1px_2px_hsl(var(--foreground)_/_0.05)]",
            "hover:shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.15),0_2px_4px_hsl(var(--foreground)_/_0.08)]",
            "border border-border/30 hover:border-border/60",
            "ultra-smooth-transition"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 rounded-md bg-background/95 backdrop-blur-sm border border-border/30 shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.1),0_4px_8px_hsl(var(--foreground)_/_0.08)]" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="text-foreground/80 font-medium">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <User className="mr-2 h-4 w-4" />
          <span>User Info</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <Crown className="mr-2 h-4 w-4" />
          <span>Subscription</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <Save className="mr-2 h-4 w-4" />
          <span>Save Chat</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <EyeOff className="mr-2 h-4 w-4" />
          <span>Hide Chat</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem onClick={handleFeedback} className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Feedback</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md hover:bg-background/80 text-muted-foreground/70 hover:text-foreground transition-colors">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
