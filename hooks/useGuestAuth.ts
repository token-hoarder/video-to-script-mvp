'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
let initialization: Promise<User | null> | null = null;
export function publishCredits(credits: number) {
  window.dispatchEvent(new CustomEvent('reel-credits',{detail:credits}));
}
export function useGuestAuth() {
  const [supabase] = useState(() => createClient());
  const [user,setUser] = useState<User|null>(null);
  const [credits,setCredits] = useState<number|null>(null);
  const [isLoading,setIsLoading] = useState(true);
  const [isUpgrading,setIsUpgrading] = useState(false);
  const [authError,setAuthError] = useState('');
  const fetchCredits = useCallback(async () => {
    const {data,error}=await supabase.rpc('recover_reel_balance');
    if(error) throw new Error('Your balance is unavailable. Refresh to reconnect.');
    if(typeof data==='number') {setCredits(data); publishCredits(data);}
  },[supabase]);
  const refreshCredits=useCallback(async()=>{if(user) await fetchCredits();},[user,fetchCredits]);
  useEffect(()=>{
    let mounted=true; const timers=new Set<ReturnType<typeof setTimeout>>();
    const refreshLater=()=>{
      // Supabase holds the auth lock during this callback. Run DB calls after it returns.
      const timer=setTimeout(()=>{timers.delete(timer); if(mounted) void fetchCredits().catch(()=>{});},0);
      timers.add(timer);
    };
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(!mounted) return;
      setUser(session?.user??null);
      if(session?.user) refreshLater(); else setCredits(null);
    });
    if(!initialization) {
      initialization=(async()=>{
        const {data:{session},error}=await supabase.auth.getSession();
        if(error) throw error;
        if(session?.user) return session.user;
        const result=await supabase.auth.signInAnonymously();
        if(result.error) throw result.error;
        return result.data.user;
      })().finally(()=>{initialization=null;});
    }
    void initialization.then(async current=>{
      if(!mounted) return;
      setUser(current);
      if(current) await fetchCredits();
    }).catch(()=>{if(mounted) setAuthError('Could not connect. Refresh the page to try again.');}).finally(()=>{if(mounted) setIsLoading(false);});
    const receive=(event:Event)=>{if(mounted) setCredits((event as CustomEvent<number>).detail);};
    window.addEventListener('reel-credits',receive);
    return()=>{mounted=false; subscription.unsubscribe(); timers.forEach(clearTimeout); window.removeEventListener('reel-credits',receive);};
  },[supabase,fetchCredits]);
  const upgradeToGoogle=useCallback(async()=>{
    setIsUpgrading(true);
    try {
      const {error}=await supabase.auth.linkIdentity({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback?next=/studio`}});
      if(error) throw error;
    } catch {toast.error('Could not connect to Google. Please try again.'); setIsUpgrading(false);}
  },[supabase]);
  return {user,credits,isLoading,isGuest:user?.is_anonymous??true,isUpgrading,authError,upgradeToGoogle,refreshCredits};
}
