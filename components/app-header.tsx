'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Film, Hash, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreditBadge } from "@/components/usage-guard";
import { SubmitButton } from "@/components/submit-button";
import { logout } from "@/app/login/actions";
import { useGuestAuth } from "@/hooks/useGuestAuth";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { credits, isGuest, isUpgrading } = useGuestAuth();

  const handleUpgrade = async () => router.push('/login');

  return (
    <header className="relative z-10 flex h-16 items-center justify-between border-b border-border px-6 shrink-0 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground hidden sm:inline-block">ViralScript</span>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link
            href="/studio"
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-muted ${pathname?.startsWith('/studio') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Studio
          </Link>
          <Link
            href="/hashtags"
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-muted ${pathname?.startsWith('/hashtags') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Hash className="w-4 h-4" />
            Hashtags
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <CreditBadge credits={credits} isGuest={isGuest} onUpgrade={handleUpgrade} />
        {!isGuest ? (
          <form action={logout}>
            <SubmitButton variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-full transition-colors" pendingText="Logging out...">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </SubmitButton>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpgrade}
            disabled={isUpgrading}
            id="header-upgrade-btn"
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-full transition-colors text-xs font-medium"
          >
            {isUpgrading ? (
               <>
                 <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                 Saving...
               </>
            ) : (
               'Save my work →'
            )}
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
