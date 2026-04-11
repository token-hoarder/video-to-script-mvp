'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { login, signup } from '@/app/login/actions';

export function AuthButtons() {
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isSignupPending, startSignupTransition] = useTransition();

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

  const isPending = isLoginPending || isSignupPending;

  return (
    <>
      <Button type="submit" disabled={isPending} formAction={handleLogin} className="w-full bg-white text-black hover:bg-zinc-200">
        {isLoginPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoginPending ? "Logging in..." : "Log in"}
      </Button>
      <Button type="submit" disabled={isPending} formAction={handleSignup} variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white bg-transparent">
        {isSignupPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSignupPending ? "Signing up..." : "Sign up"}
      </Button>
    </>
  );
}
