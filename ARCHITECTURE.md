# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        User["User Interaction"]
        UI["Frontend UI"]
    end

    subgraph "Next.js Application"
        AM["Auth Middleware"]
        NSA["Next.js Server Actions"]
        NAR["Next.js API Routes"]
        SSC["Supabase Client/Server SDK"]
    end

    subgraph "Supabase Cloud"
        SA["Supabase Auth"]
        SD["Supabase Database"]
        SS["Supabase Storage"]
    end

    subgraph "External Services"
        ESAI["AI Content Generation"]
        ESVP["External Video Processing (Optional)"]
    end

    User -- "1. Access Page/Interact" --> UI
    UI -- "2. Initial Request / Page Load" --> AM
    AM -- "3. Authenticate Session" --> SA
    SA -- "4. Session Valid/Invalid" --> AM
    AM -- "5. Render UI (SSR/CSR)" --> UI

    UI -- "6. User Login/Action" --> NSA
    NSA -- "7. Authenticate User" --> SA
    SA -- "8. Update Session / User Data" --> NSA
    NSA -- "9. Update UI / Redirect" --> UI

    UI -- "10. Initiate Video Upload" --> NAR
    NAR -- "11. Request Signed Upload URL" --> SS
    SS -- "12. Return Signed URL" --> NAR
    NAR -- "13. Provide Signed URL" --> UI
    UI -- "14. Direct Video Upload" --> SS
    SS -- "15. Upload Confirmation" --> NAR
    NAR -- "16. Save Video Metadata" --> SD
    SD -- "17. Metadata Confirmation" --> NAR
    NAR -- "18. Notify UI of Upload Success" --> UI

    UI -- "19. Request AI Script/Hashtags" --> NAR
    NAR -- "20. Fetch Video Context / User Data" --> SD
    SD -- "21. Context Data" --> NAR
    NAR -- "22. Call External AI Service" --> ESAI
    ESAI -- "23. Generated Content" --> NAR
    NAR -- "24. Save Generated Content" --> SD
    SD -- "25. Save Confirmation" --> NAR
    NAR -- "26. Return Generated Content" --> UI

    NAR -- "27. Trigger Video Processing (e.g., Compression)" --> ESVP
    ESVP -- "28. Processed Video Output" --> SS
    SS -- "29. Store Processed Video" --> SD

```

*Last updated automatically by Gemini.*