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
      <Button type="button" disabled={isPending} onClick={handleGoogleLogin} variant="outline" className="w-full bg-white text-black hover:bg-zinc-200 mt-2">
        {isGooglePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" /> : null}
        {isGooglePending ? "Connecting..." : "Sign in with Google"}
      </Button>
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-zinc-400">Or continue with</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={isPending} formAction={handleLogin} className="w-full border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800">
          {isLoginPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoginPending ? "Logging in..." : "Log in"}
        </Button>
        <Button type="submit" disabled={isPending} formAction={handleSignup} variant="outline" className="w-full border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white">
          {isSignupPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSignupPending ? "Signing up..." : "Sign up"}
        </Button>
      </div>
    </>
  );
}
