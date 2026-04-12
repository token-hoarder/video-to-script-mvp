# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        U["User"]
        FUI["Frontend UI (Pages, Forms)"]
    end

    subgraph "Next.js Application"
        AM["Auth Middleware"]
        SAA["Supabase Auth Server Actions"]
        VUA["Video Upload API"]
        CGA["Content Generation API"]
        DF["Data Fetching / Server Components"]
    end

    subgraph "Supabase Cloud"
        SA["Supabase Authentication"]
        SDB["Supabase Database"]
        SS["Supabase Storage"]
    end

    subgraph "External Services"
        AIML["AI/ML Language Model"]
    end

    %% Flow 1: Initial Page Load & Auth Check
    U --> FUI
    FUI -- "Page Request" --> AM
    AM -- "Validate Session" --> SA
    SA -- "Session Status" --> AM
    AM -- "Render Page" --> DF
    DF -- "Fetch Initial Data" --> SDB
    SDB -- "Data" --> DF
    DF --> FUI

    %% Flow 2: User Login / Authentication
    FUI -- "Login / SignUp Request" --> SAA
    SAA -- "Authenticate User" --> SA
    SA -- "User Session" --> SAA
    SAA -- "Set Auth Cookies" --> FUI

    %% Flow 3: Video Upload Process
    FUI -- "Request Signed Upload URL" --> VUA
    VUA -- "Generate Signed URL" --> SS
    SS -- "Signed URL" --> VUA
    VUA -- "Return Signed URL" --> FUI
    FUI -- "Direct Video Upload" --> SS
    SS -- "Upload Confirmation / Metadata" --> SDB

    %% Flow 4: Content Generation (Script / Hashtags)
    FUI -- "Generate Content Request" --> CGA
    CGA -- "Retrieve Context Data" --> SDB
    SDB -- "Context Data" --> CGA
    CGA -- "Query AI/ML Model" --> AIML
    AIML -- "Generated Content" --> CGA
    CGA -- "Store Results" --> SDB
    SDB -- "Results Saved" --> CGA
    CGA -- "Return Results" --> FUI

    %% General Data Display / Updates
    FUI -- "Display Data" --> U
    SAA -- "Redirect/Update UI" --> FUI
```

*Last updated automatically by Gemini.*