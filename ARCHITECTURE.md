# System Architecture

```mermaid
graph LR
  subgraph "Client / Browser"
    U["User"]
    CUI["Client UI (Browser)"]
  end

  subgraph "Next.js Application"
    NF["Next.js Frontend (Pages & Components)"]
    AM["Auth Middleware"]
    LSA["Login Server Actions"]
    GSA["Generate Script API"]
    UVA["Upload Video URL API"]
  end

  subgraph "Supabase Cloud"
    SA["Supabase Authentication"]
    SDB["Supabase Database"]
    SS["Supabase Storage"]
  end

  subgraph "External Services"
    AIS["External AI Service"]
    VPS["External Video Processing Service"]
  end

  %% Flow: Initial Page Load & Auth Check
  U -- "Accesses Application" --> CUI
  CUI -- "Requests Page" --> NF
  NF -- "Intercepts Request" --> AM
  AM -- "Checks Session" --> SA
  SA -- "Validates Token/Session" --> AM
  AM -- "Authorizes Access" --> NF
  NF -- "Renders Page" --> CUI

  %% Flow: User Login
  U -- "Submits Login Form" --> CUI
  CUI -- "Invokes Server Action" --> LSA
  LSA -- "Authenticates User" --> SA
  SA -- "Returns Auth Token/Session" --> LSA
  LSA -- "Sets Session & Redirects" --> NF

  %% Flow: Generate Script
  U -- "Requests Script Generation" --> CUI
  CUI -- "Calls API" --> GSA
  GSA -- "Sends Prompt" --> AIS
  AIS -- "Returns Generated Script" --> GSA
  GSA -- "Saves Script Metadata" --> SDB
  SDB -- "Confirmation" --> GSA
  GSA -- "Returns Script" --> CUI
  CUI -- "Displays Script" --> U

  %% Flow: Upload Video URL
  U -- "Provides Video URL" --> CUI
  CUI -- "Calls API" --> UVA
  UVA -- "Sends URL for Processing" --> VPS
  VPS -- "Processes Video & Notifies" --> UVA
  UVA -- "Stores Video Metadata" --> SDB
  SDB -- "Confirmation" --> UVA
  UVA -- "Returns Processing Status" --> CUI
  CUI -- "Displays Status" --> U
```

*Last updated automatically by Gemini.*