# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User"]
        BrowserUI["Browser UI"]
    end

    subgraph "Next.js Application"
        direction LR
        AuthPages["Auth Pages"]
        AuthServerActions["Auth Server Actions"]
        AuthMiddleware["Auth Middleware"]
        AppRouterPages["App Router Pages"]
        VideoUploadAPI["/api/upload-url (Video Processing API)"]
        ScriptGenerationAPI["/api/generate-script (AI Script API)"]
        HashtagGenerationAPI["/api/generate-hashtags (AI Hashtag API)"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Auth"]
        SupabaseDB["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        ExternalVideoProcessing["External Video Processing Service"]
        ExternalAILLM["External AI / LLM Model"]
    end

    %% Authentication Flow
    User --> BrowserUI["Browser UI: Initial Request"]
    BrowserUI --> AuthPages["Auth Pages: Sign-in/Sign-up"]
    AuthPages --> AuthServerActions["Auth Server Actions: Credential Submission"]
    AuthServerActions --> SupabaseAuth["Supabase Auth: Verify Credentials"]
    SupabaseAuth --> AuthServerActions["Auth Server Actions: Session Token"]
    AuthServerActions --> AuthMiddleware["Auth Middleware: Set Session Cookie"]
    AuthMiddleware --> AppRouterPages["App Router Pages: Redirect to App"]

    %% Main Application Flow - Video Upload & Processing
    AppRouterPages --> VideoUploadAPI["Video Upload API: Trigger Upload/Processing"]
    VideoUploadAPI --> SupabaseDB["Supabase Database: Store Video Metadata"]
    VideoUploadAPI --> SupabaseStorage["Supabase Storage: Upload Raw Video/URL"]
    VideoUploadAPI --> ExternalVideoProcessing["External Video Processing: Initiate Transcoding/Compression"]
    ExternalVideoProcessing --"Status Update/Processed URL"--> SupabaseDB["Supabase Database: Update Video Status"]
    SupabaseDB --> AppRouterPages["App Router Pages: Display Processed Video"]

    %% Main Application Flow - AI Content Generation
    AppRouterPages --> ScriptGenerationAPI["AI Script API: Request Script"]
    ScriptGenerationAPI --> SupabaseDB["Supabase Database: Fetch Video Context"]
    ScriptGenerationAPI --> ExternalAILLM["External AI / LLM Model: Generate Script"]
    ExternalAILLM --> ScriptGenerationAPI["AI Script API: Return Generated Script"]
    ScriptGenerationAPI --> SupabaseDB["Supabase Database: Store Generated Script"]
    ScriptGenerationAPI --> AppRouterPages["App Router Pages: Display Script"]

    AppRouterPages --> HashtagGenerationAPI["AI Hashtag API: Request Hashtags"]
    HashtagGenerationAPI --> SupabaseDB["Supabase Database: Fetch Video Context"]
    HashtagGenerationAPI --> ExternalAILLM["External AI / LLM Model: Generate Hashtags"]
    ExternalAILLM --> HashtagGenerationAPI["AI Hashtag API: Return Generated Hashtags"]
    HashtagGenerationAPI --> SupabaseDB["Supabase Database: Store Generated Hashtags"]
    HashtagGenerationAPI --> AppRouterPages["App Router Pages: Display Hashtags"]

    %% Data Flow for AI
    AppRouterPages <--> SupabaseDB["Supabase Database: Read/Write User Data, Content"]
```

*Last updated automatically by Gemini.*