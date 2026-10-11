# Timed-text reel workflow

The studio turns existing footage and a creator's message into readable text
cards. It does not transcribe speech or generate a voiceover.

- MP4/MOV, 2–60 seconds, at most 30 MiB. The server reads the movie header.
- English, Hindi and Hinglish. Draft timing is fitted to reading speed, then
  validated. User edits must pass the same non-overlap and readability checks.
- Preview and export use the same canvas text renderer, including Hindi shaping.
- Export preserves source audio and aspect ratio, caps the longest side at 720
  pixels, and runs FFmpeg on the user's device. Keep the page open. Very old or
  memory-constrained phones may need smaller clips.

## Deployment and access

Apply the migrations in `supabase/migrations`, enable anonymous Supabase Auth,
and configure the environment variables shown in `.env.example`. The random
server processing secret must match the SHA-256 hash in
`reel_private.settings.secret_hash`; never publish the secret.
The database schema is private and stores no source video or draft text.

Credit reservations are serialized and authenticated. Failed requests refund
once; unfinished reservations recover after three minutes when the balance is
read. A five-per-hour limit is shared across a user and an anonymized IP hash.
The limit counts failed attempts as well as successful analyses.

The `videos` bucket is private; authenticated guests can access only their own
folder. Temporary Supabase and Gemini files are removed after requests. A hard
process termination can interrupt cleanup, so these files should not be treated
as a permanent archive or as guaranteed immediate deletion.

FFmpeg runtime files are served from `public/ffmpeg`. See its README for versions
and licensing/source references. Keep these files in sync with their npm packages.

## Verification

`npm test` covers upload ownership, media duration, draft fitting, reading time,
and existing utilities. `npm run build` verifies the production app. Release
checks also exercise anonymous authentication, credit concurrency/refunds,
cross-folder upload rejection, and a real browser MP4 export with original audio.
