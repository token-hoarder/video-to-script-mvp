# Product Specification: AI Video-to-Script Companion (MVP)

## 1. Overview
This is a Minimum Viable Product (MVP) for a micro-SaaS web application. The tool solves "blank page syndrome" for video creators by analyzing raw, silent b-roll footage and automatically generating perfectly timed voiceover scripts tailored for short-form video platforms (Instagram Reels, TikTok).

## 2. Tech Stack
* **Framework:** Next.js 14+ (App Router) using React.
* **Styling:** Tailwind CSS.
* **UI Components:** shadcn/ui (Lucide icons, Cards, Buttons, Drag-and-Drop zones, Loading Spinners).
* **Database, Auth & Storage:** Supabase.
* **AI Engine:** Gemini 1.5 Pro API (Google Generative AI SDK).
* **Hosting:** Vercel.

## 3. Core User Flow
1.  **Authentication:** User logs in via Supabase (Email/Password or Google OAuth).
2.  **Upload:** User drags and drops a raw video file (`.mp4`, `.mov`) into the upload zone.
3.  **Processing State:** A UI skeleton/spinner appears while the video uploads to cloud storage and is analyzed by the AI.
4.  **Results:** The UI displays three generated scripts (Funny, Aesthetic, Educational) in cleanly formatted cards.
5.  **Action:** The user clicks a "Copy to Clipboard" button next to their preferred script.

## 4. System Architecture & Data Flow
**Crucial constraint:** Vercel has strict serverless function payload limits (4.5MB). To handle video uploads, the frontend MUST NOT send the video file directly through a Next.js API route.
* **Step 1:** The frontend requests a presigned upload URL from Supabase Storage (or uses the Supabase client browser SDK to upload directly to the storage bucket).
* **Step 2:** Once uploaded, the Next.js backend passes the file URI (or base64 buffer if under limits, but URI preferred via Gemini File API) to the Gemini 1.5 Pro endpoint.
* **Step 3:** Gemini analyzes the video and returns a JSON object containing the scripts.
* **Step 4:** The backend saves the generated JSON to the Supabase database associated with the user's `user_id` for history tracking, then returns the JSON to the frontend.

## 5. Database Schema (Supabase)
**Table:** `scripts`
* `id` (uuid, primary key)
* `user_id` (uuid, foreign key to auth.users)
* `video_url` (text)
* `generated_content` (jsonb)
* `created_at` (timestamp)

## 6. AI Integration (Gemini API)
* **Model:** `gemini-1.5-pro` (Must use the vision/multimodal capabilities).
* **System Prompt:** "You are an expert short-form video scriptwriter for Instagram Reels and TikTok. Analyze the attached video file. Pay close attention to the visual elements, setting, and pacing. Your task is to output exactly three distinct voiceover scripts based on the video content: 
    1. A 'Funny/Relatable' script.
    2. An 'Aesthetic/Emotional' script. 
    3. An 'Educational/Hype' script.
    
    For each script, ensure it is under 20 seconds of spoken time. Provide the exact timestamp ranges (e.g., [00:00 - 00:05]) where the text should be spoken to match the visual action. Output ONLY a valid JSON object with the keys: 'funny', 'aesthetic', and 'educational'. Each key should contain an array of objects with 'timestamp' and 'text'."

## 7. UI/UX Requirements
* **Theme:** Modern, minimalist, dark-mode default. 
* **Dashboard:** A clean grid layout. The left side contains the upload dropzone. The right side displays the generated script cards.
* **Feedback:** Must include robust error handling (e.g., "File too large", "Unsupported format") and toast notifications for successful script copying.

## 8. Strict Developer Rules
* Do NOT use Redux. Use standard React state and React Context if necessary.
* Use Next.js Server Actions for database mutations.
* Ensure the Gemini API key is strictly kept in `.env.local` and never exposed to the client.
* Ensure all generated code is TypeScript strictly typed.