# 🗺️ Project Roadmap: AI Video Script Editor

## 🚀 Current Sprint (In Progress)

- [x] **[P0] Tiered Auth:** Anonymous Login + Credits. [DONE]
  - [x] Implement Anonymous Sign-ins for Guest Mode. [DONE — `hooks/useGuestAuth.ts`]
  - [x] Add a Credits System (3 tries for guests, 50 for registered). [DONE — `profiles` table + DB trigger + server-side guard]
  - [x] Implement IP-based Throttling. [DONE — `hashIp()` + in-memory store in API route]
  - [ ] Google OAuth upgrade path (`linkIdentity`). [DEFERRED — code is ready, needs Google Cloud Console OAuth app setup]

- [ ] **[P0] The Script Vault:** Persistence via Video Hashing (No storage costs).
  - [ ] Implement Video Fingerprinting (Hashing) to identify files without storing them.
  - [ ] Create a Supabase `projects` table to store saved scripts mapped to video hashes.
  - [ ] Add a 'Re-upload to Preview' workflow for returning users.

---

## 🛠️ Feature Backlog

### Priority 0: Stability & Infrastructure
- [x] **Pro Studio Sidebar UI:** Vertical module redesign. [DONE]
- [x] **Live Storyboard Editor:** Edit/Save/Undo script segments. [DONE]
- [x] **Media Optimizer:** `ffmpeg.wasm` client-side downscaling (4K → 720p @ 30fps, >20MB gate). [DONE]
- [ ] **Usage Analytics Log:** Track user behavior and editing habits.
  - [ ] Track exact script logs (AI-generated vs. user-edited versions).
  - [ ] Track Edit Distance — how much users modify the AI output.
  - [ ] Log metadata: video aspect ratios, preferred refinement modes, session length.
- [ ] **Continuous Maintenance:** Weekly AI Deep Audits + Tech Debt Sweeps.
- [x] **Media Optimizer:** (Fixed versioning & Error handling pending sweep).

### Priority 1: Value Add & Local "Gold Mines"
- [ ] **Bi-lingual Cinematic:** English ↔ Arabic poetic translations (UAE Special).
- [ ] **HDR Tone Mapping:** Ensure iPhone 4K HDR videos don't look "blown out."
- [ ] **Individual Copy Buttons:** Add clipboard utility to every segment.

### Priority 2: Growth & Search
- [ ] **Semantic Memory Bank:** Search old projects by script text (Vector search).
- [ ] **Social Export Cards:** Turn scripts into high-aesthetic text overlays for IG.

### Priority 3: Advanced Intelligence
- [ ] **Retention Score Predictor:** AI warning for "too much text" for shot length.
- [ ] **B-Roll Director:** AI suggests missing shots to fill narrative gaps.


---
*Last Updated: 2026-04-04 01:41 AM (GST)*
