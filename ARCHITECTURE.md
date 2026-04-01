# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI"]
    end

    subgraph "Next.js Application"
        C["Auth UI / Actions"]
        D["Auth Middleware"]
        E["Upload URL API"]
        F["Generate Script API"]
        G["Server-side Data Access"]
    end

    subgraph "Supabase Cloud"
        H["Supabase Auth"]
        I["Supabase Database"]
    end

    subgraph "External AI Services"
        J["AI/LLM Service"]
    end

    %% Flow definitions
    A -- "Interacts with" --> B
    B -- "Login Request" --> C
    C -- "Authenticates User" --> H
    H -- "Auth Session / Token" --> D
    B -- "Secured Request" --> D
    D -- "Authorized Request" --> E
    D -- "Authorized Request" --> F
    D -- "Authorized Request" --> G

    B -- "Submit URL" --> E
    E -- "Store Content URL" --> I

    B -- "Request Script" --> F
    F -- "Retrieve URL" --> I
    F -- "Send Content/Prompt" --> J
    J -- "Return Generated Script" --> F
    F -- "Store Generated Script" --> I

    G -- "Fetch Data" --> I
    I -- "Return Data" --> G
    G -- "Render Content" --> B
```

*Last updated automatically by Gemini.*