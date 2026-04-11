# 🛠️ Technical Debt & Maintenance Ledger

## 🐛 Unresolved AI Audit Findings
_No open items._

## 🏗️ Refactoring & Optimization
- [ ] **Standardize FFmpeg baseURL:** Ensure versioning is dynamic based on `package.json` rather than a hardcoded string. [cite: 32]
## Audit: 2026-04-05 07:53
```markdown
## Code Review: `video-to-script-mvp` Diff

Overall, this is a substantial and well-structured set of changes, addressing critical authentication, usage, and maintenance features. The implementation of tiered authentication, IP throttling, and automated tech debt auditing demonstrates a solid understanding of both application development and operational best practices.

### Identified Issues & Recommendations:

1.  **Security Vulnerability (High) - `app/api/generate-script/route.ts`**
    *   **Issue:** The `IP_HASH_SALT` in `hashIp` falls back to `'default-salt'` if `process.env.IP_HASH_SALT` is not defined: `process.env.IP_HASH_SALT || 'default-salt'`. If the environment variable is missing, all IPs will be hashed with a known, public salt, rendering the anonymization ineffective and potentially vulnerable to precomputation attacks.
    *   **Recommendation:** Remove the `'default-salt'` fallback. The application should either fail to start or throw an explicit error if `IP_HASH_SALT` is not configured, forcing proper setup.

2.  **Logic Error / Race Condition (Medium) - `app/api/generate-script/route.ts`**
    *   **Issue:** The credit decrement logic (`credits: profile.credits - 1`) is not atomic. If a user makes two concurrent requests, both could read `profile.credits = 1`, and then both could successfully decrement it to 0, effectively granting two generations for one credit.
    *   **Recommendation:** Implement an atomic decrement. For PostgreSQL (Supabase), this typically means updating with a relative change and a condition:
        ```sql
        UPDATE profiles SET credits = credits - 1, updated_at = NOW() WHERE id = user_id AND credits > 0;
        ```
        In Supabase client, you can use:
        ```typescript
        const { error: creditError } = await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .gte('credits', 1); // Ensure credits are at least 1 before decrementing
        ```
        Or more robustly, fetch the current credits, then `update({ credits: dbCredits - 1 })` while adding a `match` clause for the original `dbCredits` to detect concurrent modifications, and retry if the match fails.

3.  **Performance / Reliability Trade-off (Low/Medium) - `app/api/generate-script/route.ts`**
    *   **Issue:** The `ipThrottleStore` is an in-memory `Map`. For serverless environments like Vercel, this store will reset on every cold start of the function, meaning the throttle might not be consistently applied across different invocations. A user could exceed the `IP_THROTTLE_MAX` if the serverless function frequently spins up new instances.
    *   **Recommendation:** Acknowledge this limitation. For stricter, persistent throttling, an external, shared state store (e.g., Redis, a dedicated database table) would be required. For a free-tier/MVP throttle, the current solution is acceptable given its simplicity and low operational overhead. Add a comment explaining this trade-off if it's not already documented.

4.  **Workflow Redundancy (Low) - `.github/workflows/pr-reviewer.yml`**
    *   **Issue:** The logic to create a tech debt PR (`Update the Tech Debt Ledger via a PR`) runs for `pull_request`, `push` to `main`, and `schedule` events. While the `if [ -s review_comment.md ]` check prevents empty PRs, running this on *every* push to `main` (even minor ones) and *every* PR might generate frequent, small tech debt PRs.
    *   **Recommendation:** Consider if tech debt ledger updates should *only* be triggered by the `schedule` event for weekly deep audits, or if the `pull_request` event should perhaps only add a comment to the PR itself *without* creating a `TECH_DEBT.md` PR. If you want to keep it for `push` and `pull_request`, ensure the AI's review logic is sophisticated enough to avoid re-reporting the same issues repeatedly, or that maintainers are aware they might need to consolidate these PRs.

### Minor Improvements:

*   **`app/page.tsx` - `handleLogout`:** The combination of `router.refresh()` and `window.location.href = '/'` is robust for ensuring a complete logout and state reset. Good practice.
*   **`app/page.tsx` - Video Optimization Error:** The fallback to upload the original file if `optimizeVideoForAI` fails is a great user experience improvement.

### Looks Great:

*   **Tiered Authentication & Credit System:** The `useGuestAuth` hook, server-side credit guard, `CreditBadge` component, and client-side UI/UX for credit exhaustion (with the "Unlock 50 Credits" toast) are excellently designed and implemented. This provides a smooth user journey from anonymous to registered.
*   **`ROADMAP.md` Updates:** Clear and concise updates, reflecting completed items and providing valuable context to the changes.
*   **`pr-reviewer.yml` - Tech Debt PRs:** Creating PRs for automated tech debt findings is a professional approach, allowing human review and discussion before merging to `main`. The use of `[skip ci]` in the commit message is also correct.
*   **`.env.example`:** Well-commented and includes crucial environment variables with clear instructions.
*   **IP Hashing:** The use of `createHash('sha256')` with a salt is appropriate for anonymizing IPs, *provided the salt is secure and not a default value*.

Overall, this is a well-engineered set of features. Addressing the security vulnerability with the default salt and the credit race condition are the highest priorities.
---
