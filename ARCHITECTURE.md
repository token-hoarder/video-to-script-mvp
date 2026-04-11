# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User Interaction"]
        FrontendUI["Next.js Frontend UI"]
    end

    subgraph "Next.js Application"
        NextApp["Next.js Runtime"]
        AuthMiddleware["Auth Middleware"]
        ServerActions["Next.js Server Actions (Auth)"]
        APIRoute_GenerateScript["API: Generate Script"]
        APIRoute_UploadURL["API: Upload Video URL"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Auth"]
        SupabaseDB["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        ExternalAIService["AI Script Generation Service"]
        ExternalVideoService["External Video Processing"]
    end

    %% Initial Load & Auth Check
    User --> FrontendUI
    FrontendUI -- Initial Page Load --> NextApp
    NextApp -- Auth Check (via middleware) --> AuthMiddleware
    AuthMiddleware -- Verifies Session --> SupabaseAuth
    SupabaseAuth -- Returns Session Status --> AuthMiddleware
    AuthMiddleware -- Passes Request --> NextApp

    %% User Login Flow
    FrontendUI -- Login Request --> ServerActions
    ServerActions -- Authenticates User --> SupabaseAuth
    SupabaseAuth -- Provides Session --> ServerActions
    ServerActions -- Sets Auth Cookies / Redirects --> FrontendUI

    %% Script Generation Flow
    FrontendUI -- Requests Script Generation --> APIRoute_GenerateScript
    APIRoute_GenerateScript -- Calls AI Model --> ExternalAIService
    ExternalAIService -- Returns Generated Script --> APIRoute_GenerateScript
    APIRoute_GenerateScript -- Saves Script Data --> SupabaseDB

    %% Video Upload/Processing Flow (via URL)
    FrontendUI -- Submits Video URL --> APIRoute_UploadURL
    APIRoute_UploadURL -- Initiates Processing --> ExternalVideoService
    ExternalVideoService -- Stores Processed Video Assets --> SupabaseStorage
    ExternalVideoService -- Notifies Completion / Metadata --> APIRoute_UploadURL
    APIRoute_UploadURL -- Saves Video Metadata --> SupabaseDB
```

*Last updated automatically by Gemini.*