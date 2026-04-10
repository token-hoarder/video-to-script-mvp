# 🛠️ Technical Debt & Maintenance Ledger

## 🐛 Resolved Bug Record
- [x] **Zombie Cookie Logout Loop:** Fixed an issue where the user would be continuously rehydrated after logging out. Replaced buggy client-side `supabase.auth.signOut()` calling `router.refresh()` with a fully robust HTML `<form>` targeting a Next.js `logout` Server Action, explicitly deleting the cookie on the server before `revalidatePath('/')`.
- [x] **Custom AI Builder Silent Failure:** Fixed an issue where the custom AI generator failed silently on first use. It was previously relying on standard templates to trigger the video upload. Extracted the upload sequence to a shared `uploadVideoIfNeeded` utility.

## 🏗️ Refactoring & Optimization
- [ ] **Standardize FFmpeg baseURL:** Ensure versioning is dynamic based on `package.json` rather than a hardcoded string. [cite: 32]