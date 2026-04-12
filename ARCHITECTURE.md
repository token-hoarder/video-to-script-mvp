# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI"]
    end

    subgraph "Next.js Application"
        NA["Auth Middleware"]
        NAL["Login Actions"]
        NJP["Next.js Pages & Components (SSR/CSR)"]
        NAVU["Video Upload API"]
        NAGS["Script Generation API"]
        NAGH["Hashtag Generation API"]
        NADAL["Data Access Layer"]
    end

    subgraph "Supabase Cloud"
        SA["Supabase Auth"]
        SS["Supabase Storage"]
        SDB["Supabase Database"]
    end

    subgraph "External Services"
        EGS["External AI (Script Generation)"]
        EGH["External AI (Hashtag Generation)"]
        EVP["External Video Processing (Optional)"]
    end

    %% User Request Flow
    A -- "Navigates to URL" --> B
    B -- "Initial Request / Page Load" --> NA
    NA -- "Check Session / Auth Status" --> SA
    SA -- "Auth Status / Session" --> NA
    NA -- "Redirect if Unauthorized" --> B
    B -- "Display Login Page" --> NJP
    B -- "Login Form Submit" --> NAL
    NAL -- "Authenticate User" --> SA
    SA -- "Auth Token / Session Cookie" --> B

    %% Core Application Features (Authenticated Flow)
    B -- "User Action: Studio Page" --> NJP
    NJP -- "Fetch Page Data (SSR)" --> NADAL
    NADAL -- "Query Database" --> SDB
    SDB -- "Data" --> NADAL
    NADAL -- "Return Data" --> NJP
    NJP -- "Render Page" --> B

    B -- "User Action: Upload Video" --> NAVU
    NAVU -- "Request Signed Upload URL" --> SS
    SS -- "Signed URL" --> NAVU
    NAVU -- "Save Video Metadata" --> SDB
    NAVU -- "Return Upload URL" --> B
    B -- "Upload Video File" --> SS

    B -- "User Action: Generate Script" --> NAGS
    NAGS -- "Retrieve Video Context" --> SDB
    NAGS -- "Call AI Model for Script" --> EGS
    EGS -- "Generated Script" --> NAGS
    NAGS -- "Save Script to DB" --> SDB
    NAGS -- "Return Script" --> B

    B -- "User Action: Generate Hashtags" --> NAGH
    NAGH -- "Retrieve Script/Video Context" --> SDB
    NAGH -- "Call AI Model for Hashtags" --> EGH
    EGH -- "Generated Hashtags" --> NAGH
    NAGH -- "Save Hashtags to DB" --> SDB
    NAGH -- "Return Hashtags" --> B

    %% Optional Video Processing
    SS -- "New Video Upload Event (Webhook/Trigger)" --> EVP
    EVP -- "Process Video / Transcode" --> SS
    EVP -- "Update Video Status/Metadata" --> SDB
```

*Last updated automatically by Gemini.*