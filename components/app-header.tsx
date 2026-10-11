'use client';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGuestAuth } from '@/hooks/useGuestAuth';
import { logout } from '@/app/login/actions';
export function AppHeader() {
  const {credits,isGuest,isLoading,isUpgrading,upgradeToGoogle}=useGuestAuth();
  return <header className="border-b border-outline-variant/20 bg-background"><nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
    <Link href="/" className="text-lg font-bold tracking-tight text-primary">ViralScript</Link>
    <div className="flex items-center gap-3 text-xs sm:text-sm">
      <span aria-live="polite" className="whitespace-nowrap text-on-surface-variant">{isLoading?'Connecting…':credits===null?'Offline':`${credits} analyses left`}</span>
      {isGuest&&<button className="rounded-full border border-outline-variant/30 px-3 py-2 font-medium" onClick={upgradeToGoogle} disabled={isLoading||isUpgrading}>{isUpgrading?'Connecting…':'Sign in'}</button>}
      {!isGuest&&<form action={logout}><button className="min-h-11 rounded-full border border-outline-variant/30 px-3 py-2 font-medium">Log out</button></form>}
      <ThemeToggle />
    </div>
  </nav></header>;
}
