# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User Interaction"]
        LoginUI["Login Page UI"]
        MainAppUI["Main Application UI"]
    end

    subgraph "Next.js Application"
        NextAuth["Next.js Auth Middleware"]
        LoginActions["Login Server Actions"]
        FrontendPages["Next.js Pages & Components"]
        UploadURLAPI["Upload URL API Route"]
        GenerateScriptAPI["Generate Script API Route"]
        SupabaseClientUtils["Supabase Client/Server Utilities"]
    end

    subgraph "Supabase Cloud"
        AuthService["Supabase Auth Service"]
        PostgresDB["Supabase PostgreSQL Database"]
        StorageBucket["Supabase Storage Bucket"]
    end

    subgraph "External Services"
        AIService["External AI Service"]
        VideoProcessor["External Video Processing Service"]
    end

    %% Flow: Authentication
    User --> LoginUI
    LoginUI --> LoginActions
    LoginActions --> NextAuth
    NextAuth --> AuthService
    AuthService -- "Auth Token/Session" --> NextAuth
    NextAuth -- "Set Session Cookie" --> LoginUI
    LoginUI -- "Redirect to App" --> MainAppUI

    %% Flow: Initial Data Load / Display
    MainAppUI --> FrontendPages
    FrontendPages --> SupabaseClientUtils
    SupabaseClientUtils --> PostgresDB -- "Fetch User/Project Data" --> FrontendPages
    FrontendPages --> MainAppUI

    %% Flow: Upload URL / Video Processing
    MainAppUI -- "Submit Video URL" --> UploadURLAPI
    UploadURLAPI --> SupabaseClientUtils
    SupabaseClientUtils --> PostgresDB -- "Store Initial Video Metadata" --> UploadURLAPI
    UploadURLAPI --> VideoProcessor -- "Send URL for Processing" --> UploadURLAPI
    VideoProcessor -- "Processing Status/Results (Webhook/Callback)" --> UploadURLAPI
    UploadURLAPI --> SupabaseClientUtils
    SupabaseClientUtils --> PostgresDB -- "Update Video Metadata" --> UploadURLAPI
    UploadURLAPI -- "Confirmation/Update" --> MainAppUI

    %% Flow: Generate Script
    MainAppUI -- "Request Script Generation" --> GenerateScriptAPI
    GenerateScriptAPI --> AIService -- "Generate Script Prompt" --> GenerateScriptAPI
    AIService -- "Generated Script Response" --> GenerateScriptAPI
    GenerateScriptAPI --> SupabaseClientUtils
    SupabaseClientUtils --> PostgresDB -- "Save Generated Script" --> GenerateScriptAPI
    GenerateScriptAPI -- "Display Script" --> MainAppUI
```

*Last updated automatically by Gemini.*