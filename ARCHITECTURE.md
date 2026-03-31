# System Architecture

```mermaid
graph LR
    subgraph "Client / Browser"
        USR["User"]
        BROWSER["Web Browser"]
    end

    subgraph "Next.js Application"
        NEXT_UI["Next.js UI (Pages & Components)"]
        AUTH_MID["Authentication Middleware"]
        LOGIN_ACT["Login Server Actions"]
        API_GEN["Generate Script API (/api/generate-script)"]
    end

    subgraph "Supabase Cloud"
        SUPA_AUTH["Supabase Authentication Service"]
        SUPA_DB["Supabase Database"]
    end

    subgraph "External Services"
        EXT_AI["External AI Model (e.g., LLM)"]
    end

    USR --> BROWSER["Initial Request / Interaction"]
    BROWSER --> NEXT_UI["Request Page/Resource"]

    NEXT_UI --> AUTH_MID["Intercept Request"]
    AUTH_MID --> SUPA_AUTH["Verify Session / Token"]
    SUPA_AUTH --> AUTH_MID["Session Status"]

    AUTH_MID -- Authenticated Session --> NEXT_UI["Render Protected Content"]
    AUTH_MID -- Unauthenticated / No Session --> LOGIN_ACT["Redirect to Login"]

    LOGIN_ACT --> SUPA_AUTH["User Login Attempt"]
    SUPA_AUTH --> LOGIN_ACT["Authentication Result"]
    LOGIN_ACT -- Login Success --> NEXT_UI["Redirect to Main App"]

    NEXT_UI -- Request Data --> SUPA_DB["Fetch Data (e.g., scripts)"]
    SUPA_DB -- Data Response --> NEXT_UI["Display Content"]
    NEXT_UI --> BROWSER["Render UI"]
    BROWSER --> USR["View Application"]

    USR -- Input Prompt --> BROWSER["Submit Form"]
    BROWSER -- API Call --> NEXT_UI["Handle Request"]
    NEXT_UI -- POST /api/generate-script --> API_GEN["Process Request"]

    API_GEN --> EXT_AI["Request Script Generation"]
    EXT_AI --> API_GEN["Generated Script"]

    API_GEN --> SUPA_DB["Store Generated Script"]
    SUPA_DB --> API_GEN["Storage Confirmation"]

    API_GEN -- Script Response --> NEXT_UI["Update UI"]
    NEXT_UI --> BROWSER["Display New Script"]
    BROWSER --> USR["Review Generated Script"]
```

*Last updated automatically by Gemini.*