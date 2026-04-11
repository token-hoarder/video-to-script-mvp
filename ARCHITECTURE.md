# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User Interaction"]
        FrontendUI["Next.js Frontend UI"]
    end

    subgraph "Next.js Application"
        SSR["Next.js Server-Side Rendering"]
        AuthMiddleware["Supabase Auth Middleware"]
        AuthActions["Auth Server Actions"]
        UploadAPI["Video Upload API Route"]
        ScriptGenAPI["AI Script Generation API Route"]
        VideoProcessor["Video Processing Utility"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Authentication"]
        SupabaseDB["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        ExternalAI["External AI Service (LLM / Media Analysis)"]
    end

    %% Flow 1: Initial Page Load & Authentication Check
    User --> FrontendUI["Load Application"]
    FrontendUI --> SSR["Request Page"]
    SSR --> AuthMiddleware["Verify Session"]
    AuthMiddleware --> SupabaseAuth["Check Authentication"]
    SupabaseAuth -- "Session Status" --> AuthMiddleware
    AuthMiddleware -- "Render Page" --> SSR
    SSR --> FrontendUI["Display Content"]

    %% Flow 2: User Login
    FrontendUI -- "Submit Login Form" --> AuthActions["Handle Login"]
    AuthActions --> SupabaseAuth["Authenticate User"]
    SupabaseAuth -- "Auth Token/Session" --> AuthActions
    AuthActions -- "Set Session Cookie" --> FrontendUI
    AuthActions -- "Redirect/Refresh UI" --> FrontendUI

    %% Flow 3: Video Upload Process
    FrontendUI -- "Upload Video Request" --> UploadAPI["Initiate Upload"]
    UploadAPI --> SupabaseStorage["Get Upload URL/Perform Upload"]
    SupabaseStorage -- "Upload Success/URL" --> UploadAPI
    UploadAPI --> VideoProcessor["Trigger Video Processing"]
    VideoProcessor -- "Processed Video Metadata" --> SupabaseDB["Store Video Data"]
    SupabaseDB -- "Confirmation" --> UploadAPI
    UploadAPI -- "Upload Confirmation" --> FrontendUI

    %% Flow 4: AI Script Generation
    FrontendUI -- "Request AI Script" --> ScriptGenAPI["Process Script Request"]
    ScriptGenAPI --> SupabaseDB["Retrieve Video Metadata"]
    SupabaseDB -- "Video Details" --> ScriptGenAPI
    ScriptGenAPI --> ExternalAI["Send to AI for Analysis"]
    ExternalAI -- "Generated Script" --> ScriptGenAPI
    ScriptGenAPI --> SupabaseDB["Save Generated Script"]
    SupabaseDB -- "Script Saved" --> ScriptGenAPI
    ScriptGenAPI -- "Display Script" --> FrontendUI
```

*Last updated automatically by Gemini.*