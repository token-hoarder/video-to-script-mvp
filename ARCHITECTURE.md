# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        A["User"]
        B["Frontend UI"]
    end

    subgraph "Next.js Application"
        C["Auth Middleware"]
        D["Login/Auth Server Actions"]
        E["API Route: Upload Video URL"]
        F["API Route: Generate Script"]
        G["Supabase Client/Server SDK"]
    end

    subgraph "Supabase Cloud"
        H["Supabase Authentication"]
        I["Supabase Database"]
        J["Supabase Storage"]
    end

    subgraph "External Services"
        K["AI Script Generation Service"]
        L["Video Processing Service"]
    end

    A --> B: "Accesses Application"
    B --> C: "Initial Request / Navigation"
    C --> D: "Redirect to Login (if unauthenticated)"
    D --> G: "Submits Login Credentials"
    G --> H: "Authenticates User"
    H --> C: "Auth Status / Session"
    C --> B: "Renders UI (authenticated / unauthenticated)"

    B --> E: "Submits Video URL for Upload"
    E --> G: "Upload Request"
    G --> J: "Stores Video URL / Metadata"
    J --> L: "Triggers Video Processing (Webhook / Storage Event)"
    L --> I: "Updates Video Processing Status"
    E --> B: "Confirmation / Status Update"

    B --> F: "Requests Script Generation"
    F --> I: "Fetches Video Details / Context"
    F --> K: "Sends Prompt for Script"
    K --> F: "Returns Generated Script"
    F --> I: "Stores Generated Script"
    F --> B: "Displays Generated Script"
```

*Last updated automatically by Gemini.*