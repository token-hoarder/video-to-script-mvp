# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Browser Frontend UI"]
    end

    subgraph "Next.js Application"
        C["Next.js Router"]
        D["Auth Middleware"]
        E["Login/Auth Actions"]
        F["Page Renderer (SSR/CSR)"]
        G["Upload API Route (/api/upload-url)"]
        H["Script Generation API Route (/api/generate-script)"]
        I["Hashtag Generation API Route (/api/generate-hashtags)"]
        J["Video Processing Logic"]
    end

    subgraph "Supabase Cloud"
        K["Supabase Authentication"]
        L["Supabase Database"]
        M["Supabase Storage"]
    end

    subgraph "External Services"
        N["External AI Model"]
    end

    % Initial Request Flow & Authentication
    A --> B: "Initiates Request"
    B --> C: "Sends HTTP Request"
    C -- "Intercepts Request" --> D
    D -- "Checks Session" --> K
    K --> D: "Session Status"
    D -- "Authenticated" --> F: "Proceed to Page"
    D -- "Unauthenticated" --> E: "Redirect to Login"

    % Login Flow
    B -- "Submits Login Form" --> E
    E --> K: "Authenticates User"
    K --> L: "Manages User Profiles"
    K --> E: "Returns Session Token"
    E --> F: "Sets Session Cookie"
    F --> B: "Renders Authenticated UI"

    % General Page Render & Data Fetching
    F -- "Fetches Data (e.g., Server Component)" --> L
    F -- "Retrieves Assets (e.g., Signed URLs)" --> M
    L --> F: "Returns Data"
    M --> F: "Returns Asset URLs"
    F --> B: "Displays Dynamic Content"

    % Video Upload Flow
    B -- "Uploads Video File" --> G
    G --> M: "Uploads to Storage"
    G --> L: "Records Video Metadata"
    G --> J: "Triggers Background Processing"
    J --> M: "Stores Processed Assets"
    J --> L: "Updates Video Status"
    G --> B: "Confirms Upload/Processing Status"

    % Script Generation Flow
    B -- "Requests Script Generation" --> H
    H --> L: "Retrieves Video/Context Data"
    H --> N: "Sends Prompt"
    N --> H: "Returns Generated Script"
    H --> L: "Stores Generated Script"
    H --> B: "Displays Generated Script"

    % Hashtag Generation Flow
    B -- "Requests Hashtag Generation" --> I
    I --> L: "Retrieves Script/Context Data"
    I --> N: "Sends Prompt"
    N --> I: "Returns Generated Hashtags"
    I --> L: "Stores Generated Hashtags"
    I --> B: "Displays Generated Hashtags"
```

*Last updated automatically by Gemini.*