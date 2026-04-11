## [2026-04-11] - Auto-Generated Update

**Features:**
*   Implemented `StudioContext` for persistent state management within the application.
*   Introduced a new AI-powered hashtag generation tool, enabling users to upload videos and receive intelligent, categorized hashtag suggestions. This feature includes user authentication, credit management, and video optimization.
*   Added `.clinerules` to establish comprehensive development policies, git workflow, and AI agent guardrails.

---

## [2026-04-11] - Auto-Generated Update

Implemented a global dark/light theme toggle, accompanied by a significant UI overhaul across the login and main application pages to enhance visual consistency and user experience. The guest upgrade toast notification now utilizes the unified `handleUpgrade` action.

---

## [2026-04-11] - Auto-Generated Update

feat: Revamped authentication system

*   Introduced a new authentication flow with Google OAuth integration for both sign-in and anonymous user upgrades.
*   Redesigned the login and signup pages for improved user experience.
*   Implemented loading states for all authentication actions and buttons, providing clearer visual feedback.
*   Enhanced the guest user "Save my work" process to seamlessly transition to a full account.

---

## [2026-04-11] - Auto-Generated Update

- Implemented a server-side logout action to enhance authentication flow.
- Improved video upload reliability and efficiency with client-side optimization and a more robust direct upload mechanism to Supabase Storage.
- Added specific error handling for Google Gemini AI service unavailability (503 errors).
- Introduced a new QA Automator workflow document detailing Playwright end-to-end test generation.

---

## [2026-04-11] - Auto-Generated Update

**Changelog Entry:**

**System Enhancements & Maintenance**

*   **Usage Guard**: Implemented IP-based request throttling and a credit system for script generation, enhancing the tiered authentication experience for anonymous and registered users.
*   **Automated Audits**: Introduced weekly AI-driven tech debt audits to continuously monitor and improve code quality, with findings automatically tracked via pull requests.
*   **Development Experience**: Added an `.env.example` file for streamlined environment setup and improved video optimization resilience with a fallback for failed compression.

---

