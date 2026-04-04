# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        USR["User Interaction"]
        FE_UI["Frontend UI (Next.js)"]
    end

    subgraph "Next.js Application"
        NAM["Next.js Auth Middleware"]
        LSAP["Login / Auth Server Actions"]
        APIGS["Next.js API: Generate Script"]
        APIUV["Next.js API: Upload Video URL"]
    end

    subgraph "Supabase Cloud"
        SB_A["Supabase Auth"]
        SB_DB["Supabase Database"]
        SB_STO["Supabase Storage"]
    end

    subgraph "External Services"
        AI_S["External AI Service"]
    end

    %% User Request Lifecycle
    USR --> FE_UI

    %% 1. User Login/Authentication Flow
    FE_UI -- "1. Submit Credentials" --> LSAP
    LSAP -- "2. Authenticate User" --> SB_A
    SB_A -- "3. Session Token" --> LSAP
    LSAP -- "4. Set Auth Cookie" --> NAM
    NAM -- "5. Validate Session" --> SB_A
    SB_A -- "6. Validated" --> NAM
    NAM -- "7. Render UI" --> FE_UI

    %% 2. User Uploads Video URL Flow
    FE_UI -- "8. Upload Video URL" --> APIUV
    APIUV -- "9. Store URL/Metadata" --> SB_DB
    SB_DB -- "10. Confirmation" --> APIUV
    APIUV -- "11. Success Response" --> FE_UI

    %% 3. User Generates Script Flow
    FE_UI -- "12. Request Script" --> APIGS
    APIGS -- "13. Fetch Video Details" --> SB_DB
    SB_DB -- "14. Video Data" --> APIGS
    APIGS -- "15. Send for Analysis" --> AI_S
    AI_S -- "16. Generated Script" --> APIGS
    APIGS -- "17. Store Script" --> SB_DB
    SB_DB -- "18. Stored Confirmation" --> APIGS
    APIGS -- "19. Script Response" --> FE_UI
```

*Last updated automatically by Gemini.*