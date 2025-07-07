'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for Supabase to process the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user) {
          console.log('AuthCallback: User authenticated:', session.user.email);
          
          // Check if there's an anonymous session to link
          const anonymousEmail = sessionStorage.getItem('anonymousEmail');
          if (anonymousEmail && anonymousEmail !== session.user.email) {
            console.log('AuthCallback: Attempting to link anonymous session:', anonymousEmail, 'to authenticated user:', session.user.email);
            
            // Here you could implement account linking logic
            // For now, we'll just clear the anonymous session
            sessionStorage.removeItem('anonymousEmail');
            console.log('AuthCallback: Cleared anonymous session');
          }
          
          // Clear any pending messages from anonymous session
          sessionStorage.removeItem('pendingMessage');
          sessionStorage.removeItem('pendingSessionId');
        }
        
        // Redirect to home page
        router.replace('/');
      } catch (error) {
        console.error('AuthCallback: Error processing auth callback:', error);
        router.replace('/');
      }
    };

    // Wait a moment for Supabase to process the session, then handle the callback
    const timer = setTimeout(handleAuthCallback, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return <div style={{textAlign: 'center', marginTop: '2rem'}}>Logging you in...</div>;
} 