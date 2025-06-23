"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface AnimatedPlaceholderInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  onSend?: () => void;
}

const AnimatedPlaceholderInput = React.forwardRef<HTMLInputElement, AnimatedPlaceholderInputProps>(
  ({ className, onSend, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      props.onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleSend = () => {
      if (inputValue.trim() && onSend) {
        onSend();
        setInputValue("");
      }
    };

    return (
      <div className="relative w-full">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            className={cn(
              "flex h-14 w-full rounded-xl border-2 border-zinc-600 bg-transparent backdrop-blur-sm px-6 py-4 text-base font-medium text-white glass-morphism",
              "transition-all duration-500 ease-out",
              "focus:border-white focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10",
              "hover:border-zinc-400 hover:bg-white/5",
              "disabled:cursor-not-allowed disabled:opacity-50 glass-morphism",
              className
            )}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              props.onKeyDown?.(e);
            }}
            {...props}
          />
          
          {inputValue.trim() && (
            <button
              onClick={handleSend}
              className="flex items-center justify-center rounded-xl bg-zinc-600/50 hover:bg-zinc-600/70 transition-all duration-300 ease-out px-4 py-2"
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

AnimatedPlaceholderInput.displayName = "AnimatedPlaceholderInput";

export default AnimatedPlaceholderInput;
