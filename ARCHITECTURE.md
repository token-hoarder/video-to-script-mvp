# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI (Next.js Pages/Components)"]
        C["Login Form"]
    end

    subgraph "Next.js Application"
        D["Auth Middleware (Next.js Server)"]
        E["Server Components / Actions"]
        F["Generate Script API Route"]
        G["Upload URL API Route"]
    end

    subgraph "Supabase Cloud"
        H["Supabase Authentication"]
        I["Supabase Database (Postgres)"]
        J["Supabase Storage (Object Storage)"]
    end

    subgraph "External Services"
        K["AI Script Generation Service"]
        L["Video Processing Service"]
    end

    %% Flow 1: User Login
    A -- "Navigates to Login" --> C
    C -- "Submits Credentials" --> E
    E -- "Requests Authentication" --> H
    H -- "Authenticates User & Returns Session" --> E
    E -- "Sets Session Cookie / Auth Token" --> D
    E -- "Redirects / Updates UI" --> B

    %% Flow 2: Accessing Protected Content
    A -- "Accesses Protected Page" --> B
    B -- "Server Component Request" --> D
    D -- "Validates Session" --> H
    H -- "Returns User Context / Validation" --> D
    D -- "Allows Access to Server Components" --> E
    E -- "Renders Protected Content" --> B

    %% Flow 3: Generating a Script
    A -- "Submits Script Request" --> B
    B -- "Calls Generate Script API" --> F
    F -- "Authenticates Request" --> D
    D -- "Validates User Session" --> F
    F -- "Stores Request/Context Metadata" --> I
    F -- "Sends Request for Script Generation" --> K
    K -- "Returns Generated Script" --> F
    F -- "Saves Generated Script" --> I
    I -- "Confirms Save" --> F
    F -- "Returns Script to Client" --> B

    %% Flow 4: Uploading a Video URL
    A -- "Enters Video URL" --> B
    B -- "Calls Upload URL API" --> G
    G -- "Authenticates Request" --> D
    D -- "Validates User Session" --> G
    G -- "Stores Video Metadata & Status (e.g., 'Pending')" --> I
    G -- "Triggers Video Processing" --> L
    L -- "Downloads & Processes Video" --> L
    L -- "Uploads Processed Video Assets" --> J
    J -- "Stores Video Files" --> L
    L -- "Updates Video Metadata & Status (e.g., 'Completed')" --> I
    I -- "Confirms Update" --> G
    G -- "Returns Processing Confirmation / Status" --> B
```

*Last updated automatically by Gemini.*