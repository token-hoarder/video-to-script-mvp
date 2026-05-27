# Graph Report - .  (2026-05-24)

## Corpus Check
- Corpus is ~27,906 words - fits in a single context window. You may not need a graph.

## Summary
- 302 nodes · 403 edges · 29 communities (19 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 12,800 input · 4,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Studio UI & Auth Pages|Studio UI & Auth Pages]]
- [[_COMMUNITY_Documentation & Architecture|Documentation & Architecture]]
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_Dev Dependencies & Tooling|Dev Dependencies & Tooling]]
- [[_COMMUNITY_shadcnui Component Config|shadcn/ui Component Config]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Anonymous Logout Unit Tests|Anonymous Logout Unit Tests]]
- [[_COMMUNITY_Guest Auth Unit Tests|Guest Auth Unit Tests]]
- [[_COMMUNITY_Script Generation API|Script Generation API]]
- [[_COMMUNITY_App Shell & Theme|App Shell & Theme]]
- [[_COMMUNITY_Core Script Data Contracts|Core Script Data Contracts]]
- [[_COMMUNITY_Guest Tier E2E Tests|Guest Tier E2E Tests]]
- [[_COMMUNITY_Hashtag Generation API|Hashtag Generation API]]
- [[_COMMUNITY_Supabase Auth Middleware|Supabase Auth Middleware]]
- [[_COMMUNITY_AI Code Review Script|AI Code Review Script]]
- [[_COMMUNITY_Auth E2E Tests|Auth E2E Tests]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Utility UI Icons|Utility UI Icons]]
- [[_COMMUNITY_Brand Assets (VercelNext.js)|Brand Assets (Vercel/Next.js)]]
- [[_COMMUNITY_Project README|Project README]]
- [[_COMMUNITY_Agent Rules Documentation|Agent Rules Documentation]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `cn()` - 16 edges
3. `Implementation Plan — Video-to-Script MVP` - 11 edges
4. `Button()` - 9 edges
5. `Supabase (Auth, DB, Storage)` - 9 edges
6. `scripts` - 8 edges
7. `System State & Technology Stack` - 8 edges
8. `useStudio()` - 7 edges
9. `useGuestAuth()` - 7 edges
10. `Auth Flow & Credit System Spec` - 7 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `System Architecture (docs/)` --semantically_similar_to--> `System Architecture (Root)`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → ARCHITECTURE.md
- `Docs Changelog` --semantically_similar_to--> `Project Changelog (Root)`  [INFERRED] [semantically similar]
  docs/CHANGELOG.md → CHANGELOG.md
- `Archive Changelog` --semantically_similar_to--> `Project Changelog (Root)`  [INFERRED] [semantically similar]
  docs/archive/CHANGELOG.md → CHANGELOG.md
- `POST()` --calls--> `headers`  [INFERRED]
  app/api/generate-script/route.ts → vercel.json

## Hyperedges (group relationships)
- **Credit Guard Flow: Auth + Credits + IP Throttle protecting Script Generation API** — concept_tiered_auth, concept_credit_system, concept_ip_throttling, concept_script_generation_api [EXTRACTED 1.00]
- **Video Upload Pipeline: Presigned URL + FFmpeg Compression + Supabase Storage** — concept_presigned_upload, concept_ffmpeg_wasm, concept_supabase, concept_upload_url_api [EXTRACTED 1.00]
- **AI CI/CD Automation: Gemini-powered changelog, architecture, and code review pipelines** — workflows_ai_pipeline_ai_automation_pipeline, workflows_pr_reviewer_ai_code_reviewer, concept_gemini_api, docs_tech_debt_tech_debt_ledger [EXTRACTED 1.00]
- **UI Icon Set** — public_file_file_icon, public_globe_globe_icon, public_window_browser_window_icon [INFERRED 0.75]

## Communities (29 total, 10 thin omitted)

### Community 0 - "Studio UI & Auth Pages"
Cohesion: 0.08
Nodes (29): LandingPage(), AppHeader(), CaptionOverlay(), CaptionOverlayProps, ScriptSidebar(), ScriptSidebarProps, ScriptsPayload, StoryboardDetails() (+21 more)

### Community 1 - "Documentation & Architecture"
Cohesion: 0.09
Nodes (40): QA Automator Agent Workflow, System Architecture (Root), Archive Changelog, Project Changelog (Root), Antigravity UI Design System, Next.js Auth Middleware (utils/supabase/middleware.ts), Credit Decrement Race Condition, Credit System (Guest vs Registered) (+32 more)

### Community 2 - "UI Component Library"
Cohesion: 0.16
Nodes (15): AuthButtons(), StoryboardDetailsProps, UploadZoneProps, cn(), Button(), buttonVariants, Card(), CardAction() (+7 more)

### Community 3 - "Dev Dependencies & Tooling"
Cohesion: 0.08
Nodes (23): devDependencies, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+15 more)

### Community 4 - "shadcn/ui Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @base-ui/react, class-variance-authority, clsx, @ffmpeg/core, @ffmpeg/ffmpeg, @ffmpeg/util, framer-motion (+13 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "Anonymous Logout Unit Tests"
Cohesion: 0.11
Nodes (13): activeGuestSession, activeSession, callOrder, { client: supabase }, firstSession, { isGuest, isLoggedIn }, { isLoggedIn }, MockSession (+5 more)

### Community 8 - "Guest Auth Unit Tests"
Cohesion: 0.13
Nodes (10): credits, persistedUserId, Profile, retrieved, sessionData, status, token, tokenAfterRefresh (+2 more)

### Community 9 - "Script Generation API"
Cohesion: 0.19
Nodes (11): delay(), fileManager, genAI, hashIp(), ipThrottleStore, isIpThrottled(), POST(), buildCommand (+3 more)

### Community 10 - "App Shell & Theme"
Cohesion: 0.28
Nodes (5): inter, metadata, ThemeProvider(), StudioProvider(), Toaster()

### Community 11 - "Core Script Data Contracts"
Cohesion: 0.33
Nodes (6): CaptionOverlay (Video Caption Sync), GenerateScriptRequest Interface, LegacySegment Interface (Deprecated), ScriptBlock Interface, ScriptsPayload Type, StoryboardDetailsProps Interface

### Community 12 - "Guest Tier E2E Tests"
Cohesion: 0.33
Nodes (5): badge, dummyVideoPath, fileInput, generateBtn, openWorkspaceBtn

### Community 13 - "Hashtag Generation API"
Cohesion: 0.50
Nodes (4): delay(), fileManager, genAI, POST()

### Community 14 - "Supabase Auth Middleware"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

## Knowledge Gaps
- **148 isolated node(s):** `framework`, `buildCommand`, `installCommand`, `config`, `name` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Dev Dependencies & Tooling`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Component Library` to `Runtime Dependencies`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `clsx` connect `Runtime Dependencies` to `UI Component Library`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `framework`, `buildCommand`, `installCommand` to the rest of the system?**
  _149 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Studio UI & Auth Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08244680851063829 - nodes in this community are weakly interconnected._
- **Should `Documentation & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `Dev Dependencies & Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._