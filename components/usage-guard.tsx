/**
 * UsageGuard — Credit Counter + Upgrade CTA
 *
 * UX rules (AUTH_FLOW.md):
 *   - Never say "guest" — show "Preview Mode" or "Exploring for free"
 *   - Credit counter: "✦ N analyses left"
 *   - At 0 credits: replace Generate button with "Unlock 50 Credits →"
 *   - OAuth opens inline (no full-page redirect)
 *   - On upgrade success: update counter optimistically without page reload
 *
 * Usage in layout / page:
 *   <UsageGuard credits={credits} isGuest={isGuest} onUpgrade={upgradeToGoogle} />
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Zap } from 'lucide-react';

interface UsageGuardProps {
  /** Current credit count from `profiles.credits`. Null while loading. */
  credits: number | null;
  /** True if the user is anonymous (Supabase anonymous auth). */
  isGuest: boolean;
  /** Triggers linkIdentity() Google OAuth upgrade. */
  onUpgrade: () => Promise<void>;
  /** If true, renders an inline blocking card instead of an inline badge. */
  blocked?: boolean;
  className?: string;
}

/**
 * CreditBadge — the header credit counter.
 *
 * Shows "✦ N analyses left" when credits > 0.
 * Hides for registered users (is_guest = false).
 */
export function CreditBadge({
  credits,
  isGuest,
  onUpgrade,
}: Pick<UsageGuardProps, 'credits' | 'isGuest' | 'onUpgrade'>) {
  if (!isGuest || credits === null) return null;

  return (
    <motion.button
      onClick={onUpgrade}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm transition-colors hover:border-amber-400/50 hover:bg-amber-900/50"
      aria-label={`${credits} analyses remaining — click to unlock more`}
      id="credit-badge"
    >
      <Sparkles className="h-3 w-3 text-amber-400" aria-hidden />
      {credits > 0 ? (
        <span>
          ✦ <span className="font-semibold tabular-nums">{credits}</span>{' '}
          {credits === 1 ? 'analysis' : 'analyses'} left
        </span>
      ) : (
        <span className="text-rose-300">No analyses left</span>
      )}
    </motion.button>
  );
}

/**
 * UnlockCTA — replaces the "Generate Draft" button when credits = 0.
 *
 * Renders a full-width upgrade prompt with Google branding.
 */
export function UnlockCTA({ onUpgrade }: { onUpgrade: () => Promise<void> }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-950/60 to-zinc-900/80 p-5 text-center shadow-lg backdrop-blur-sm"
      id="unlock-cta"
      role="region"
      aria-label="Upgrade to unlock more analyses"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-400/30">
        <Lock className="h-5 w-5 text-amber-400" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-100">
          You've used all 3 free analyses
        </p>
        <p className="text-xs text-zinc-400">
          Sign in with Google to unlock 50 credits — your scripts stay intact.
        </p>
      </div>

      <button
        onClick={onUpgrade}
        id="unlock-google-btn"
        className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-100 active:scale-95"
      >
        {/* Google G icon (inline SVG — no external dep) */}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Unlock 50 Credits →
      </button>

      <p className="text-[10px] text-zinc-500">
        Your in-progress scripts are automatically saved.
      </p>
    </motion.div>
  );
}

/**
 * UsageGuard — top-level component.
 *
 * When `blocked=true` and credits are at 0, renders the full UnlockCTA.
 * Otherwise renders nothing (CreditBadge is placed independently in the header).
 */
export function UsageGuard({
  credits,
  isGuest,
  onUpgrade,
  blocked = false,
  className = '',
}: UsageGuardProps) {
  if (!isGuest) return null; // Registered users never see the guard

  return (
    <AnimatePresence mode="wait">
      {blocked && credits !== null && credits <= 0 && (
        <div className={className} key="usage-guard-blocked">
          <UnlockCTA onUpgrade={onUpgrade} />
        </div>
      )}
    </AnimatePresence>
  );
}
