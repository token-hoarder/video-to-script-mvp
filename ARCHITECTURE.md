# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User / Client Request"]
        B["Frontend UI / Page Rendering"]
        C["User Input / Actions (e.g., Form Submit, Click)"]
    end

    subgraph "Next.js Application"
        D["Auth Middleware (Edge Runtime)"]
        E["Next.js Server Actions / Page Data Fetch"]
        F["Next.js API Routes (e.g., /api/...)"]
        G["Supabase SDK Integration (Client/Server)"]
    end

    subgraph "Supabase Cloud"
        H["Supabase Auth Service"]
        I["Supabase Database (Postgres)"]
        J["Supabase Storage (Object Storage)"]
    end

    subgraph "External Services"
        K["AI - Script Generation API"]
        L["AI - Hashtag Generation API"]
        M["External Video Processing Service"]
    end

    %% User Authentication Flow
    A --> D
    D -- "Session Check" --> H
    H -- "Session Status" --> D
    D -- "Authenticated" --> B
    D -- "Unauthenticated / Login Required" --> E
    E -- "Login / Signup Request" --> H
    H -- "Session Created" --> E
    E -- "Redirect / Auth Success" --> B

    %% Video Upload Flow
    C -- "Upload Video Action" --> B
    B -- "Initiate Upload Request" --> F
    F --> G
    G -- "Get Signed URL / Direct Upload" --> J
    J -- "Upload Success / URL" --> G
    G --> F
    F -- "Store Video Metadata" --> I
    I -- "Metadata Stored" --> F
    F -- "Confirmation" --> B
    J -- "New Object Event (Optional Trigger)" --> M
    M -- "Processed Video / Metadata Update" --> J
    M -- "Processed Video / Metadata Update" --> I

    %% AI Script Generation Flow
    C -- "Generate Script Action" --> B
    B -- "Generation Request" --> F
    F -- "Fetch Video / Context" --> I
    I -- "Video / Context Data" --> F
    F -- "Call AI Service" --> K
    K -- "Generated Script" --> F
    F -- "Store Script" --> I
    I -- "Script Stored" --> F
    F -- "Return Script" --> B

    %% AI Hashtag Generation Flow
    C -- "Generate Hashtags Action" --> B
    B -- "Generation Request" --> F
    F -- "Fetch Video / Script Context" --> I
    I -- "Video / Script Data" --> F
    F -- "Call AI Service" --> L
    L -- "Generated Hashtags" --> F
    F -- "Store Hashtags" --> I
    I -- "Hashtags Stored" --> F
    F -- "Return Hashtags" --> B

    %% General Data Fetching / Interaction
    B -- "Load Page Data" --> E
    E --> G
    G -- "Query Data" --> I
    I -- "Return Data" --> G
    G --> E
    E -- "Render Data" --> B

    %% Supabase SDK bridging Next.js Application and Supabase Cloud
    F --> G
    E --> G
    G --> H
    G --> I
    G --> J
```

*Last updated automatically by Gemini.*