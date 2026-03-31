# System Architecture

```mermaid
graph LR
    subgraph Frontend
        A[User]
        B[Next.js Client (Pages & Components)]
    end

    subgraph Next.js Backend
        C[Next.js Server (SSR, Server Actions)]
        D[API Route: /api/generate-script]
    end

    subgraph External Services
        E[External AI API (e.g., via AGENTS.md)]
        F[Supabase Auth]
        G[Supabase Database]
    end

    A -- Interacts with --> B
    B -- Renders/Server Actions --> C
    B -- API Call --> D

    C -- Handles Auth (login/actions.ts) --> F
    C -- Data Management --> G

    D -- Requests Generation --> E
    E -- Returns Script --> D
    D -- Stores/Retrieves Data --> G

    B -- (Optional direct client-side Auth) --> F
    B -- (Optional direct client-side Data) --> G
```

*Last updated automatically by Gemini.*