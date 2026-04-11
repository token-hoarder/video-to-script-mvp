# Auth Flow & Credit System

> **Purpose:** Defines the authentication architecture and guest credit rules.
> This is the specification for the upcoming **[P0] Tiered Auth** sprint item.

---

## Current State (As-Built)

Auth is currently **email/password only** via Supabase, with a hard 401 redirect if no
session exists. The backend API (`/api/generate-script`) verifies the session via
`supabase.auth.getUser()` server-side using the SSR cookie client.

```
User → /login (email+password) → Supabase session cookie → Access to Studio
```

No anonymous mode exists yet. All actions require a permanent account.

---

## Target Architecture: Tiered Access

### Tier 1 — Anonymous Guest

```
User lands on app → Auto-called supabase.auth.signInAnonymously()
→ Supabase creates an anonymous user (real UUID, real session)
→ 3 credits allocated on the profiles table
→ User can generate up to 3 AI scripts total across all slots
```

**Credit deduction** happens **server-side** inside `/api/generate-script` before
calling Gemini — not client-side, to prevent tampering.

**IP Throttling** is applied on top of credits: max 5 attempts per IP per hour,
regardless of account switching, to prevent guest gaming.

### Tier 2 — Registered User (Google OAuth)

```
Guest clicks "Save my work" / "Sign in with Google"
→ supabase.auth.linkIdentity({ provider: 'google' })
→ Anonymous session is UPGRADED (not replaced) — same UUID is preserved
→ Scripts stored under that UUID are automatically retained
→ Credits reset to 50
```

> **Critical:** Use `linkIdentity()` not `signInWithOAuth()`. The latter creates a new
> user and orphans all the guest's saved scripts.

---

## Supabase Schema Changes Required

### `profiles` table (new)

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits     INTEGER NOT NULL DEFAULT 3,
  is_guest    BOOLEAN NOT NULL DEFAULT TRUE,
  ip_hash     TEXT,          -- Hashed IP for throttle tracking
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new user signup (including anonymous)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, is_guest)
  VALUES (
    NEW.id,
    CASE WHEN NEW.is_anonymous THEN 3 ELSE 50 END,
    NEW.is_anonymous
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## API Flow (Per Generation Request)

```
POST /api/generate-script
  │
  ├─ 1. getUser() → verify session exists
  ├─ 2. Check profiles.credits > 0  (error 402 if exhausted)
  ├─ 3. Check IP throttle bucket    (error 429 if exceeded)
  ├─ 4. Upload → Gemini → DB write  (existing flow)
  └─ 5. Decrement profiles.credits by 1
```

### Error Responses (new)

| Code | Scenario | User Message |
|------|----------|--------------|
| `402` | Zero credits | "You've used all 3 free analyses. Sign in with Google to get 50 credits." |
| `429` | IP throttled | "Too many requests. Please wait before trying again." |

---

## UX Rules

- **Never use the word "guest" in UI copy.** Use "Preview Mode" or "Exploring for free."
- **Credit counter** is displayed subtly in the header (e.g., `✦ 2 analyses left`).
- When credits hit 0, the "Generate Draft" button is replaced with a **"Unlock 50 Credits →"** CTA that opens the Google OAuth flow inline.
- On OAuth success, the UI updates the credit counter without a page reload (optimistic update).

---

## Data Merge on Upgrade

The anonymous → registered transition must preserve all scripts:

```ts
// After linkIdentity() resolves:
// Nothing to do — same user.id was preserved.
// All scripts rows in `scripts` table already belong to this UUID.

// Only update the profile:
await supabase
  .from('profiles')
  .update({ is_guest: false, credits: 50 })
  .eq('id', user.id);
```