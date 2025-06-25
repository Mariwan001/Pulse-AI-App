"use client";

import { animate } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { UserPreferences } from "@/lib/types";

// Animated Text Hook
function useAnimatedText(text: string, delimiter: string = "") {
  const [cursor, setCursor] = useState(0);
  const [startingCursor, setStartingCursor] = useState(0);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setStartingCursor(text.startsWith(prevText) ? cursor : 0);
  }

  useEffect(() => {
    const parts = text.split(delimiter);
    const duration = delimiter === "" ? 1.5 : 1.2;
    
    const controls = animate(startingCursor, parts.length, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [startingCursor, text, delimiter]);

  return text.split(delimiter).slice(0, cursor).join(delimiter);
}

// Auto Resize Textarea Hook
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90",
      outline: "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };

    const sizeClasses = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-10 rounded-lg px-8",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// Main AI Onboarding Component
interface AIOnboardingProps {
  className?: string;
  onComplete: (preferences: UserPreferences) => void;
}

type OnboardingStep = "greeting" | "ai-name" | "user-name" | "response-style";

function AIOnboarding({ className, onComplete }: AIOnboardingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("greeting");
  const [inputValue, setInputValue] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>({
    aiName: "",
    userName: "",
    responseStyle: "detailed",
    onboardingCompleted: false
  });
  const [showInput, setShowInput] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // 1. Check sessionStorage first for a quick result
      const onboardingCompleted = sessionStorage.getItem('onboardingCompleted');
      if (onboardingCompleted === 'true') {
        const cachedPrefs = sessionStorage.getItem('userPreferences');
        if (cachedPrefs) {
          onComplete(JSON.parse(cachedPrefs));
          return;
        }
      }

      // 2. If not in session, check Supabase
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (preferences && preferences.onboarding_completed) {
            const finalPreferences = {
              aiName: preferences.ai_name,
              userName: preferences.user_name,
              responseStyle: preferences.response_style,
              onboardingCompleted: true,
            };
            // Cache in sessionStorage for next time
            sessionStorage.setItem('userPreferences', JSON.stringify(finalPreferences));
            sessionStorage.setItem('onboardingCompleted', 'true');
            onComplete(finalPreferences);
            return;
          }
        }
      } catch (error) {
        if (error && (error as any).code !== 'PGRST116') { // PGRST116: No rows found
          console.error("Error checking onboarding status:", error);
        }
      }
      // 3. If no user or not completed, show onboarding
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [onComplete]);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 120,
  });

  const messages = {
    greeting: "Hello! Welcome to our AI assistant. I'm excited to get to know you better.",
    "ai-name": "What name would you like to call me?",
    "user-name": `Nice to meet you! What would you like me to call you?`,
    "response-style": `Perfect, ${preferences.userName}! How would you like me to respond when you ask me something or need help?`
  };

  const animatedText = useAnimatedText(
    currentStep === "user-name" && preferences.aiName 
      ? `Nice to meet you! What would you like ${preferences.aiName} to call you?`
      : currentStep === "response-style" && preferences.userName
      ? `Perfect, ${preferences.userName}! How would you like me to respond when you ask me something or need help?`
      : messages[currentStep], 
    ""
  );

  useEffect(() => {
    if (currentStep !== "greeting") {
      setShowInput(true);
    }
  }, [currentStep]);

    const saveUserPreferences = async (finalPreferences: UserPreferences) => {
    const supabase = getSupabaseClient();
    try {
      // Get the currently authenticated user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      let userId = user?.id;

      if (!userId) {
        // If no user, sign in anonymously to get a stable ID
        const { data: { user: newUser } } = await supabase.auth.signInAnonymously();
        userId = newUser?.id;
        if (!userId) {
          console.error("Failed to get a user ID from Supabase anonymous sign-in.");
          return false;
        }
      }

      // Save to sessionStorage for the current session only
      sessionStorage.setItem('userPreferences', JSON.stringify(finalPreferences));
      sessionStorage.setItem('onboardingCompleted', 'true');

      // Save to Supabase for long-term persistence
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ai_name: finalPreferences.aiName,
          user_name: finalPreferences.userName,
          response_style: finalPreferences.responseStyle,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Use onConflict to avoid race conditions

      if (error) {
        console.error('Error saving preferences:', error);
        // Still continue even if Supabase fails, as we have sessionStorage
      }

      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === "greeting") {
      setCurrentStep("ai-name");
      setInputValue(""); // Clear input value for the next step
      setShowInput(true); // Show input immediately after greeting
    } else if (currentStep === "ai-name" && inputValue.trim()) {
      setPreferences(prev => ({ ...prev, aiName: inputValue.trim() }));
      setInputValue("");
      setCurrentStep("user-name");
      setShowInput(true);
    } else if (currentStep === "user-name" && inputValue.trim()) {
      setPreferences(prev => ({ ...prev, userName: inputValue.trim() }));
      setInputValue("");
      setCurrentStep("response-style");
      setShowInput(true);
    }
  };

  const handleResponseStyleSelect = async (style: "detailed" | "concise") => {
    setIsCompleting(true);
    
    const finalPreferences = {
      ...preferences,
      responseStyle: style,
      onboardingCompleted: true
    };

    setPreferences(finalPreferences);

    // Save preferences
    const success = await saveUserPreferences(finalPreferences);

    if (success) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        onComplete(finalPreferences);
      }, 500);
    } else {
      // If saving failed, still complete onboarding
      setTimeout(() => {
        onComplete(finalPreferences);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 transition-all duration-1000", className)}>
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          {/* Massive Ultra Soft Border with reduced blur on mobile for performance */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[3rem] blur-2xl md:blur-3xl transform scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/90 to-background/80 rounded-[2.5rem] backdrop-blur-lg md:backdrop-blur-xl border border-border/20"></div>
          
          {/* Content Container with GPU acceleration hint and responsive padding */}
          <div className="relative bg-background/60 backdrop-blur-sm rounded-[2rem] border border-border/30 shadow-2xl shadow-primary/5 p-6 sm:p-8 md:p-12 will-change-transform">
            {/* AI Message with responsive text and height */}
            <div className="mb-8">
              <div className="text-xl sm:text-2xl font-light text-foreground/90 leading-relaxed min-h-[6rem] sm:min-h-[4rem] flex items-center">
                {animatedText}
              </div>
            </div>

            {/* Next Button for Greeting */}
            {currentStep === "greeting" && !showInput && (
              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  className="bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-12 py-2 rounded-md"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Input Section */}
            {showInput && (
              <div className="space-y-6">
                {currentStep === "response-style" ? (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full h-auto p-3 sm:p-6 text-left justify-start hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 whitespace-normal break-words"
                      onClick={() => handleResponseStyleSelect("detailed")}
                      disabled={isCompleting}
                    >
                      <div>
                        <div className="font-medium text-foreground mb-1 sm:mb-2 text-base sm:text-lg">Detailed & Comprehensive</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">I'll provide thorough explanations and detailed answers.</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full h-auto p-3 sm:p-6 text-left justify-start hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 whitespace-normal break-words"
                      onClick={() => handleResponseStyleSelect("concise")}
                      disabled={isCompleting}
                    >
                      <div>
                        <div className="font-medium text-foreground mb-1 sm:mb-2 text-base sm:text-lg">Concise & Direct</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">I'll give you brief, to-the-point answers.</div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        adjustHeight();
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        currentStep === "ai-name" 
                          ? "Enter a name for me..." 
                          : "Enter Your name"
                      }
                      className="w-full bg-background/80 border-border/40 rounded-2xl text-base p-4 pr-14 sm:text-lg sm:p-6 sm:pr-16 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 resize-none"
                      rows={1}
                      disabled={isCompleting}
                    />
                    
                    {/* Next Button */}
                    {(inputValue.trim() || currentStep === "greeting") && (
                      <div className="absolute bottom-4 right-4">
                        <Button
                          onClick={handleNext}
                          size="icon"
                          className="rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          disabled={isCompleting}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIOnboarding; 