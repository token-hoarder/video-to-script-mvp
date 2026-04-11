### 🛡️ SECRET PROTECTION POLICY

Zero Hardcoding: You are strictly forbidden from writing API keys (Gemini, Supabase, etc.) directly into the code.

Environment Only: All secrets must be read via process.env.

Commit Block: Never commit .env files. If you need a new environment variable, add it to .env.example with a placeholder value (e.g., GEMINI_API_KEY=your_key_here).

Verification: Before every git push, verify that no sensitive strings are present in the diff.