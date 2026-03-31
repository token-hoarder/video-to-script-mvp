# System Architecture

```mermaid
graph LR
    subgraph "Frontend UI"
        A["Home Page (app/page.tsx)"]
        B["Root Layout (app/layout.tsx)"]
        C["Login Page (app/login/page.tsx)"]
        D["Script Cards Component (components/script-cards.tsx)"]
        E["Upload Zone Component (components/upload-zone.tsx)"]
        F["Shadcn UI Components (components/ui/*.tsx)"]
        G["Global Styles (globals.css)"]
        H["Favicon (favicon.ico)"]
        I["Utility Functions (lib/utils.ts)"]
        J["Supabase Client Integration (utils/supabase/client.ts)"]
    end

    subgraph "Next.js Backend/API"
        K["Generate Script API Route (app/api/generate-script/route.ts)"]
        L["Login Server Actions (app/login/actions.ts)"]
        M["Supabase Server Integration (utils/supabase/server.ts)"]
        N["Supabase Middleware (utils/supabase/middleware.ts)"]
        O["Next.js Configuration (next.config.ts)"]
        P["Proxy Configuration (proxy.ts)"]
    end

    subgraph "Supabase Platform"
        Q["Supabase Database & Auth"]
    end

    subgraph "External AI"
        R["External AI Service"]
    end
```

*Last updated automatically by Gemini.*