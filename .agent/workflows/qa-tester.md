---
description: How to act as a QA Automator and write End-to-End tests for new features.
---

# 🤖 The QA Automator Agent Workflow

When invoked, whether explicitly mapped to a new feature sprint or periodically checking UI coverage, follow these steps to autonomously generate Playwright E2E tests:

## Step 1: Identify the Feature Scope
- Read the sprint outline or feature description. 
- Identify the core user-facing interactive elements (e.g., File Uploads, Buttons, Forms, Error Modals) related to the feature.
- Find the specific `.tsx` layout files where these buttons/inputs are rendered to note down their CSS selectors, text content, and React component names.

## Step 2: Formulate the Scenario
- Write down a 3-4 step scenario:
  - Ex: **Setup:** User visits `/`, uploads video.
  - Ex: **Action:** Clicks "Generate Script".
  - Ex: **Assertion:** Waits for `ul > li` text array to appear and checks for success toast limit.

## Step 3: Scaffold the Test Script
- All E2E tests live in the `e2e/` folder.
- Follow the convention established in `e2e/auth.spec.ts`.
- Important patterns:
  - Use `await page.waitForLoadState('networkidle')` after major navigations or data fetches.
  - Use `.filter({ hasText: '...' })` for mapping interactive buttons mapped to Shadcn UI.
  - Rely on `expect(locator).toBeVisible()` or `.toHaveCount(0)` for strict validation without silent timeouts.

## Step 4: Run the Test
- **// turbo**
- Run `npx playwright test e2e/<new-test-file>.spec.ts --project=chromium --reporter=list`.
- If the test fails because the feature is buggy, *stop and fix the app code*.
- If the test fails because the assertion is flaky, *fix the playwright script*.

## Step 5: Document
- Only move the sprint to "Completed" when the Playwright suite turns green.
- Add an entry to `docs/TECH_DEBT.md` under "Tested Features".
