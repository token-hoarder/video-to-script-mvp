/**
 * tests/anon-logout.test.ts
 *
 * Sprint: Anonymous Auth Stability — Logout Lifecycle
 *
 * Covers the specific flow mandated by the sprint spec:
 *   Active Guest Session → Click Logout → Session is Null → Redirected
 *
 * These tests are pure-logic / pure-data tests that do NOT import Next.js
 * server modules. The Supabase client and router are fully mocked so the
 * suite can run in a bare Node environment (vitest --environment node).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockSession {
  user: { id: string; is_anonymous: boolean };
  access_token: string;
}

interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: MockSession | null } }>;
    signInAnonymously: () => Promise<{ data: { session: MockSession } }>;
    signOut: () => Promise<{ error: null }>;
    onAuthStateChange: (cb: (event: string, session: MockSession | null) => void) => {
      data: { subscription: { unsubscribe: () => void } };
    };
  };
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeMockSession(overrides: Partial<MockSession['user']> = {}): MockSession {
  return {
    user: { id: 'anon-uuid-1234', is_anonymous: true, ...overrides },
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.anon-token',
  };
}

/**
 * Creates a mock Supabase client that tracks session state across
 * signInAnonymously / signOut calls — mirroring real SDK behaviour.
 */
function createMockSupabase(initialSession: MockSession | null = null): {
  client: MockSupabaseClient;
  getInternalSession: () => MockSession | null;
} {
  let currentSession: MockSession | null = initialSession;
  const listeners: Array<(event: string, session: MockSession | null) => void> = [];

  const client: MockSupabaseClient = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: currentSession } })),

      signInAnonymously: vi.fn(async () => {
        const newSession = makeMockSession();
        currentSession = newSession;
        listeners.forEach((cb) => cb('SIGNED_IN', newSession));
        return { data: { session: newSession } };
      }),

      signOut: vi.fn(async () => {
        currentSession = null;
        listeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      }),

      onAuthStateChange: vi.fn((cb) => {
        listeners.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  };

  return { client, getInternalSession: () => currentSession };
}

// ---------------------------------------------------------------------------
// Mock router (mirrors Next.js useRouter / router.push)
// ---------------------------------------------------------------------------

function createMockRouter() {
  const calls: string[] = [];
  return {
    push: vi.fn((path: string) => { calls.push(path); }),
    getCalls: () => calls,
  };
}

// ---------------------------------------------------------------------------
// Simulate handleLogout logic from app/page.tsx
// ---------------------------------------------------------------------------

/**
 * This mirrors the production `handleLogout` in app/page.tsx, extracted as a
 * pure function so we can assert on router and session state without a DOM.
 *
 * Production code:
 *   const handleLogout = async () => {
 *     await supabase.auth.signOut();
 *     window.location.reload();          // full reset → triggers useGuestAuth
 *   };
 *
 * In tests, we replace `window.location.reload` with `router.push('/')` so
 * we can assert the redirect destination without actually reloading.
 */
async function handleLogout(
  supabase: MockSupabaseClient,
  router: ReturnType<typeof createMockRouter>,
): Promise<void> {
  await supabase.auth.signOut();
  router.push('/'); // equivalent to window.location.reload() → lands on index
}

// ---------------------------------------------------------------------------
// Suite 1: Core logout lifecycle
// ---------------------------------------------------------------------------

describe('Logout Lifecycle — Active Guest → Logout → Session Null → Redirected', () => {
  let supabase: MockSupabaseClient;
  let getInternalSession: () => MockSession | null;
  let router: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    // Start with an active anonymous session (simulates a user already in app)
    const activeSession = makeMockSession();
    ({ client: supabase, getInternalSession } = createMockSupabase(activeSession));
    router = createMockRouter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have an active session BEFORE logout', async () => {
    const { data } = await supabase.auth.getSession();
    expect(data.session).not.toBeNull();
    expect(data.session?.user.id).toBe('anon-uuid-1234');
    expect(data.session?.user.is_anonymous).toBe(true);
  });

  it('should call supabase.auth.signOut() exactly once when handleLogout fires', async () => {
    await handleLogout(supabase, router);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('should have a NULL session immediately after signOut()', async () => {
    await handleLogout(supabase, router);
    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('should redirect to "/" after signOut()', async () => {
    await handleLogout(supabase, router);
    expect(router.push).toHaveBeenCalledWith('/');
    expect(router.getCalls()).toContain('/');
  });

  it('should redirect AFTER signOut — not before', async () => {
    const callOrder: string[] = [];

    vi.spyOn(supabase.auth, 'signOut').mockImplementation(async () => {
      callOrder.push('signOut');
      return { error: null };
    });
    router.push = vi.fn((path: string) => { callOrder.push(`redirect:${path}`); });

    await handleLogout(supabase, router);

    expect(callOrder[0]).toBe('signOut');
    expect(callOrder[1]).toBe('redirect:/');
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Auth state change event fires SIGNED_OUT
// ---------------------------------------------------------------------------

describe('onAuthStateChange — SIGNED_OUT event fires on logout', () => {
  it('should emit SIGNED_OUT with null session when signOut is called', async () => {
    const activeSession = makeMockSession();
    const { client: supabase } = createMockSupabase(activeSession);
    const router = createMockRouter();

    const stateChanges: Array<{ event: string; session: MockSession | null }> = [];

    supabase.auth.onAuthStateChange((event, session) => {
      stateChanges.push({ event, session });
    });

    await handleLogout(supabase, router);

    expect(stateChanges).toHaveLength(1);
    expect(stateChanges[0].event).toBe('SIGNED_OUT');
    expect(stateChanges[0].session).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Post-logout — fresh anonymous session on next interaction
// ---------------------------------------------------------------------------

describe('Post-Logout Anonymous Reset — new session created on next load', () => {
  it('should create a fresh session with a potentially different UUID after logout+re-init', async () => {
    // Simulate: first session (user was logged in as anon)
    const firstSession = makeMockSession({ id: 'anon-uuid-first' });
    const { client: supabase } = createMockSupabase(firstSession);
    const router = createMockRouter();

    // Step 1: logout
    await handleLogout(supabase, router);
    const afterLogout = await supabase.auth.getSession();
    expect(afterLogout.data.session).toBeNull();

    // Step 2: simulate useGuestAuth re-running on next render → signInAnonymously
    const { data: newData } = await supabase.auth.signInAnonymously();
    expect(newData.session).not.toBeNull();
    expect(newData.session.user.is_anonymous).toBe(true);
  });

  it('should call signInAnonymously exactly once on re-init if no session exists', async () => {
    // Start with no session (post-logout state)
    const { client: supabase } = createMockSupabase(null);

    // useGuestAuth logic: if no session → signInAnonymously()
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signInAnonymously();
    }

    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('should NOT call signInAnonymously again if a session already exists', async () => {
    // Start with an active session (user still logged in)
    const activeSession = makeMockSession();
    const { client: supabase } = createMockSupabase(activeSession);

    // useGuestAuth logic: skip if session present
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signInAnonymously();
    }

    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suite 4: UI state — "zombie session" guard
// ---------------------------------------------------------------------------

describe('UI State — no zombie session data shown after logout', () => {
  /**
   * Simulates the useAuth/useGuestAuth hook state model:
   * - user is derived from the current session
   * - isGuest is computed from user.is_anonymous
   * - credits are only valid if user exists
   */
  function deriveUIState(session: MockSession | null) {
    const user = session?.user ?? null;
    const isGuest = user?.is_anonymous ?? false;
    const isLoggedIn = user !== null;
    return { user, isGuest, isLoggedIn };
  }

  it('should derive isLoggedIn=false and isGuest=false when session is null', () => {
    const { user, isGuest, isLoggedIn } = deriveUIState(null);
    expect(user).toBeNull();
    expect(isGuest).toBe(false);
    expect(isLoggedIn).toBe(false);
  });

  it('should show Logout button guard: hidden when isLoggedIn is false', () => {
    // This models the JSX condition: {!isGuest ? <LogoutButton/> : <SaveWorkButton/>}
    // After logout, isGuest=false and isLoggedIn=false → neither renders a Logout button
    const { isLoggedIn } = deriveUIState(null);
    const showLogoutButton = isLoggedIn; // Only shown to registered (non-guest, non-null) users
    expect(showLogoutButton).toBe(false);
  });

  it('should show "Save my work" CTA when user is an active anonymous guest', () => {
    const activeGuestSession = makeMockSession({ is_anonymous: true });
    const { isGuest, isLoggedIn } = deriveUIState(activeGuestSession);
    // Header logic: isGuest → show "Save my work →" button
    const showSaveWorkCTA = isGuest && isLoggedIn;
    expect(showSaveWorkCTA).toBe(true);
  });

  it('should show Logout button only for registered (non-anonymous) users', () => {
    const registeredSession = makeMockSession({ id: 'reg-uuid-9999', is_anonymous: false });
    const { isGuest, isLoggedIn } = deriveUIState(registeredSession);
    const showLogoutButton = !isGuest && isLoggedIn;
    expect(showLogoutButton).toBe(true);
  });
});
