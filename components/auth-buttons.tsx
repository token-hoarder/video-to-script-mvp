'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { login, signup } from '@/app/login/actions';
import { createClient } from '@/utils/supabase/client';

export function AuthButtons() {
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isSignupPending, startSignupTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  const handleLogin = (formData: FormData) => {
    startLoginTransition(async () => {
      await login(formData);
    });
  };

  const handleSignup = (formData: FormData) => {
    startSignupTransition(async () => {
      await signup(formData);
    });
  };

  const handleGoogleLogin = async () => {
    setIsGooglePending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;
    
    try {
      if (user?.is_anonymous) {
        await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
      } else {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsGooglePending(false);
    }
  };

  const isPending = isLoginPending || isSignupPending || isGooglePending;

  return (
    <>
      <Button type="button" disabled={isPending} onClick={handleGoogleLogin} variant="outline" className="w-full bg-white text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900 border-zinc-300 dark:border-transparent font-medium shadow-sm transition-colors mt-2 h-10">
        {isGooglePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-500" /> : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {isGooglePending ? "Connecting..." : "Sign in with Google"}
      </Button>
      
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500 font-medium">Or continue with</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={isPending} formAction={handleLogin} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 shadow-sm transition-colors">
          {isLoginPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoginPending ? "Logging in..." : "Log in"}
        </Button>
        <Button type="submit" disabled={isPending} formAction={handleSignup} variant="outline" className="w-full border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors h-10">
          {isSignupPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSignupPending ? "Signing up..." : "Sign up"}
        </Button>
      </div>
    </>
  );
}
