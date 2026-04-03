# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User"]
        FrontendUI["Frontend UI"]
        LoginPage["Login Page"]
    end

    subgraph "Next.js Application"
        AuthMiddleware["Auth Middleware"]
        AuthActions["Auth Actions"]
        GenerateScriptAPI["Generate Script API"]
        UploadURLAPI["Upload URL API"]
        SupabaseServerClient["Supabase Server Client"]
        SupabaseBrowserClient["Supabase Browser Client"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Auth"]
        SupabaseDatabase["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        AIScriptGeneration["AI Script Generation Service"]
        VideoProcessingService["Video Processing / Analysis"]
    end

    %% User Interaction & Navigation
    User --> FrontendUI
    User --> LoginPage

    %% Authentication Flow
    LoginPage -- "Credentials" --> AuthActions
    AuthActions -- "Sign In/Up Request" --> SupabaseAuth
    SupabaseAuth -- "Session/Token" --> AuthActions
    AuthActions -- "Set Session" --> SupabaseBrowserClient
    AuthActions -- "Redirect" --> LoginPage
    FrontendUI -- "Authenticated Request" --> AuthMiddleware
    AuthMiddleware -- "Validates Session" --> GenerateScriptAPI
    AuthMiddleware -- "Validates Session" --> UploadURLAPI

    %% Generate Script Flow
    FrontendUI -- "Request Script Generation" --> GenerateScriptAPI
    GenerateScriptAPI -- "Fetch Video Data" --> SupabaseServerClient
    SupabaseServerClient -- "Query/Update" --> SupabaseDatabase
    GenerateScriptAPI -- "Call AI Service" --> AIScriptGeneration
    AIScriptGeneration -- "Generated Script" --> GenerateScriptAPI
    GenerateScriptAPI -- "Save Script" --> SupabaseServerClient
    SupabaseServerClient -- "Insert/Update" --> SupabaseDatabase
    GenerateScriptAPI -- "Response with Script" --> FrontendUI

    %% Upload URL Flow
    FrontendUI -- "Submit Video URL" --> UploadURLAPI
    UploadURLAPI -- "Save URL/Metadata" --> SupabaseServerClient
    SupabaseServerClient -- "Insert/Update" --> SupabaseDatabase
    UploadURLAPI -- "Initiate Processing (Optional)" --> VideoProcessingService
    VideoProcessingService -- "Processing Status/Data" --> UploadURLAPI
    UploadURLAPI -- "Response with Status" --> FrontendUI

    %% General Data Access
    FrontendUI -- "Display Data" --> SupabaseBrowserClient
    SupabaseBrowserClient -- "Read Data" --> SupabaseDatabase
    SupabaseBrowserClient -- "Upload/Download" --> SupabaseStorage
    SupabaseServerClient -- "Read/Write" --> SupabaseDatabase
    SupabaseServerClient -- "Upload/Download" --> SupabaseStorage
```

*Last updated automatically by Gemini.*