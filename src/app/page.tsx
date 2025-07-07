"use client";

import { useState, useEffect, useCallback } from 'react';
import AboutSection from '../components/sections/AboutSection';
import HyperIronicHero from '../components/sections/HyperIronicHero';
import AnimatedBackground from '../components/sections/AnimatedBackground';
import { Footer } from "@/components/ui/footer";
import AIOnboarding from "@/components/onboarding/AIOnboarding";
import type { UserPreferences } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function HomePage() {
  // Use a three-state approach: 'onboarding', 'transition', 'landing'
  const [screen, setScreen] = useState<'onboarding' | 'transition' | 'landing'>('onboarding');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'reset'>('signup');
  const [showSignupWarning, setShowSignupWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check auth and onboarding
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Try to check the DB for onboarding completion
          try {
            const { data: preferences } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (preferences && preferences.onboarding_completed) {
              const finalPreferences = {
                aiName: preferences.ai_name || '',
                userName: preferences.user_name || '',
                responseStyle: preferences.response_style || 'detailed',
                onboardingCompleted: true,
              };
              setUserPreferences(finalPreferences);
              setScreen('landing');
              // Cache for next time
              sessionStorage.setItem('userPreferences', JSON.stringify(finalPreferences));
              sessionStorage.setItem('onboardingCompleted', 'true');
              console.log('Main page: Found database preferences, skipping onboarding');
              return;
            } else {
              // User is logged in but not onboarded: sign out and show warning
              await supabase.auth.signOut();
              setShowSignupWarning(true);
              setScreen('onboarding');
              return;
            }
          } catch (dbError) {
            console.log('Main page: Database query failed, checking sessionStorage:', dbError);
            // Continue to check sessionStorage if database fails
          }
        }
        // Not logged in or no database preferences, fallback to sessionStorage
        const onboardingCompleted = sessionStorage.getItem('onboardingCompleted');
        const savedPreferences = sessionStorage.getItem('userPreferences');
        if (onboardingCompleted === 'true' && savedPreferences) {
          try {
            const preferences = JSON.parse(savedPreferences);
            if (preferences.onboardingCompleted && preferences.aiName && preferences.userName) {
              setUserPreferences(preferences);
              setScreen('landing');
              console.log('Main page: Found valid sessionStorage preferences, skipping onboarding');
              return;
            }
          } catch (e) {
            console.error("Failed to parse cached preferences:", e);
            sessionStorage.removeItem('userPreferences');
            sessionStorage.removeItem('onboardingCompleted');
          }
        }
        // No valid preferences found, show onboarding
        console.log('Main page: No valid preferences found, showing onboarding');
        setScreen('onboarding');
      } catch (error) {
        console.error('Error checking auth and onboarding:', error);
        setScreen('onboarding');
      } finally {
        setCheckedAuth(true);
      }
    };
    check();
  }, []);

  const handleOnboardingComplete = useCallback((preferences: UserPreferences) => {
    setUserPreferences(preferences);
    setScreen('transition');
    setTimeout(() => {
      setScreen('landing');
    }, 700); // 700ms fade for smooth transition
  }, [router]);

  // Debug function to clear onboarding state (for testing)
  const clearOnboardingState = () => {
    sessionStorage.removeItem('userPreferences');
    sessionStorage.removeItem('onboardingCompleted');
    setScreen('onboarding');
    setUserPreferences(null);
  };

  if (!checkedAuth) return null;
  if (showSignupWarning) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md w-full rounded-2xl border border-slate-200/30 bg-black/70 backdrop-blur-xl p-8 glass-morphism ultra-smooth text-white flex flex-col items-center justify-center min-h-[450px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ boxShadow: 'none' }}
        >
          <DialogHeader className="w-full text-center mb-2">
            <DialogTitle className="text-2xl font-bold mb-1 text-red-400">Sign Up Required</DialogTitle>
            <DialogDescription className="text-base text-zinc-300 mb-4">
              You must sign up first before logging in. Please create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <button
            className="mt-2 h-12 rounded-md bg-white text-black font-semibold hover:bg-zinc-100 transition-all w-full"
            onClick={() => { setShowSignupWarning(false); setScreen('onboarding'); }}
          >
            Go to Sign Up
          </button>
        </DialogContent>
      </Dialog>
    );
  }
  if (screen === 'onboarding') {
    return (
      <div className="transition-all duration-700 opacity-100 scale-100">
        <AIOnboarding onComplete={handleOnboardingComplete} setAuthOpen={setAuthOpen} setAuthMode={setAuthMode} />
      </div>
    );
  }
  if (screen === 'transition') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 transition-all duration-700 opacity-100">
        <div className="text-foreground text-xl animate-pulse">Loading...</div>
      </div>
    );
  }
  // Only render landing after transition is complete
  return (
    <main className="relative flex flex-col items-center w-full bg-gradient-to-br from-black via-zinc-900 to-black text-foreground overflow-x-hidden transition-all duration-700 opacity-100 scale-100">
      <AnimatedBackground className="fixed top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 w-full">
        <HyperIronicHero userPreferences={userPreferences} authOpen={authOpen} setAuthOpen={setAuthOpen} authMode={authMode} setAuthMode={setAuthMode} />
        <AboutSection />
        <Footer />
      </div>
    </main>
  );
}
