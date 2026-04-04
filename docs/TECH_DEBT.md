# 🛠️ Technical Debt & Maintenance Ledger

## 🐛 Unresolved AI Audit Findings
- [ ] [cite_start]**Dependency Mismatch:** `@ffmpeg/core` is hardcoded to `0.12.6` in `video-compressor.ts` but `package.json` requires `^0.12.10`. 
- [ ] [cite_start]**Error Handling:** Add `try...catch` around `optimizeVideoForAI` in `app/page.tsx` to prevent silent failures. [cite: 36, 45]

## 🏗️ Refactoring & Optimization
- [ ] [cite_start]**Standardize FFmpeg baseURL:** Ensure versioning is dynamic based on `package.json`. [cite: 32]