# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI"]
    end

    subgraph "Next.js Application"
        C["Next.js Router / Server"]
        D["Auth Middleware"]
        E["Next.js Server Actions (Auth)"]
        F["API Route: Upload Content URL"]
        G["API Route: Generate Script"]
        H["Server-side Data Logic"]
    end

    subgraph "Supabase Cloud"
        I["Supabase Auth Service"]
        J["Supabase Database"]
        K["Supabase Storage"]
    end

    subgraph "External Services"
        L["External AI Service"]
    end

    %% High-level Request Flow
    A -- "Initial Request / Interaction" --> C
    C -- "Serves UI / Routes Request" --> B
    C -- "Authenticates Request" --> D

    %% Authentication Flow
    D -- "Checks Session" --> I
    I -- "Session Status" --> D
    D -- "Authorizes / Redirects" --> C

    B -- "Submits Login Form" --> E
    E -- "Authenticates User" --> I
    I -- "Manages User Profile" --> J
    J -- "User Data" --> I
    I -- "Auth Token / Session" --> E
    E -- "Sets Session / Redirects" --> B

    %% Content Upload & Processing Flow
    B -- "Uploads Content URL" --> F
    F -- "Stores Metadata" --> J
    J -- "Content ID" --> F
    F -- "Returns Confirmation" --> B

    %% Script Generation Flow
    B -- "Requests Script Generation" --> G
    G -- "Sends Prompt / Data" --> L
    L -- "Returns Generated Script" --> G
    G -- "Stores Script" --> J
    J -- "Script ID" --> G
    G -- "Returns Script" --> B

    %% General Data / Storage Interaction
    H -- "Performs Data Operations" --> J
    J -- "Data Query Result" --> H
    H -- "Manages Object Storage" --> K
    K -- "File Reference / Content" --> H
    H -- "Renders Data" --> B
```

*Last updated automatically by Gemini.*