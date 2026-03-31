# System Architecture

```mermaid
graph TD
    A["User"] --> B["Next.js Frontend (Pages & Components)"];
    B -- "Triggers Server Actions" --> F["Next.js Server Actions"];
    B -- "Requests API" --> C["Next.js API Route '/api/generate-script'"];
    B -- "Client-side Supabase Interaction" --> E["Supabase (Auth & Database)"];
    F -- "Server-side Supabase Interaction" --> E;
    C -- "Calls" --> D["External AI API"];
    C -- "Stores/Retrieves Data" --> E;
    G["Supabase Middleware"] -- "Authorizes Frontend Access" --> B;
    G -- "Authorizes API Route Access" --> C;
    E -- "Provides Auth & Database Services" --> G;
```

*Last updated automatically by Gemini.*