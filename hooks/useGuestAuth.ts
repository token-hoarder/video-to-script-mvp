/**
 * useGuestAuth — Tiered Auth Hook
 *
 * Handles:
 *   1. Auto sign-in anonymously on first visit (Tier 1)
 *   2. Reads credit balance from the `profiles` table
 *   3. Upgrade path via linkIdentity() — NOT signInWithOAuth() — preserves UUID
 *
 * UX rules (AUTH_FLOW.md):
 *   - Never show the word "guest" — use "Preview Mode" or "Exploring for free"
 *   - Credit counter shown as "✦ N analyses left"
 *   - At 0 credits: replace Generate button with "Unlock 50 Credits →"
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface GuestAuthState {
  user: User | null;
  credits: number | null;
  isLoading: boolean;
  isGuest: boolean;
  upgradeToGoogle: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

export function useGuestAuth(): GuestAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchCredits = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setCredits(data.credits);
      }
    },
    [supabase]
  );

  const refreshCredits = useCallback(async () => {
    if (user) await fetchCredits(user.id);
  }, [user, fetchCredits]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      console.log('DEBUG_AUTH: initAuth() — checking for existing session');

      // 1. Check if a session already exists
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log('DEBUG_AUTH: existing session found — uid:', session.user.id, '| is_anonymous:', session.user.is_anonymous);
        if (mounted) {
          setUser(session.user);
          await fetchCredits(session.user.id);
        }
      } else {
        // 2. No session — sign in anonymously (Tier 1)
        console.log('DEBUG_AUTH: no session found — calling signInAnonymously()');
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('DEBUG_AUTH: signInAnonymously() FAILED —', error.message, '| code:', error.status);
        } else if (data.user && mounted) {
          console.log('DEBUG_AUTH: signInAnonymously() OK — new uid:', data.user.id);
          setUser(data.user);
          // Profile row created by DB trigger; poll briefly for it
          await new Promise((r) => setTimeout(r, 500));
          await fetchCredits(data.user.id);
        }
      }

      if (mounted) setIsLoading(false);
      console.log('DEBUG_AUTH: initAuth() complete — isLoading → false');
    }

    initAuth();

    // 3. Keep UI in sync when auth state changes (tab switches, OAuth callbacks)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      console.log('DEBUG_AUTH: onAuthStateChange fired — event:', _event, '| uid:', session?.user?.id ?? 'none', '| is_anonymous:', session?.user?.is_anonymous ?? 'n/a');
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchCredits(session.user.id);
      } else {
        console.log('DEBUG_AUTH: onAuthStateChange — no user in session, clearing credits');
        setCredits(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Upgrade path: linkIdentity() preserves the anonymous UUID.
   * CRITICAL: Do NOT use signInWithOAuth() — that creates a new user
   * and orphans all scripts.
   */
  const upgradeToGoogle = useCallback(async () => {
    console.log('DEBUG_AUTH: upgradeToGoogle() called — calling linkIdentity({ provider: google })');
    const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
    if (error) {
      console.error('DEBUG_AUTH: linkIdentity() FAILED —', error.message);
    } else {
      console.log('DEBUG_AUTH: linkIdentity() initiated — awaiting OAuth redirect');
    }
    // After redirect: onAuthStateChange fires, profile update happens server-side
  }, [supabase]);

  const isGuest = user?.is_anonymous ?? true;

  return { user, credits, isLoading, isGuest, upgradeToGoogle, refreshCredits };
}
