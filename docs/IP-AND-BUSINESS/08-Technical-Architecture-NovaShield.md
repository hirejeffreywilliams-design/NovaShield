# TECHNICAL ARCHITECTURE DOCUMENT

**Title:** Technical Architecture — NovaShield Police Accountability & Community Safety Platform

**Owner:** Jeffrey W. Williams LLC
**OmniDLOS Holdings Ecosystem — D4**
**Date:** April 4, 2026
**Classification:** CONFIDENTIAL — Owner Eyes Only

© 2024–2026 Jeffrey W. Williams LLC. All Rights Reserved.

---

## EXECUTIVE SUMMARY

NovaShield is a full-stack TypeScript monorepo application comprising a React SPA frontend, Express.js/Node.js REST API backend, and PostgreSQL database accessed through Drizzle ORM. The platform's current state reflects a completed frontend UI layer (approximately 80% of the full product experience is visible and functional via mock data) with an authentication-complete backend awaiting feature API implementation.

**Current Metrics:**
- Total source files: 54
- Total lines of code: 29,441
- Frontend completion: ~80% (UI complete, mock data only)
- Backend API completion: ~10% (authentication routes only)
- Database schema completion: ~15% (users table implemented; feature tables designed but not migrated)
- Security hardening: 0% (critical vulnerabilities present; remediation required before production)
- Test coverage: 0%

---

## SYSTEM ARCHITECTURE OVERVIEW

### Architecture Pattern: Full-Stack Monorepo

NovaShield uses a unified Express/Node.js backend serving both the REST API and a React SPA (Single Page Application) through Vite middleware integration in development mode and static file serving in production.

```
NovaShield/
├── client/                    ← React SPA (Vite-built)
│   └── src/
│       ├── pages/             ← 13 page components
│       ├── components/        ← Layout + 22 UI component wrappers
│       ├── hooks/             ← useAuth, useToast, useMobile
│       └── lib/               ← QueryClient, utils
├── server/                    ← Express.js API server
│   ├── index.ts               ← App bootstrap + middleware
│   ├── routes.ts              ← API route handlers
│   ├── storage.ts             ← Data access layer + session config
│   └── vite.ts                ← Dev server integration
├── shared/
│   └── schema.ts              ← Drizzle ORM schema + Zod validators
├── drizzle.config.ts
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### Architecture Decision Records (ADRs)

**ADR-001: Monorepo over Microservices**
*Decision:* Single repository with shared schema package.
*Rationale:* Appropriate for MVP/prototype stage. Enables rapid iteration with shared types between frontend and backend. Microservices architecture appropriate at post-scale stage.

**ADR-002: Express.js + React (not Next.js)**
*Decision:* Separate Express.js API server with React SPA frontend.
*Rationale:* Clean separation of concerns between API and frontend. Enables future mobile client (React Native) to consume the same API. Greater flexibility in backend authentication and session management than Next.js API routes.

**ADR-003: Drizzle ORM (not Prisma or raw SQL)**
*Decision:* Drizzle ORM 0.29 with schema-first approach.
*Rationale:* Type-safe query generation. Lightweight relative to Prisma. Schema-first design enables shared schema validation between Drizzle (database queries) and Zod (API request validation).

**ADR-004: TanStack Query v5 for Client State**
*Decision:* TanStack Query (React Query) for all server-side state management.
*Rationale:* Eliminates manual loading/error state management. Built-in caching reduces unnecessary API calls. Mutation API simplifies optimistic updates. Auth state cached globally across component tree.

---

## BACKEND ARCHITECTURE

### Runtime and Framework

| Component | Technology | Version | Details |
|---|---|---|---|
| Runtime | Node.js | 20.x LTS | ES modules (`"type": "module"`) |
| Framework | Express.js | 4.x | REST API routing + middleware |
| Language | TypeScript | 5.3 | Strict mode compilation |
| Compilation | tsx (dev) / tsc (prod) | — | Hot reload in development |
| Process Manager | Node.js direct | — | PM2 or Docker for production |

### Database Layer

| Component | Technology | Details |
|---|---|---|
| Database | PostgreSQL | Target: 14.x+ |
| ORM | Drizzle ORM 0.29 | Schema-first, type-safe queries |
| Connection | DATABASE_URL env var | Neon, Supabase, or local PostgreSQL |
| Migrations | Drizzle Kit | `drizzle-kit push` for schema sync |
| Schema validation | Zod (via drizzle-zod) | Insert schemas auto-generated |

### Authentication System

| Component | Technology | Details |
|---|---|---|
| Strategy | Session-based (username/password) | Custom implementation |
| Session Store | express-session + memorystore | Dev only; Redis required for production |
| Session TTL | 7-day cookie | httpOnly, secure-in-prod |
| Password Storage | **PLAINTEXT — CRITICAL ISSUE** | Must migrate to bcrypt before production |
| Role System | user / admin | Stored in users.role column |

**⚠️ Critical Security Remediation Required Before Production:**
The current codebase stores and compares passwords in plaintext (`user.password !== password` in routes.ts:29). This is a critical security vulnerability requiring immediate remediation:
1. Install bcrypt: `npm install bcrypt @types/bcrypt`
2. Hash passwords at registration: `const hashedPassword = await bcrypt.hash(password, 12)`
3. Compare at login: `await bcrypt.compare(password, user.password)`
4. Migrate existing user passwords (force reset on first login)

### API Route Structure

**Currently Implemented:**
```
POST /api/register  → Create new user account
POST /api/login     → Authenticate user, create session
POST /api/logout    → Destroy session
GET  /api/user      → Get current authenticated user
```

**Required for Production (Feature APIs — Not Yet Implemented):**
```
# Incidents
POST /api/incidents          → Submit new incident report
GET  /api/incidents          → List incidents (with filters)
GET  /api/incidents/:id      → Get incident by ID
PUT  /api/incidents/:id      → Update incident status (admin)
GET  /api/incidents/export/:id → Export verified incident as legal document

# Officers
GET  /api/officers           → List tracked officers (with search)
GET  /api/officers/:badge    → Get officer profile + accountability score
GET  /api/officers/:badge/complaints → Get officer's complaints

# Alerts
GET  /api/alerts             → List active community safety alerts
POST /api/alerts             → Submit new alert report
PUT  /api/alerts/:id         → Update alert status

# Districts
GET  /api/districts          → List districts with accountability scores
GET  /api/districts/:id      → Get district profile + score components

# Legal Resources
GET  /api/resources          → List legal resources (with proximity filter)

# Admin
GET  /api/admin/users        → List all users (admin only)
PUT  /api/admin/users/:id    → Update user role/status
```

### Server-Side Middleware Stack

```
Request
  ↓ cors() — Cross-Origin Resource Sharing
  ↓ express.json() — JSON body parsing
  ↓ express.urlencoded() — Form data parsing
  ↓ sessionMiddleware — Session authentication
  ↓ serveStatic — Static file serving (production)
  ↓ registerRoutes(app) — API route handlers
  ↓ setupVite(app) — Dev server (development only)
  ↓ Error handler
Response
```

---

## FRONTEND ARCHITECTURE

### Technology Stack

| Component | Technology | Version | Details |
|---|---|---|---|
| Framework | React | 18 | Functional components with hooks |
| Language | TypeScript | 5.3 | Strict mode |
| Build Tool | Vite | 5 | Fast builds, HMR |
| Routing | Wouter | 3 | 2KB lightweight client-side router |
| State (Server) | TanStack Query | v5 | Server state, caching, mutations |
| State (Client) | React hooks | — | useState, useContext |
| Forms | React Hook Form | v7 | + Zod validation |
| UI Components | Radix UI | — | 22 accessible headless primitives |
| Styling | Tailwind CSS | 3.4 | Utility-first + design tokens |
| Charts | Recharts | 2.10 | Installed; not yet used |
| Icons | Lucide React | — | Icon library |
| Animation | tailwindcss-animate | — | CSS animations |

### Page Components

| File | Lines | Route | Access | Data Source |
|---|---|---|---|---|
| landing.tsx | 205 | `/` | Public | Static |
| auth.tsx | 130 | `/auth` | Public | API (real) |
| dashboard.tsx | 152 | `/dashboard` | Auth | Mock |
| incidents.tsx | 196 | `/incidents` | Auth | Mock |
| accountability.tsx | 150 | `/accountability` | Auth | Mock |
| community-map.tsx | 119 | `/map` | Auth | Mock |
| know-your-rights.tsx | 129 | `/rights` | Auth | Static |
| legal-resources.tsx | 97 | `/resources` | Auth | Static |
| alert-system.tsx | 133 | `/alerts` | Auth | Mock |
| admin.tsx | 87 | `/admin` | Admin | Mock |
| profile.tsx | 53 | `/profile` | Auth | API (real) |
| settings.tsx | 100 | `/settings` | Auth | Local state |
| not-found.tsx | 22 | `*` | Public | Static |

### Authentication Flow

```
User visits protected route
  ↓
ProtectedRoute checks useAuth().user
  ↓ No user → redirect to /auth
  ↓ User present → render protected component
  
Login Flow:
  User submits credentials
    ↓
  useAuth.loginMutation.mutateAsync({username, password})
    ↓
  POST /api/login
    ↓
  Server validates, creates session
    ↓
  Returns user object
    ↓
  TanStack Query invalidates /api/user cache
    ↓
  useAuth().user updates globally across all components
```

### Radix UI Component Library

NovaShield implements 22 Radix UI headless component wrappers providing WCAG-compliant accessibility:

| Component | Usage in Platform |
|---|---|
| Accordion | Know Your Rights expandable sections |
| Avatar | User profile pictures |
| Badge | Risk level labels, incident status tags |
| Button | All interactive buttons |
| Card | Dashboard stat cards, officer profile cards |
| Checkbox | Settings toggles, form checkboxes |
| Dialog | Confirmation dialogs, report submission |
| Dropdown Menu | User menu, filter dropdowns |
| Input | All text input fields |
| Label | Form field labels |
| Progress | Accountability score bars, district score bars |
| Scroll Area | Scrollable lists |
| Select | Incident type selector, filter selects |
| Separator | Section dividers |
| Sheet | Mobile navigation sidebar |
| Skeleton | Loading state placeholders |
| Switch | Notification preference toggles |
| Table | Admin user management, incident lists |
| Tabs | Auth page (login/register), accountability sections |
| Textarea | Incident narrative description |
| Toast | Success/error notifications |
| Tooltip | Icon explanations |

---

## DATABASE SCHEMA

### Implemented Table

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,  -- MUST BE HASHED BEFORE PRODUCTION
  email       TEXT,
  role        TEXT DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Required Tables (Designed, Not Yet Migrated)

```sql
CREATE TABLE incidents (
  id              SERIAL PRIMARY KEY,
  ns_case_id      TEXT UNIQUE NOT NULL,  -- Format: NS-YYYY-###
  type            TEXT NOT NULL,         -- excessive-force | unlawful-search | false-arrest
                                         -- verbal-abuse | racial-profiling | other
  date            DATE NOT NULL,
  location        TEXT NOT NULL,
  lat             NUMERIC,
  lng             NUMERIC,
  officer_badge   TEXT,
  description     TEXT,
  status          TEXT DEFAULT 'pending', -- pending | under-review | verified | resolved
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  is_anonymous    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evidence_attachments (
  id              SERIAL PRIMARY KEY,
  incident_id     INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_type       TEXT,  -- image | video | audio | document
  file_size_bytes INTEGER,
  uploaded_at     TIMESTAMP DEFAULT NOW()
  -- NO user_id or other personal identifier stored here
);

CREATE TABLE officers (
  id                   SERIAL PRIMARY KEY,
  badge_number         TEXT UNIQUE NOT NULL,
  name                 TEXT,
  department           TEXT,
  district             TEXT,
  complaint_count      INTEGER DEFAULT 0,
  sustained_count      INTEGER DEFAULT 0,
  accountability_score INTEGER,  -- 0-100, computed
  risk_status          TEXT,     -- low | moderate | moderate-high | high-risk
  last_score_computed  TIMESTAMP
);

CREATE TABLE departments (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  complaint_count INTEGER DEFAULT 0,
  sustained_count INTEGER DEFAULT 0,
  reform_score    INTEGER  -- 0-100
);

CREATE TABLE districts (
  id                    SERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  accountability_score  INTEGER,  -- 0-100, computed
  boundary_geojson      JSONB,    -- GeoJSON polygon for district boundaries
  last_score_computed   TIMESTAMP
);

CREATE TABLE alerts (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,     -- high | medium | info | resolved
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  lat         NUMERIC,
  lng         NUMERIC,
  radius_miles NUMERIC DEFAULT 0.5,
  created_at  TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE legal_resources (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT,           -- civil-rights | legal-aid | legal-organization | wrongful-conviction
  website_url     TEXT,
  phone           TEXT,
  address         TEXT,
  lat             NUMERIC,
  lng             NUMERIC,
  is_free         BOOLEAN DEFAULT TRUE,
  services        TEXT[]          -- Array of service descriptions
);
```

---

## DESIGN SYSTEM

### Color Palette

```css
:root {
  --background: #0a0a0a;              /* Near-black background */
  --primary: hsl(199, 89%, 48%);      /* Electric blue */
  --secondary: hsl(188, 91%, 43%);    /* Cyan */
  --gradient-start: #0EA5E9;          /* Blue gradient start */
  --gradient-end: #06B6D4;            /* Cyan gradient end */
  --card-border: rgba(255,255,255,0.1);
  --text-primary: #ffffff;
  --text-secondary: rgba(255,255,255,0.7);
}
```

### Semantic Color Usage

| Color | Semantic Meaning | Usage |
|---|---|---|
| Red (#ef4444) | High severity / High risk / Alert HIGH | High-risk officers, high-severity incidents, HIGH alerts |
| Orange (#f97316) | Medium severity / Moderate-high risk | Moderate-high officers, medium incidents, MEDIUM alerts |
| Yellow (#eab308) | Low severity / Moderate risk | Moderate officers, low incidents |
| Green (#22c55e) | Low risk / Positive / Resolved | Low-risk officers, resolved alerts, positive metrics |
| Electric Blue | Primary brand / Interactive | Buttons, links, primary actions |
| Cyan | Secondary brand / Accent | Secondary actions, highlights |

### CSS Utility Classes

```css
.glass-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.gradient-text {
  background: linear-gradient(135deg, #0EA5E9, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gradient-bg {
  background: linear-gradient(135deg, #0EA5E9, #06B6D4);
}
```

---

## SECURITY REMEDIATION ROADMAP

### Critical (Before Any Production Deployment)

| Issue | Location | Remediation |
|---|---|---|
| Plaintext password storage | server/routes.ts:29 | Implement bcrypt hashing (cost factor 12) |
| Hardcoded session secret | server/storage.ts:7 | Require SESSION_SECRET env var with no fallback |
| No input sanitization | server/routes.ts | Add express-validator for all input fields |
| No rate limiting | Global | Add express-rate-limit for auth endpoints (5 req/15min) |

### High Priority (Pre-Launch)

| Issue | Severity | Remediation |
|---|---|---|
| No authorization middleware | HIGH | Implement role-check middleware for admin routes |
| In-memory session store | HIGH | Migrate to Redis-based session store |
| No authentication guards on feature APIs | HIGH | Implement auth middleware for all feature routes |
| Database schema incomplete | HIGH | Migrate all required feature tables |

### Medium Priority (Post-Launch)

| Issue | Severity | Remediation |
|---|---|---|
| No test suite | MEDIUM | Implement Vitest for backend, React Testing Library for frontend |
| Passport.js installed but unused | LOW | Implement or remove |
| No API documentation | MEDIUM | Add OpenAPI/Swagger documentation |
| No request logging | MEDIUM | Implement morgan logging |

---

## INFRASTRUCTURE AND DEPLOYMENT

### Current Configuration

| Parameter | Value |
|---|---|
| Port | 5000 (hardcoded) |
| Host | 0.0.0.0 (all interfaces) |
| Session Secret | SESSION_SECRET env var (fallback: "omnidlos-secret-key") |
| Database URL | DATABASE_URL env var |
| Build Output | dist/public/ (frontend), dist/server/ (backend) |
| Deployment Target | Replit (current); cloud deployment recommended |

### Production Infrastructure Recommendations

| Component | Recommended Solution | Purpose |
|---|---|---|
| Hosting | AWS ECS / Railway / Fly.io | Container-based deployment |
| Database | Neon or Supabase PostgreSQL | Managed PostgreSQL with connection pooling |
| Session Store | Upstash Redis | Session persistence across deployments |
| File Storage | AWS S3 / Cloudflare R2 | Evidence attachment storage |
| CDN | Cloudflare | Frontend static asset delivery |
| Maps API | Google Maps Platform | Interactive incident map |
| Email | Resend / Postmark | Alert email digest delivery |
| Monitoring | Datadog / Sentry | Error tracking and performance monitoring |

### Environment Variables Required

```env
DATABASE_URL=postgresql://user:password@host:5432/novashield
SESSION_SECRET=<randomly generated 32+ character string>
NODE_ENV=production
GOOGLE_MAPS_API_KEY=<for community map integration>
S3_BUCKET_NAME=<for evidence attachment storage>
S3_ACCESS_KEY_ID=<AWS credentials>
S3_SECRET_ACCESS_KEY=<AWS credentials>
RESEND_API_KEY=<for email alert delivery>
SENTRY_DSN=<for error monitoring>
```

---

## FEATURE ROADMAP (TECHNICAL MILESTONES)

### Phase 1: Backend Completion (Est. 4–6 weeks)
1. Implement bcrypt password hashing
2. Migrate all feature database tables
3. Implement all feature API routes (incidents, officers, alerts, districts, resources)
4. Connect frontend components to real API data (remove mock data)
5. Implement Redis session store
6. Add input validation and rate limiting

### Phase 2: Core Feature Completion (Est. 4–6 weeks)
1. Implement Officer Accountability Score computation engine
2. Implement District Accountability Score computation engine
3. Implement Community Safety Alert corroboration threshold engine
4. Implement evidence attachment upload to S3
5. Implement NS-YYYY-### case identifier generation
6. Connect Google Maps API for real interactive map

### Phase 3: Verification and Export (Est. 4–6 weeks)
1. Implement FOIA cross-reference engine (query public records APIs)
2. Implement multi-source verification status advancement
3. Implement court-formatted document PDF export
4. Implement legal resource geolocation proximity surfacing
5. Implement alert geographic zone matching and push notification delivery

### Phase 4: Scale and Security (Est. 2–4 weeks)
1. Complete security audit and remediation
2. Implement comprehensive test suite (target: 70%+ coverage)
3. Add OpenAPI documentation
4. Performance optimization and load testing
5. Production deployment and monitoring setup

---

*© 2024–2026 Jeffrey W. Williams LLC. All Rights Reserved.*
*CONFIDENTIAL — Owner Eyes Only*
*OmniDLOS Holdings Ecosystem — D4*
