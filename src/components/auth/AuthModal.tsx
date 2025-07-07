import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppleIcon, GoogleIcon, SupabaseIcon, GithubIcon } from '@/components/sections/HyperIronicHero';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface AuthModalProps {
  open: boolean;
  mode: 'signup' | 'login' | 'reset';
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: 'signup' | 'login' | 'reset') => void;
}

// Social login handler
const handleSocialLogin = async (
  provider: 'google' | 'apple' | 'github',
  setLoading: (provider: 'email' | 'google' | 'github' | null) => void,
  setError: (msg: string) => void
) => {
  if (provider === 'google' || provider === 'github') {
    setLoading(provider);
  } else {
    setLoading(null);
  }
  setError('');
  
  // Check if there's an anonymous session to link
  const anonymousEmail = sessionStorage.getItem('anonymousEmail');
  if (anonymousEmail) {
    console.log('AuthModal: Found anonymous session, will attempt to link accounts');
  }
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined,
    },
  });
  if (error) setError(error.message);
  setLoading(null);
};

export const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onOpenChange, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animatingMode, setAnimatingMode] = useState(mode);
  useEffect(() => {
    if (open) setAnimatingMode(mode);
  }, [open, mode]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'email' | 'google' | 'github' | null>(null);
  const [socialError, setSocialError] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Helper for switching modes with animation
  const switchMode = (newMode: 'signup' | 'login' | 'reset') => {
    if (animatingMode === newMode) return;
    setIsAnimating(true);
    setTimeout(() => {
      setAnimatingMode(newMode);
      setEmail('');
      setPassword('');
      setFullName('');
      onModeChange(newMode);
      setIsAnimating(false);
    }, 350); // match animation duration
  };

  // Handler for Supabase button to switch to email/password form
  const handleSupabaseButton = () => {
    setAnimatingMode('login');
    onModeChange('login');
  };

  // Handler for email/password form submission
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider('email');
    setSocialError('');
    let result;
    if (animatingMode === 'signup') {
      result = await supabase.auth.signUp({ email, password });
    } else if (animatingMode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
      // Check for user-not-found error
      if (result?.error && result.error.message.toLowerCase().includes('user')) {
        setShowSignupPrompt(true);
        setLoadingProvider(null);
        return;
      }
    } else if (animatingMode === 'reset') {
      result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined,
      });
      if (!result.error) {
        setSocialError('Password reset email sent! Check your inbox.');
      }
    }
    if (result?.error) setSocialError(result.error.message);
    setLoadingProvider(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full rounded-2xl border border-slate-200/30 bg-black/70 backdrop-blur-xl p-8 glass-morphism ultra-smooth text-white flex flex-col items-center justify-center min-h-[450px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ boxShadow: 'none' }}
      >
        {showSignupPrompt ? (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
            <div className="text-2xl font-bold mb-2">Account Not Found</div>
            <div className="text-base text-zinc-300 mb-4 text-center">You must sign up first before logging in. Please create an account to continue.</div>
            <Button className="w-full" onClick={() => { setShowSignupPrompt(false); setAnimatingMode('signup'); onModeChange('signup'); }}>
              Go to Sign Up
            </Button>
          </div>
        ) : (
          <>
            {animatingMode === 'reset' && (
              <button
                type="button"
                className="absolute left-4 top-4 flex items-center gap-2 text-zinc-300 hover:text-white text-sm font-medium px-3 py-1 rounded transition-colors bg-black/30 border border-white/10 backdrop-blur"
                onClick={() => switchMode('login')}
                style={{ zIndex: 10 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={animatingMode}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] } }}
                exit={{ opacity: 0, y: -30, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } }}
                className="w-full"
              >
                <DialogHeader className="w-full text-center mb-2">
                  <DialogTitle className="text-2xl font-bold mb-1">
                    {animatingMode === 'signup' && 'Create Account'}
                    {animatingMode === 'login' && 'Welcome Back'}
                    {animatingMode === 'reset' && 'Reset Password'}
                  </DialogTitle>
                  <DialogDescription className="text-base text-zinc-300 mb-4">
                    {animatingMode === 'signup' && 'Join us and start your journey today'}
                    {animatingMode === 'login' && 'Sign in to your account to continue'}
                    {animatingMode === 'reset' && 'Enter your email to receive a password reset code'}
                  </DialogDescription>
                </DialogHeader>

                {socialError && (
                  <div className="w-full text-center text-red-400 mb-2 text-sm">{socialError}</div>
                )}

                {/* Social Auth Buttons */}
                {(animatingMode === 'signup' || animatingMode === 'login') && (
                  <div className="flex gap-3 w-full mb-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-md border-slate-200/40 bg-black/30 hover:bg-black/50 text-white border transition-all flex items-center justify-center"
                      onClick={() => { setLoadingProvider('google'); handleSocialLogin('google', setLoadingProvider, setSocialError); }}
                      disabled={!!loadingProvider}
                    >
                      <GoogleIcon className="w-5 h-5" />
                      {loadingProvider === 'google' && <span className="ml-2 animate-pulse">Connecting...</span>}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-md border-slate-200/40 bg-black/30 hover:bg-black/50 text-white border transition-all flex items-center justify-center"
                      onClick={() => { setLoadingProvider('github'); handleSocialLogin('github', setLoadingProvider, setSocialError); }}
                      disabled={!!loadingProvider}
                    >
                      <GithubIcon className="w-5 h-5" />
                      {loadingProvider === 'github' && <span className="ml-2 animate-pulse">Connecting...</span>}
                    </Button>
                  </div>
                )}
                {/* Optional: Add a note above the form */}
                {(animatingMode === 'signup' || animatingMode === 'login') && (
                  <div className="w-full text-xs text-zinc-400 mb-2 text-center">
                    Please use your real email, password, and full name. If you want to use Google or GitHub, use the same email as your OAuth account.
                  </div>
                )}

                {/* Divider */}
                {(animatingMode === 'signup' || animatingMode === 'login') && (
                  <div className="flex items-center w-full my-2">
                    <Separator className="flex-1 bg-slate-200/20" />
                    <span className="mx-2 text-xs text-zinc-400">or continue with email</span>
                    <Separator className="flex-1 bg-slate-200/20" />
                  </div>
                )}

                {/* Form Fields */}
                <form className="w-full flex flex-col gap-4 mt-2 items-center justify-center" onSubmit={handleEmailAuth}>
                  {animatingMode === 'signup' && (
                    <div className="relative w-full flex items-center">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="h-12 rounded-md bg-black/30 border-slate-200/20 text-white placeholder:text-zinc-400 w-full pl-10"
                        autoComplete="name"
                      />
                    </div>
                  )}
                  {(animatingMode === 'signup' || animatingMode === 'login') && (
                    <>
                      <div className="relative w-full flex items-center">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-12 rounded-md bg-black/30 border-slate-200/20 text-white placeholder:text-zinc-400 pl-10 w-full"
                          autoComplete="email"
                        />
                      </div>
                      <div className="relative w-full flex items-center">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="h-12 rounded-md bg-black/30 border-slate-200/20 text-white placeholder:text-zinc-400 pr-12 pl-10 w-full"
                          autoComplete={animatingMode === 'signup' ? 'new-password' : 'current-password'}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                          onClick={() => setShowPassword(v => !v)}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </>
                  )}
                  {animatingMode === 'signup' && (
                    <Button type="submit" className="mt-2 h-12 rounded-md bg-white text-black font-semibold hover:bg-zinc-100 transition-all w-full">
                      Create Account
                    </Button>
                  )}
                  {animatingMode === 'login' && (
                    <Button type="submit" className="mt-2 h-12 rounded-md bg-white text-black font-semibold hover:bg-zinc-100 transition-all w-full">
                      Sign In
                    </Button>
                  )}
                </form>

                {/* Footer Links */}
                <div className="w-full flex flex-col items-center mt-4 text-sm">
                  {animatingMode === 'signup' && (
                    <span className="text-zinc-400">Already have an account?{' '}
                      <button type="button" className="text-white font-semibold hover:underline" onClick={() => switchMode('login')}>Log in</button>
                    </span>
                  )}
                  {animatingMode === 'login' && (
                    <div className="w-full flex justify-between items-center">
                      <span className="text-zinc-400">Don&apos;t have an account?{' '}
                        <button type="button" className="text-white font-semibold hover:underline" onClick={() => switchMode('signup')}>Sign up</button>
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal; 