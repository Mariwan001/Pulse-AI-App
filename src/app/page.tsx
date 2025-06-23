"use client";

import { useState, useEffect } from 'react';
import AboutSection from '../components/sections/AboutSection';
import HyperIronicHero from '../components/sections/HyperIronicHero';
import AnimatedBackground from '../components/sections/AnimatedBackground';
import { Footer } from "@/components/ui/footer";
import { AIOnboarding } from "@/components/onboarding/AIOnboarding";
import type { UserPreferences } from "@/lib/types";

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding in the current session
    const onboardingCompleted = sessionStorage.getItem('onboardingCompleted');
    const savedPreferences = sessionStorage.getItem('userPreferences');
    
    if (onboardingCompleted === 'true' && savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
      setShowOnboarding(false);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    setIsTransitioning(true);
    
    // Smooth transition to main content
    setTimeout(() => {
      setShowOnboarding(false);
      setIsTransitioning(false);
    }, 1000);
  };

  if (showOnboarding) {
    return (
      <div className={`transition-all duration-1000 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <AIOnboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <main className={`relative flex flex-col items-center w-full bg-gradient-to-br from-black via-zinc-900 to-black text-foreground overflow-x-hidden transition-all duration-1000 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <AnimatedBackground className="fixed top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 w-full">
        <HyperIronicHero userPreferences={userPreferences} />
        <AboutSection />
        <Footer />
      </div>
    </main>
  );
}
