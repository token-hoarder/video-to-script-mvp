'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreditBadge } from "@/components/usage-guard";
import { logout } from "@/app/login/actions";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { SubmitButton } from "@/components/submit-button";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { credits, isGuest, isUpgrading } = useGuestAuth();

  const handleUpgrade = async () => router.push('/login');

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f6fafe]/60 dark:bg-[#0b141a]/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,83,221,0.08)]">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 w-full gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 md:gap-8 shrink-0">
          <Link href="/" className="text-xl font-bold tracking-tighter text-primary dark:text-[#ffffff] hover:opacity-80 transition-opacity">
            ViralScript
          </Link>
          
          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <Link
              href="/studio"
              className={`font-medium text-xs sm:text-sm tracking-tight px-2 sm:px-0 transition-colors duration-300 ${pathname?.startsWith('/studio') ? 'text-primary dark:text-[#ffffff] border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Studio
            </Link>
            <Link
              href="/hashtags"
              className={`font-medium text-xs sm:text-sm tracking-tight px-2 sm:px-0 transition-colors duration-300 ${pathname?.startsWith('/hashtags') ? 'text-primary dark:text-[#ffffff] border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Hashtags
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-4 shrink-0">
          <CreditBadge credits={credits} isGuest={isGuest} onUpgrade={handleUpgrade} />
          
          {/* Mobile Only Guest Profile Indicator */}
          <div className="md:hidden flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[10px] sm:text-xs shrink-0 shadow-inner">
             {isGuest ? 'G' : 'U'}
          </div>
          
          {!isGuest ? (
            <form action={logout}>
              <SubmitButton 
                className="bg-transparent shadow-none text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors text-xs font-semibold px-3 py-1.5 rounded-full"
                pendingText="Logging out..."
              >
                <span className="material-symbols-outlined text-[18px] mr-1">logout</span>
                <span className="hidden sm:inline">Log out</span>
              </SubmitButton>
            </form>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              id="header-upgrade-btn"
              className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm shadow-md hover:bg-primary-container/80 dark:hover:bg-primary-dim transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              {isUpgrading ? (
                 <>
                   <span className="material-symbols-outlined text-[16px] animate-spin sm:mr-1.5">autorenew</span>
                   <span className="hidden sm:inline">Saving...</span>
                 </>
              ) : (
                 <>
                   <span className="hidden sm:inline">Save my work</span>
                   <span className="sm:hidden">Save</span>
                 </>
              )}
            </button>
          )}
          
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
