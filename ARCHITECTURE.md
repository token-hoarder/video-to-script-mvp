# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User"]
        BrowserUI["Frontend UI / Pages"]
        ClientAuthActions["Client Auth Actions"]
        FileUploadUI["Video Upload Interface"]
    end

    subgraph "Next.js Application"
        NextJSFrontend["Next.js Frontend (Server & Client Components)"]
        AuthMiddleware["Auth Middleware (Supabase Integration)"]
        ServerActions["Server Actions (e.g., Login/Signup)"]
        APIRoutes["Next.js API Routes"]
        SupabaseIntegrationServer["Supabase Client (Server-side)"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Auth Service"]
        SupabaseDatabase["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        ExternalAI["External AI Service (LLMs, Video Analysis)"]
        ExternalVideoProcessing["External Video Processing"]
    end

    User --> BrowserUI["Navigates, Interacts"];

    BrowserUI --> NextJSFrontend["Request Page / Data"];
    NextJSFrontend --> AuthMiddleware["Check Session / Route Protection"];
    AuthMiddleware --> SupabaseAuth["Verify Session / Token"];
    SupabaseAuth --> AuthMiddleware["Session Status"];
    AuthMiddleware --> NextJSFrontend["Allow / Redirect"];

    ClientAuthActions --> ServerActions["Submit Login / Signup"];
    ServerActions --> SupabaseIntegrationServer["Perform Auth Operation"];
    SupabaseIntegrationServer --> SupabaseAuth["Authenticate User / Create Account"];
    SupabaseAuth --> SupabaseIntegrationServer["Auth Result"];
    SupabaseIntegrationServer --> ServerActions["Return Auth Status"];
    ServerActions --> BrowserUI["Update UI / Redirect"];

    FileUploadUI --> APIRoutes["Call Upload API (upload-url)"];
    APIRoutes --> SupabaseIntegrationServer["Handle Video Upload / Metadata"];
    SupabaseIntegrationServer --> SupabaseStorage["Upload Video File"];
    SupabaseStorage --> ExternalVideoProcessing["Trigger Processing (Webhook/Queue)"];
    ExternalVideoProcessing --> SupabaseStorage["Store Processed Output"];
    SupabaseStorage --> SupabaseIntegrationServer["Notify Processing Complete"];
    SupabaseIntegrationServer --> SupabaseDatabase["Update Video Status / Details"];
    SupabaseDatabase --> SupabaseIntegrationServer["Status Saved"];
    SupabaseIntegrationServer --> APIRoutes["Return Status"];
    APIRoutes --> BrowserUI["Update Upload UI"];

    BrowserUI --> APIRoutes["Call AI APIs (generate-script, generate-hashtags)"];
    APIRoutes --> ExternalAI["Send Context / Prompt"];
    ExternalAI --> APIRoutes["Return AI Generated Content"];
    APIRoutes --> SupabaseIntegrationServer["Save Generated Content"];
    SupabaseIntegrationServer --> SupabaseDatabase["Store Script / Hashtags"];
    SupabaseDatabase --> SupabaseIntegrationServer["Content Saved"];
    SupabaseIntegrationServer --> APIRoutes["Confirm Save"];
    APIRoutes --> BrowserUI["Display Generated Content"];

    NextJSFrontend --> SupabaseIntegrationServer["Fetch/Mutate Data (SSR/API)"];
    SupabaseIntegrationServer --> SupabaseDatabase["Query Database"];
    SupabaseDatabase --> SupabaseIntegrationServer["Query Result"];
    SupabaseIntegrationServer --> NextJSFrontend["Provide Data"];
    NextJSFrontend --> BrowserUI["Render Data"];
```

*Last updated automatically by Gemini.*