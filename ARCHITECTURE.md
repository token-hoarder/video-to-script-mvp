# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        U["User"]
        FE["Frontend UI"]
    end

    subgraph "Next.js Application"
        AM["Auth Middleware"]
        ASA["Auth Server Actions"]
        subgraph "API Routes"
            UAPI["Upload Video API"]
            GSAPI["Generate Script API"]
            GHAPI["Generate Hashtags API"]
        end
    end

    subgraph "Supabase Cloud"
        SA["Supabase Auth"]
        SD["Supabase Database"]
        SS["Supabase Storage"]
    end

    subgraph "External Services"
        EAI["External AI Service"]
    end

    %% User Interaction and Auth Flow
    U -- "Interacts" --> FE
    FE -- "Login Request (Client/Server Actions)" --> ASA
    ASA -- "Authenticate User" --> SA
    SA -- "Session/Token" --> ASA
    ASA -- "Set Cookie / Redirect" --> FE
    AM -- "Verify Session" --> SA
    SA -- "Session Valid" --> AM
    AM -- "Allow Access to Page" --> FE

    %% Content Upload Flow
    FE -- "Video Upload Request" --> UAPI
    UAPI -- "Get Signed URL / Upload File" --> SS
    SS -- "Upload Acknowledge / URL" --> UAPI
    UAPI -- "Store Video Metadata" --> SD
    SD -- "Metadata Stored" --> UAPI
    UAPI -- "Success Response" --> FE

    %% AI Generation Flow (Script)
    FE -- "Request Script Generation" --> GSAPI
    GSAPI -- "Invoke LLM for Script" --> EAI
    EAI -- "Generated Script Content" --> GSAPI
    GSAPI -- "Store Script Data" --> SD
    SD -- "Script Data Stored" --> GSAPI
    GSAPI -- "Return Script to UI" --> FE

    %% AI Generation Flow (Hashtags)
    FE -- "Request Hashtag Generation" --> GHAPI
    GHAPI -- "Invoke LLM for Hashtags" --> EAI
    EAI -- "Generated Hashtags List" --> GHAPI
    GHAPI -- "Store Hashtags Data" --> SD
    SD -- "Hashtags Data Stored" --> GHAPI
    GHAPI -- "Return Hashtags to UI" --> FE
```

*Last updated automatically by Gemini.*