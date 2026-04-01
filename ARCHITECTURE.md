# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI"]
    end

    subgraph "Next.js Application"
        C["Auth Middleware"]
        D["Next.js Server Components / Pages"]
        E["Login Server Actions"]
        F["API Route: Upload URL"]
        G["API Route: Generate Script"]
    end

    subgraph "Supabase Cloud"
        H["Supabase Auth"]
        I["Supabase Database"]
        J["Supabase Storage"]
    end

    subgraph "External Services"
        K["External Video Processing Service"]
        L["External AI / LLM Service"]
    end

    %% Flow: User Authentication
    A --> B: "Access Login Page"
    B -- "Submit Credentials" --> E
    E -- "Verify User" --> H: "Auth Request"
    H -- "User Session / Token" --> E
    E -- "Set Cookie / Redirect" --> C
    C -- "Authenticated Request" --> D: "Load Main App"

    %% Flow: Main Application Load (Authenticated)
    A --> C: "Load App (Authenticated)"
    C -- "Validated Session" --> D
    D -- "Fetch User Data / Content" --> I

    %% Flow: Upload Video/URL for Processing
    B -- "Upload Video URL" --> F
    F -- "Store URL Metadata" --> I
    F -- "Enqueue Video Processing Task" --> K
    K -- "Process Video Content" --> J: "Store Processed Assets"
    K -- "Update Processing Status" --> I

    %% Flow: Generate Script
    B -- "Request Script Generation" --> G
    G -- "Retrieve Video Data / User Context" --> I
    G -- "Prompt AI Model" --> L
    L -- "Generated Script Text" --> G
    G -- "Store Generated Script" --> I
    G -- "Return Script" --> D
    D -- "Display Script" --> B
```

*Last updated automatically by Gemini.*