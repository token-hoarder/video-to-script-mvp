# System Architecture

```mermaid
graph LR
    subgraph Client["Client / Browser"]
        U["User Interaction"]
        FEUI["Frontend UI / Pages"]
    end

    subgraph NextApp["Next.js Application"]
        NJS["Next.js Server"]
        NJSAuth["Auth Middleware (Supabase)"]
        APILogin["Login API / Server Action"]
        APIUploadURL["Upload URL API"]
        APIGenScript["Generate Script API"]
    end

    subgraph Supabase["Supabase Cloud"]
        SBAuth["Supabase Auth"]
        SBDb["Supabase Database"]
        SBStorage["Supabase Storage"]
    end

    subgraph External["External Services"]
        ExAI["External AI Service"]
    end

    %% Initial Page Load / Authentication Flow
    U --> FEUI
    FEUI -- "Page Request" --> NJS
    NJS --> NJSAuth
    NJSAuth -- "Validate Session / Auth Cookie" --> SBAuth
    SBAuth -- "Session Valid" --> NJS
    NJS -- "Render Page" --> FEUI
    NJSAuth -- "Redirect to Login Page" --> FEUI

    %% Login/Signup Flow
    FEUI -- "Login/Signup Form Submit" --> APILogin
    APILogin -- "Authenticate User" --> SBAuth
    SBAuth -- "Return User Session" --> APILogin
    APILogin -- "Set Session Cookie / Redirect" --> FEUI

    %% Video Upload Flow
    FEUI -- "Request Pre-signed Upload URL" --> APIUploadURL
    APIUploadURL -- "Generate Signed URL" --> SBStorage
    SBStorage -- "Return Signed URL" --> APIUploadURL
    APIUploadURL -- "Send Signed URL" --> FEUI
    FEUI -- "Direct Video Upload" --> SBStorage
    SBStorage -- "Video Stored / Trigger" --> SBDb["Supabase Database"]

    %% AI Script Generation Flow
    FEUI -- "Trigger Script Generation" --> APIGenScript
    APIGenScript -- "Fetch Video Metadata / Context" --> SBDb
    APIGenScript -- "Call External AI Model" --> ExAI
    ExAI -- "Return Generated Script" --> APIGenScript
    APIGenScript -- "Store Script in DB" --> SBDb
    SBDb -- "Script Saved" --> APIGenScript
    APIGenScript -- "Return Script to Client" --> FEUI
```

*Last updated automatically by Gemini.*