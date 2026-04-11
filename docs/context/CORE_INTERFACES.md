# Core Interfaces & Data Contracts

> **Purpose:** Defines the canonical data structures used throughout the application.
> These interfaces are the **single source of truth**. Always use these exact shapes for
> both Custom and AI-generated scripts — this is what prevents the "Missing Overlay" bug.

---

## `ScriptBlock` — The Universal Segment Unit

Every script in the app, regardless of origin (Custom, AI persona, or AI Refine), is stored
and passed around as an **array of `ScriptBlock` objects**.

```ts
interface ScriptBlock {
  startTime: number;       // Float seconds, e.g. 1.5 (required for overlay matching)
  endTime: number;         // Float seconds, e.g. 3.2 (required for overlay matching)
  text: string;            // Spoken text, or the sentinel "[Visual Break]"
  visualTrigger?: string;  // AI-generated description of the visual moment (optional)
  isEdited?: boolean;      // True when block was created via Refine or Custom AI
}
```

### Critical Overlay Rule

`CaptionOverlay` finds the active block using:
```ts
currentTime >= block.startTime && currentTime <= block.endTime
```

**If `startTime` / `endTime` are missing, the overlay renders nothing.** This is the root
cause of the "AI captions not showing on video" bug that was fixed in the last major sprint.

### Legacy Format (Fallback Only)

The overlay also handles an older `timestamp` string format (`"00:01 - 00:05"`) for
backwards compatibility with any cached DB entries. Do **not** generate new scripts in
this format.

```ts
// Deprecated — only for reading old cached records:
interface LegacySegment {
  timestamp: string;  // e.g. "00:01 - 00:05"
  text: string;
}
```

---

## `ScriptsPayload` — The DB & State Container

The Supabase `generated_content` JSONB column and the in-memory `scripts` React state both
use this shape:

```ts
type ScriptsPayload = {
  aesthetic?:    ScriptBlock[];  // "Aesthetic Mode" persona
  funny?:        ScriptBlock[];  // "Funny / Meme Mode" persona
  educational?:  ScriptBlock[];  // "Educational Mode" persona
  custom_ai?:    ScriptBlock[];  // User's custom AI prompt output
  [key: string]: ScriptBlock[] | undefined; // Forward-compatible key indexing
};
```

Each key maps to a **flat array** of `ScriptBlock`. The API always writes only the
requested slot without overwriting others (safe merge pattern).

---

## `StoryboardDetailsProps` — Storyboard Editor Contract

The storyboard editor (`components/storyboard-details.tsx`) receives blocks as `any[]` but
expects the `ScriptBlock` shape. It normalizes both formats via `getTimestamps()`.

```ts
interface StoryboardDetailsProps {
  activeScriptId: string | null;           // 'custom' | 'aesthetic' | 'funny' | 'educational' | 'custom_ai'
  blocks: ScriptBlock[];                   // Must follow canonical ScriptBlock shape
  pendingEdits: Record<number, string>;    // { [segmentIndex]: draftText }
  onPendingEditChange: (idx: number, val: string) => void;
  onSaveSegment: (idx: number) => void;
  onUndoSegment: (idx: number) => void;
  onSaveAll: () => void;
  onScrubVideo: (time: number) => void;    // Sets video.currentTime = startTime
}
```

### `pendingEdits` Behavior

- On focus → `onScrubVideo(startTime)` is called immediately (scrub-on-focus)
- Dirty segments have a **blue left border** (`border-l-primary`) and a pulsing dot
- `pendingEdits` is passed to `CaptionOverlay` as an override so real-time drafts show on video

---

## API Response Contract

The `/api/generate-script` POST endpoint always returns:

```ts
// Success
{ data: ScriptsPayload }

// Error
{ error: string }   // Human-readable, never a raw stack trace
```

### Request Body

```ts
interface GenerateScriptRequest {
  fileUrl: string;          // Public Supabase Storage URL of the uploaded video
  generateMode?: string;    // 'aesthetic' | 'funny' | 'educational' — for modular generation
  refineRequest?: {
    slotId: string;
    currentBlocks: ScriptBlock[];
    instruction: string;    // e.g. "Make it more cinematic"
  };
  customPrompt?: string;    // For the Custom AI slot
  userScript?: string;      // (Legacy) full-text custom script
}
```