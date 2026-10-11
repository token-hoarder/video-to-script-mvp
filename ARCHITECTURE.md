# System Architecture

```mermaid
graph LR
    %% Bounded Contexts
    subgraph Client / Browser
        A["User / Client App"]
    end

    subgraph Next.js Application
        B["Frontend UI (Pages/Components)"]
        C["Next.js Server Components / API Routes"]
        D["Auth Middleware (Next.js Edge Runtime)"]
    end

    subgraph Supabase Cloud
        E["Supabase Auth"]
        F["Supabase Database (Postgres)"]
        G["Supabase Storage (Video Files)"]
    end

    subgraph External Services
        H["External AI Service (e.g., Script, Hashtags)"]
        I["External Video Processing / Export Service"]
    end

    %% Flow: User Request Lifecycle
    A -- "1. Initial Page Load / Auth Request" --> D
    D -- "2. Authenticate User / Session Check" --> E
    E -- "3. Auth Token / Session Data" --> D
    D -- "4. Redirect / Render Page (Server)" --> B

    B -- "5. User Action (e.g., Upload Video)" --> C
    C -- "6. Authenticate Request" --> E
    E -- "7. Authorization Check" --> C
    C -- "8. Prepare Upload (e.g., Signed URL)" --> G
    G -- "9. Signed URL / Upload Path" --> C
    C -- "10. Respond with Upload Details" --> B
    B -- "11. Upload File Directly" --> G
    G -- "12. Upload Confirmation / Path" --> C
    C -- "13. Store Video Metadata / Trigger Processing" --> F
    F -- "14. Save Metadata / Job Queue" --> C
    C -- "15. Trigger Async Video Processing" --> I
    I -- "16. Process Video / Analyze" --> F
    F -- "17. Update Video Status / Analysis Results" --> C
    C -- "18. Notify Frontend (e.g., Polling/Webhook)" --> B

    B -- "19. User Action (e.g., Generate Script/Hashtags)" --> C
    C -- "20. Call External AI Service" --> H
    H -- "21. AI Generated Content" --> C
    C -- "22. Store Generated Content" --> F
    F -- "23. Save Confirmation" --> C
    C -- "24. Display Content in UI" --> B

    B -- "25. User Action (e.g., Save Reel State)" --> C
    C -- "26. Persist Reel Configuration" --> F
    F -- "27. Reel State Confirmation" --> C
    C -- "28. Display Confirmation" --> B

    B -- "29. User Action (e.g., Export Final Reel)" --> C
    C -- "30. Trigger Export Job" --> I
    I -- "31. Exported Reel URL / Status Update" --> F
    F -- "32. Export Status & URL" --> C
    C -- "33. Notify User / Provide Download Link" --> B
```

*Last updated automatically by Gemini.*