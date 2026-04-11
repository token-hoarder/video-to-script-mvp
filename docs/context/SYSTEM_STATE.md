# System State & Technology Stack

> **Purpose:** Keeps any AI agent or new contributor immediately oriented on the tech stack,
> active architectural decisions, and the current state of each major system module.

---

## Tech Stack (As of April 2026)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 | Using Turbopack for builds |
| Language | TypeScript | 5.x | Strict mode enabled |
| Styling | Tailwind CSS | 4.x | With shadcn/ui components |
| Database | Supabase (Postgres) | Latest | `scripts` table for persistence |
| Auth | Supabase Auth | Latest | Currently email/password; OAuth pending |
| AI Engine | Google Gemini | `gemini-2.5-flash` | Multimodal via File API |
| Video Compression | `@ffmpeg/ffmpeg` | 0.12.x | WASM loaded from CDN (not bundled) |
| Hosting | Vercel | Hobby → Pro | `maxDuration = 60s` per API route |
| Animations | Framer Motion | Latest | Used in CaptionOverlay drag |

---

## React State Map (`app/page.tsx`)

These are the top-level states and what they control:

| State | Type | Purpose |
|---|---|---|
| `file` | `File \| null` | The raw user-selected video file |
| `videoPreviewUrl` | `string \| null` | `URL.createObjectURL()` for local preview |
| `uploadedVideoUrl` | `string \| null` | Public Supabase Storage URL — cached to skip re-upload |
| `scripts` | `ScriptsPayload \| null` | All AI-generated slot arrays from DB/API |
| `activeScriptId` | `string \| null` | Which script is driving the storyboard + overlay |
| `activeScriptBlocks` | `ScriptBlock[]` | The active array being rendered to overlay + editor |
| `pendingEdits` | `Record<number, string>` | Unsaved draft text keyed by segment index |
| `analyzingSlot` | `string \| null` | Which AI card is currently loading (localized spinner) |
| `refiningSlot` | `string \| null` | Which AI card is currently refining |
| `compressionProgress` | `number \| null` | 0–1 float for FFmpeg progress overlay (null = inactive) |
| `videoDuration` | `number` | Loaded from video `onLoadedMetadata` in seconds |
| `currentTime` | `number` | Updated every frame via `onTimeUpdate` |
| `captionPosition` | `{ x, y }` | Draggable overlay offset — user-controlled |
| `userScript` | `string` | Raw text for the Custom (manual) script slot |

---

## Module: Video Optimizer (`utils/video-compressor.ts`)

**Status: ✅ IMPLEMENTED**

- **Trigger:** Files > 20MB before upload
- **Target:** 720p, 30fps, H.264 `libx264`, CRF 28, `superfast` preset
- **WASM Loading:** Singleton — loaded once from `unpkg.com/@ffmpeg/core@0.12.6` on first use
- **Browser Requirement:** `SharedArrayBuffer` (requires COOP + COEP headers)
- **Headers in** `next.config.ts`:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
- **User-facing copy:** "Optimizing for AI Analysis" (never "lowering quality")
- **Output:** Returns a new `File` blob with `_optimized.mp4` suffix

---

## Module: AI Script Generation (`app/api/generate-script/route.ts`)

**Status: ✅ IMPLEMENTED — Modular mode active**

### Flow

```
POST /api/generate-script
  → Auth check (Supabase SSR cookie)
  → Cache check (existing scripts for this video_url + user_id)
  → Download video from Supabase Storage URL → temp file
  → Upload to Gemini File API → poll until ACTIVE
  → Build prompt based on mode (generateMode / refineRequest / customPrompt)
  → Parse JSON array response
  → Merge into existing DB record (safe, non-destructive)
  → Return { data: ScriptsPayload }
```

### Prompt Modes

| Mode | Trigger | Output |
|---|---|---|
| `generateMode` | Card "Generate Draft" clicked | Single slot `ScriptBlock[]` |
| `refineRequest` | "Refine" remix button used | Replaces single slot `ScriptBlock[]` |
| `customPrompt` | Custom AI text field submitted | Populates `custom_ai` slot |
| (none) | Legacy bulk mode | All 3 slots (deprecated path) |

### DB: `scripts` Table

```sql
id               UUID (PK)
user_id          UUID → auth.users
video_url        TEXT  -- Supabase Storage public URL (used as cache key)
generated_content JSONB -- ScriptsPayload shape
created_at       TIMESTAMPTZ
```

---

## Module: Auth (`app/login/`, middleware)

**Status: 🔄 In Progress — P0 Sprint**

- Currently: email/password only, hard redirect to `/login` if unauthenticated
- Planned: anonymous sign-in on first visit, Google OAuth upgrade path
- See `docs/context/AUTH_FLOW.md` for the full spec

---

## Module: Script Vault (`[P0] Upcoming`)

- Video hashing (SHA-256 of file bytes) to identify videos without storing them
- New `projects` Supabase table: maps `video_hash → ScriptsPayload`
- "Re-upload to Preview" flow for returning users
- See `ROADMAP.md` for task breakdown

---

## Known Constraints

| Constraint | Detail |
|---|---|
| Vercel `maxDuration` | 60s per API route (Hobby plan). Gemini processing can be slow for long videos. |
| Gemini File API | Videos are temporarily stored; deleted after processing. Re-generation requires re-upload to Gemini (not Supabase). |
| FFmpeg WASM | ~30MB initial CDN fetch. Cached after first use. Not available in Safari < 15.2. |
| COEP Headers | All external resources (fonts, images) must serve `crossorigin` headers or they'll be blocked. Supabase Storage URLs work fine. |
| Timing Engine | Currently pacing-based (130 wpm estimate). No real scene-cut detection via computer vision yet. |