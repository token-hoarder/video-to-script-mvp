# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

### Fixed — 2026-04-05 (Maintenance Sweep)

#### `utils/video-compressor.ts`
- **Dependency version mismatch resolved.** The CDN `baseURL` inside `getFFmpeg()` was hardcoded to `@ffmpeg/core@0.12.6`, but `package.json` declares `^0.12.10`. The string has been updated to `@ffmpeg/core@0.12.10` so the JS shim, worker, and WASM binary are all sourced from the same release, eliminating the risk of a subtle API-surface mismatch at runtime.

#### `app/page.tsx`
- **Silent failure in video optimization patched.** The `try...finally` block around `optimizeVideoForAI()` swallowed any FFmpeg error without exposing it to the user. Replaced with `try...catch...finally` that:
  1. Surfaces the error message to the user via `toast.error`.
  2. Falls back gracefully to the original (unoptimized) file so the upload pipeline is not blocked.
  3. Still guarantees `setCompressionProgress(null)` runs in `finally` to clear the progress overlay.

### Documentation — 2026-04-05

- Removed resolved items from `docs/TECH_DEBT.md` § "Unresolved AI Audit Findings".
- Initialized `docs/changelog.md` (this file).
