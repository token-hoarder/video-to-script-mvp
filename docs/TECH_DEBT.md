# 🛠️ Technical Debt & Maintenance Ledger

## 🐛 Resolved Bug Record
- [x] **Zombie Cookie Logout Loop:** Fixed an issue where the user would be continuously rehydrated after logging out. Replaced buggy client-side `supabase.auth.signOut()` calling `router.refresh()` with a fully robust HTML `<form>` targeting a Next.js `logout` Server Action, explicitly deleting the cookie on the server before `revalidatePath('/')`.
- [x] **Custom AI Builder Silent Failure:** Fixed an issue where the custom AI generator failed silently on first use. It was previously relying on standard templates to trigger the video upload. Extracted the upload sequence to a shared `uploadVideoIfNeeded` utility.

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

## Audit: 2026-04-11 22:08
The new `.clinerules` file defines excellent policies and guardrails for the AI agent, promoting good development practices, security awareness, and project consistency. This is a valuable addition to the repository's governance.

Now, let's analyze the functional code changes for the hashtag generation feature.

---

## Code Review: Hashtag Generation Feature

### `app/api/generate-hashtags/route.ts` (API Endpoint)

**Overall:** The API route is well-structured, handles authentication, credit management, file processing, and interacts with the Gemini API effectively. Error handling is robust and user-friendly.

**Potential Issues:**

1.  **Security: SSRF Risk for `fileUrl` (Moderate)**
    *   The `fileUrl` is directly fetched (`await fetch(fileUrl)`) without explicit validation to ensure it points to a safe, external resource (e.g., from Supabase Storage). If this URL can be manipulated by a malicious user to point to internal network resources (`localhost`, internal IPs, `file://` protocol), it could lead to Server-Side Request Forgery (SSRF).
    *   **Recommendation:** Add validation to `fileUrl` to ensure it starts with expected protocols (`https://`) and/or restrict it to trusted domains (e.g., your Supabase bucket domain).

2.  **Performance: Synchronous File Deletion (Minor)**
    *   `fs.unlinkSync(tempFilePath)` is a synchronous operation within the `finally` block. While in most scenarios for cleanup it's fine, in a very high-concurrency environment, synchronous I/O can briefly block the event loop.
    *   **Recommendation:** Consider using `fs.promises.unlink(tempFilePath)` instead, and `await` it. This would require wrapping the `finally` block content in an `async` function or handling the promise.

3.  **Type Safety: `Readable.fromWeb(downloadRes.body as any)` (Minor)**
    *   The `as any` cast suggests a potential type mismatch or a need for better type inference for web streams. While it works at runtime, it bypasses TypeScript's checks.
    *   **Recommendation:** If `Readable.fromWeb` expects a specific type that `downloadRes.body` doesn't quite match, you might need to adjust imports or verify types. Often, `Readable.fromWeb(downloadRes.body)` works without `as any` if `stream` types are correctly configured for both Node.js and Web Streams.

4.  **Missing `require` for `stream/promises` and `stream` (Fix Required)**
    *   The lines `const { pipeline } = require('stream/promises');` and `const { Readable } = require('stream');` are using `require`, but the file is a TypeScript file in a modern Next.js project. This should ideally use ES module imports.
    *   **Recommendation:** Change to `import { pipeline } from 'stream/promises';` and `import { Readable } from 'stream';`.

### `app/hashtags/page.tsx` (Frontend Page)

**Overall:** The frontend page provides a good user experience with clear steps, loading states, credit display, and a thoughtful hashtag selection UI. The integration with client-side video optimization is a significant feature.

**Potential Issues:**

1.  **Performance/Bundle Size: Client-side FFmpeg (Moderate)**
    *   The comments `// If FFmpeg is available and needed...` imply client-side video optimization using FFmpeg (likely WebAssembly). While powerful, FFmpeg.wasm can significantly increase initial bundle size and be CPU-intensive for users, especially on less powerful devices or for large video files.
    *   **Recommendation:**
        *   **Monitor Performance:** Thoroughly test the optimization step with various video sizes and device types.
        *   **Lazy Loading:** Ensure FFmpeg.wasm and related assets are lazy-loaded only when `needsOptimization` returns true, to avoid loading them for all users.
        *   **Consider Server-side Optimization:** For very large files or to offload client CPU, consider sending the video directly to a serverless function that handles FFmpeg processing. This adds complexity but improves client performance.

2.  **User Experience: Optimization Time (Minor)**
    *   If video optimization takes a long time, the current UI shows `isAnalyzing`. It might be beneficial to have a distinct state (e.g., `isOptimizing`) with a specific message to inform the user about the video processing step before AI analysis begins.
    *   **Recommendation:** Add a separate loading state for optimization, e.g., `setOptimizationStatus('optimizing')`, to give more granular feedback.

3.  **Error Handling for `optimizeVideoForAI` (Minor)**
    *   The `optimizeVideoForAI` function is awaited, but its potential errors are not explicitly caught or handled. If optimization fails, the process will halt without user feedback beyond a general API error if the process continues to the server.
    *   **Recommendation:** Wrap the `optimizeVideoForAI` call in a `try...catch` block and toast an error message if it fails.

### `.clinerules` (Agent Guardrails)

**Overall:** This is an excellent addition. It clearly communicates expectations for the AI agent, fostering robust development practices, security, and project consistency.

**No issues.** This document is well-thought-out and comprehensive.

---

### Summary and Recommendations

The feature is well-designed and implemented, addressing core requirements like authentication, credit management, and AI integration. The error handling is commendable.

The primary areas for improvement revolve around **security for `fileUrl` validation** and **performance/UX considerations for client-side FFmpeg optimization**.

**Key Actionable Recommendations:**

1.  **API Route:** Implement strong validation for the `fileUrl` to prevent SSRF vulnerabilities. Update `require` statements to `import`.
2.  **Frontend Page:** Carefully evaluate the performance impact of client-side FFmpeg. Consider lazy loading, a dedicated optimization loading state, and client-side error handling for `optimizeVideoForAI`.

Good job on this new feature!
---
