# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User"]
        FrontendUI["Frontend UI (React Components)"]
    end

    subgraph "Next.js Application"
        NJS_AuthMiddleware["Auth Middleware (Supabase)"]
        NJS_LoginLogic["Login Logic (Server Actions)"]
        NJS_Pages["Next.js Pages (SSR / RSC)"]
        NJS_GenerateScriptAPI["API Route: /api/generate-script"]
        NJS_UploadURLAPI["API Route: /api/upload-url"]
    end

    subgraph "Supabase Cloud"
        S_Auth["Supabase Auth"]
        S_DB["Supabase Database (Postgres)"]
    end

    subgraph "External Services"
        E_AIScriptGen["AI Script Generation Service (e.g., OpenAI)"]
        E_VideoProcessor["Video Processing/Ingestion Service"]
    end

    %% 1. User Interaction and Initial Page Load
    User --> FrontendUI : "Navigates / Interacts"
    FrontendUI --> NJS_AuthMiddleware : "Browser Request (Page Load)"
    FrontendUI --> NJS_Pages : "Page Load / Client-side Action"

    %% 2. Authentication Flow
    NJS_AuthMiddleware --> S_Auth : "Verify Session"
    S_Auth --> NJS_AuthMiddleware : "Session Valid/Invalid"
    NJS_AuthMiddleware -- "Authenticated" --> NJS_Pages : "Access Protected Page"
    NJS_AuthMiddleware -- "Unauthenticated" --> FrontendUI : "Redirect to Login"

    FrontendUI -- "User Login" --> NJS_LoginLogic
    NJS_LoginLogic --> S_Auth : "Authenticate User Credentials"
    S_Auth --> NJS_LoginLogic : "Auth Response"
    NJS_LoginLogic --> FrontendUI : "Login Status / Redirect"

    %% 3. Generate Script Flow
    FrontendUI -- "Request Script" --> NJS_GenerateScriptAPI
    NJS_GenerateScriptAPI --> E_AIScriptGen : "Send Prompt & Parameters"
    E_AIScriptGen --> NJS_GenerateScriptAPI : "Return Generated Script"
    NJS_GenerateScriptAPI --> S_DB : "Save Script Metadata"
    S_DB --> NJS_GenerateScriptAPI : "Confirmation"
    NJS_GenerateScriptAPI --> FrontendUI : "Display Script"

    %% 4. Upload URL Flow
    FrontendUI -- "Submit Video URL" --> NJS_UploadURLAPI
    NJS_UploadURLAPI --> S_DB : "Save Video URL & Initial Metadata"
    S_DB --> NJS_UploadURLAPI : "Confirmation"
    NJS_UploadURLAPI --> E_VideoProcessor : "Trigger Async Processing (e.g., Message Queue)"
    E_VideoProcessor --> S_DB : "Update Video Status / Store Processed Data" %% Async callback/webhook to DB
    NJS_UploadURLAPI --> FrontendUI : "Upload Confirmation / Status"

    %% 5. Data Access for Next.js Pages (Server Components / Actions)
    NJS_Pages -- "Fetch User Data" --> S_DB : "Query Database"
    S_DB --> NJS_Pages : "Return Data"
    NJS_Pages -- "Access Session" --> S_Auth : "Get User Info"
    S_Auth --> NJS_Pages : "Return User Details"

    %% 6. General Responses
    NJS_Pages --> FrontendUI : "Rendered UI / Data"
```

*Last updated automatically by Gemini.*