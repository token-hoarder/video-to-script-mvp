# System Architecture

```mermaid
graph LR
    %% Subgraphs for Bounded Contexts
    subgraph "Client / Browser"
        User["User Interaction"]
        FrontendUI["Frontend UI (Pages & Components)"]
    end

    subgraph "Next.js Application"
        NextJSApp["Next.js Server (Pages/Layouts)"]
        AuthMiddleware["Auth Middleware (utils/supabase/middleware)"]
        ServerActions["Server Actions (login/actions.ts)"]
        APIRoutes["Next.js API Routes (app/api/...)"]
        VideoProcessingUtility["Video Processing Utility (utils/video-compressor.ts)"]
    end

    subgraph "Supabase Cloud"
        SupabaseAuth["Supabase Authentication"]
        SupabaseDB["Supabase Database"]
        SupabaseStorage["Supabase Storage"]
    end

    subgraph "External Services"
        AIMLService["External AI/ML Service"]
    end

    %% Flow Diagram
    User --> FrontendUI["Renders UI & Interacts"]

    %% 1. Initial Load & Authentication Flow
    FrontendUI -- "Request Page Load" --> NextJSApp["Render Server Component / Page"]
    NextJSApp --> AuthMiddleware["Check Session & Permissions"]
    AuthMiddleware -- "Auth Status" --> SupabaseAuth["Verify/Refresh Session"]
    SupabaseAuth --> AuthMiddleware
    AuthMiddleware --> NextJSApp["Serve Content / Redirect"]
    NextJSApp --> FrontendUI

    FrontendUI -- "Login/Logout Action" --> ServerActions["Handle Auth Request"]
    ServerActions --> SupabaseAuth["Authenticate User"]
    SupabaseAuth --> ServerActions
    ServerActions --> FrontendUI

    %% 2. Video Upload Flow
    FrontendUI -- "Upload Video File" --> APIRoutes["/api/upload-url (Generate Signed URL)"]
    APIRoutes --> SupabaseStorage["Provision Upload URL"]
    SupabaseStorage --> APIRoutes
    APIRoutes --> SupabaseDB["Store Video Metadata"]
    SupabaseDB --> APIRoutes
    APIRoutes --> FrontendUI["Confirm Upload & Display Status"]

    %% (Optional) Video Processing after upload or async
    APIRoutes -- "Trigger Processing" --> VideoProcessingUtility["Compress/Process Video"]
    VideoProcessingUtility --> SupabaseStorage["Store Processed Video"]

    %% 3. Script Generation Flow
    FrontendUI -- "Request Script Generation" --> APIRoutes["/api/generate-script"]
    APIRoutes --> AIMLService["Request Script (LLM Interaction)"]
    AIMLService -- "Generated Script" --> APIRoutes
    APIRoutes --> SupabaseDB["Save Generated Script"]
    SupabaseDB --> APIRoutes
    APIRoutes --> FrontendUI["Display Script"]

    %% 4. Hashtag Generation Flow
    FrontendUI -- "Request Hashtag Generation" --> APIRoutes["/api/generate-hashtags"]
    APIRoutes --> AIMLService["Request Hashtags (LLM Interaction)"]
    AIMLService -- "Generated Hashtags" --> APIRoutes
    APIRoutes --> SupabaseDB["Save Generated Hashtags"]
    SupabaseDB --> APIRoutes
    APIRoutes --> FrontendUI["Display Hashtags"]

    %% 5. Data Retrieval for UI
    NextJSApp -- "Fetch Data for Server Components" --> SupabaseDB["Retrieve Data (e.g., scripts, hashtags)"]
    SupabaseDB --> NextJSApp
```

*Last updated automatically by Gemini.*