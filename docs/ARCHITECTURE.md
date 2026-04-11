# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        USR["User"]
        FEUI["Frontend UI (Next.js Pages/Components)"]
    end

    subgraph "Next.js Application"
        direction LR
        NM["Next.js Auth Middleware"]
        LSA["Login Server Actions"]
        AGS["API Route: Generate Script"]
        AUV["API Route: Upload Video/URL"]
        SSDK["Supabase SDK (Server/Client)"]
    end

    subgraph "Supabase Cloud"
        SAUTH["Supabase Authentication"]
        SDB["Supabase Database"]
        SSTOR["Supabase Storage"]
    end

    subgraph "External Services"
        AIS["AI Generation Service"]
        VPS["Video Processing Service"]
    end

    USR --> FEUI
    FEUI --> LSA["Login Server Actions (app/login/actions.ts)"]
    LSA --> SSDK["Supabase SDK (utils/supabase/server.ts)"]
    SSDK --> SAUTH["Supabase Authentication"]
    SAUTH --> SSDK
    SSDK --> NM["Next.js Auth Middleware (utils/supabase/middleware.ts)"]
    NM -- "Auth Check/Redirect" --> FEUI

    FEUI -- "Request AI Script" --> AGS["API Route: Generate Script (app/api/generate-script/route.ts)"]
    AGS --> AIS["AI Generation Service"]
    AIS -- "Generated Script" --> AGS
    AGS --> SDB["Supabase Database"]
    SDB -- "Script Saved" --> AGS
    AGS -- "Display Script" --> FEUI

    FEUI -- "Submit Video URL" --> AUV["API Route: Upload Video/URL (app/api/upload-url/route.ts)"]
    AUV --> SSTOR["Supabase Storage"]
    AUV --> SDB
    AUV --> VPS["Video Processing Service (Async Trigger)"]
    VPS -- "Processing Status Update" --> SDB
    AUV -- "Upload Confirmation" --> FEUI

    FEUI -- "Fetch Data" --> SSDK
    SSDK --> SDB
    SDB -- "Data" --> SSDK
    SSDK -- "Display Data" --> FEUI
```

*Last updated automatically by Gemini.*