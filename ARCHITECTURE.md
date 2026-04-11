# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User Interaction"]
        FrontendUI["Frontend UI / Pages"]
    end

    subgraph "Next.js Application"
        NextJSApp["Next.js Server / Client Runtime"]
        AuthMiddleware["Auth Middleware"]
        LoginPage["Login Page / Server Actions"]
        UploadAPI["Upload API (e.g., /api/upload-url)"]
        GenerateScriptAPI["Generate Script API (e.g., /api/generate-script)"]
        VideoProcessingLogic["Video Processing Logic"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Authentication"]
        SupabaseDB["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        AIMLService["AI/ML Service (e.g., LLM)"]
    end

    %% User Request Flows
    User --> FrontendUI
    FrontendUI -- "Initial Page Load / Navigation" --> NextJSApp

    NextJSApp -- "Authorizes Request" --> AuthMiddleware
    AuthMiddleware -- "Validates Session" --> SupabaseAuth
    SupabaseAuth -- "Session Status / User ID" --> NextJSApp

    FrontendUI -- "Submits Login Credentials" --> LoginPage
    LoginPage -- "Authenticates User" --> SupabaseAuth
    SupabaseAuth -- "Returns Auth Token / Session" --> NextJSApp

    FrontendUI -- "Uploads Video" --> UploadAPI
    UploadAPI -- "Stores File" --> SupabaseStorage
    SupabaseStorage -- "File URL / ID" --> UploadAPI
    UploadAPI -- "Triggers Processing" --> VideoProcessingLogic
    VideoProcessingLogic -- "Updates Video Metadata" --> SupabaseDB

    FrontendUI -- "Requests Script Generation" --> GenerateScriptAPI
    GenerateScriptAPI -- "Sends Video Context / Prompt" --> AIMLService
    AIMLService -- "Returns Generated Script" --> GenerateScriptAPI
    GenerateScriptAPI -- "Stores Script Data" --> SupabaseDB

    %% Data Fetching and Rendering
    NextJSApp -- "Fetches Application Data" --> SupabaseDB
    SupabaseDB -- "Application Data" --> NextJSApp
    NextJSApp -- "Renders UI / Data" --> FrontendUI
```

*Last updated automatically by Gemini.*