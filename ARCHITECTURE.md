# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User"]
        BrowserUI["Browser UI (Next.js Hydrated)"]
    end

    subgraph "Next.js Application"
        NextPages["Next.js Frontend Pages (SSR/RSC)"]
        AuthMiddleware["Auth Middleware (Supabase)"]
        APIRouteUpload["API Route: Upload Video URL"]
        APIRouteGenerate["API Route: Generate Script"]
        SupabaseServerClient["Supabase Server Client"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Authentication Service"]
        SupabaseDB["Supabase Database (PostgreSQL)"]
    end

    subgraph "External Services"
        ExternalAI["External AI/LLM Service"]
    end

    %% Flow: Initial Page Load / Authentication
    User --> BrowserUI["Browser UI (Next.js Hydrated)"]
    BrowserUI --> NextPages["Next.js Frontend Pages (SSR/RSC)"]
    NextPages --> AuthMiddleware["Auth Middleware (Supabase)"]: "Check Session / Auth"
    AuthMiddleware --> SupabaseAuth["Supabase Authentication Service"]: "Verify Session"
    SupabaseAuth --> AuthMiddleware: "Session Status"
    AuthMiddleware --> NextPages
    NextPages --> BrowserUI: "Render Page"

    %% Flow: User Login (e.g., via Login Page actions.ts)
    BrowserUI -- "Login Request" --> AuthMiddleware
    AuthMiddleware -- "Sign In/Up" --> SupabaseAuth
    SupabaseAuth -- "Auth Token/Session" --> AuthMiddleware
    AuthMiddleware -- "Set Session / Redirect" --> BrowserUI

    %% Flow: Upload Video URL (via app/api/upload-url/route.ts)
    BrowserUI -- "Submit Video URL" --> APIRouteUpload["API Route: Upload Video URL"]
    APIRouteUpload --> SupabaseServerClient["Supabase Server Client"]
    SupabaseServerClient -- "Store URL/Metadata" --> SupabaseDB["Supabase Database (PostgreSQL)"]
    SupabaseDB --> SupabaseServerClient: "Confirmation"
    SupabaseServerClient --> APIRouteUpload: "Success/Error"
    APIRouteUpload --> BrowserUI: "Update UI"

    %% Flow: Generate Script (via app/api/generate-script/route.ts)
    BrowserUI -- "Request Script Generation" --> APIRouteGenerate["API Route: Generate Script"]
    APIRouteGenerate --> ExternalAI["External AI/LLM Service"]: "Prompt for Script"
    ExternalAI --> APIRouteGenerate: "Generated Script"
    APIRouteGenerate --> SupabaseServerClient["Supabase Server Client"]
    SupabaseServerClient -- "Store Generated Script" --> SupabaseDB["Supabase Database (PostgreSQL)"]
    SupabaseDB --> SupabaseServerClient: "Confirmation"
    SupabaseServerClient --> APIRouteGenerate: "Success/Error"
    APIRouteGenerate --> BrowserUI: "Display Script"
```

*Last updated automatically by Gemini.*