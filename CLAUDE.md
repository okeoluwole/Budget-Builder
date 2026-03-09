# CLAUDE.md — Budget-Builder AI Assistant Guide

This document provides comprehensive guidance for AI assistants (Claude and others) working on the Budget-Builder codebase. Read this before making any changes.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Architecture & Data Flow](#architecture--data-flow)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Frontend Architecture](#frontend-architecture)
9. [Key Conventions & Patterns](#key-conventions--patterns)
10. [Data Sources & Business Logic](#data-sources--business-logic)
11. [Authentication & Authorization](#authentication--authorization)
12. [AI Integration](#ai-integration)
13. [Common Tasks & Pitfalls](#common-tasks--pitfalls)

---

## Project Overview

**Budget-Builder** is a full-stack web application for generating and comparing office fit-out budget estimates using data from three commercial real estate cost guides:

- **CBRE** — Global Occupier Fit-Out Cost Guide
- **Turner & Townsend (T&T)** — 2025 Global Office Fit-Out Cost Guide
- **JLL** — Regional cost estimator

The app supports multi-user authentication, project management, AI-powered chat assistance, multi-source budget comparison, and currency conversion.

**Deployed on:** Replit (autoscale)
**Port:** 5000 (serves both API and static frontend)

---

## Repository Structure

```
Budget-Builder/
├── client/                   # React 18 frontend (TypeScript)
│   └── src/
│       ├── components/       # All React components
│       │   ├── ui/           # Radix UI + shadcn primitives (30+ components)
│       │   ├── layouts/      # Header, Sidebar, AppLayout
│       │   ├── auth/         # LoginForm, UserManagement, Navigation
│       │   ├── budget/       # Budget wizard steps and results
│       │   ├── chat/         # AI chat interface
│       │   └── dashboard/    # Dashboard widgets
│       ├── pages/            # Page-level components (10 pages)
│       ├── contexts/         # BudgetContext (useReducer state)
│       ├── hooks/            # useAuth, use-toast, use-mobile
│       ├── lib/              # queryClient, utils (cn helper)
│       ├── utils/            # Calculators, formatters, data utilities
│       ├── data/             # Client-side static data
│       ├── App.tsx           # Root app, routing, providers
│       └── main.tsx          # React 18 entry point
│
├── server/                   # Express.js backend (TypeScript)
│   ├── index.ts              # Server entry point, initialization
│   ├── routes.ts             # All API route handlers (~2200 lines)
│   ├── db.ts                 # PostgreSQL + Drizzle ORM setup
│   ├── auth.ts               # Password hashing, auth middleware
│   ├── userService.ts        # User/project CRUD
│   ├── storage.ts            # Storage interface layer
│   ├── sessionConfig.ts      # express-session + pg store
│   ├── passport.ts           # Passport local strategy
│   ├── vite.ts               # Vite dev server integration
│   ├── data/
│   │   └── tt2025Data.ts     # Turner & Townsend 2025 hardcoded data
│   ├── utils/
│   │   ├── dataImport.ts     # Core data processing pipeline
│   │   ├── databaseImport.ts # Excel/JSON database import
│   │   ├── dataSourceLeveling.ts  # CBRE/T&T/JLL alignment logic
│   │   ├── locationNormalizer.ts  # Country/city alias mapping
│   │   ├── datasetValidator.ts    # Data integrity validation
│   │   ├── currencyImport.ts      # Exchange rate handling
│   │   ├── furnitureImport.ts     # Furniture cost import
│   │   ├── technologyImport.ts    # Technology cost import
│   │   ├── excelReader.ts         # Excel file parsing (xlsx)
│   │   ├── openai.ts              # OpenAI API integration
│   │   └── localChat.ts           # AI chat fallback system
│   └── routes/
│       └── chat.ts           # Chat-specific endpoints
│
├── shared/
│   └── schema.ts             # Drizzle ORM table definitions (source of truth)
│
├── data/                     # Reference data files (JSON)
│   ├── specifications.json
│   ├── fitout_costs.json
│   ├── layout_templates.json
│   ├── budget_template_structure.json
│   └── fx_rates_2025.json
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .replit                   # Replit deployment config
└── replit.md                 # Extended architecture documentation
```

---

## Technology Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 5.4.14 | Build tool & dev server |
| Wouter | 3.3.5 | Client-side routing (lightweight, not React Router) |
| TanStack Query | 5.60.5 | Server state & data fetching |
| React Hook Form | 7.53.1 | Form state management |
| Zod | 3.23.8 | Schema validation |
| Radix UI | various | Headless accessible UI primitives |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| Recharts | 2.13.0 | Data visualization |
| Framer Motion | 11.13.1 | Animations |
| Lucide React | 0.453.0 | Icons |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 | Runtime |
| Express.js | 4.21.2 | HTTP framework |
| TypeScript | 5.6.3 | Type safety |
| Drizzle ORM | 0.39.1 | Database ORM |
| PostgreSQL | 16 | Database (Neon serverless) |
| Passport.js | 0.7.0 | Authentication |
| bcryptjs | 3.0.2 | Password hashing |
| express-session | 1.18.1 | Session management |
| connect-pg-simple | 10.0.0 | PostgreSQL session store |
| OpenAI | 4.93.0 | AI chat integration |
| xlsx | 0.18.5 | Excel file parsing |

---

## Development Workflows

### Start Development Server
```bash
npm run dev
# Runs: NODE_ENV=development tsx server/index.ts
# Server starts on port 5000 (serves frontend via Vite middleware + API)
```

### Type Check
```bash
npm run check
# Runs: tsc (TypeScript compilation check)
```

### Build for Production
```bash
npm run build
# Runs: vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
# Output: dist/public/ (frontend) + dist/index.js (backend)
```

### Start Production Server
```bash
npm run start
# Runs: NODE_ENV=production node dist/index.js
```

### Database Migrations
```bash
npm run db:push
# Runs: drizzle-kit push
# Pushes schema changes to the Neon PostgreSQL database
# Use this whenever shared/schema.ts is modified
```

### No Linting/Testing Framework
- There is **no ESLint, Prettier, or Jest** configured
- Ad-hoc test scripts exist as `.js` files in the root directory
- When testing changes, use `npm run check` for type safety verification
- Manual testing against the dev server is the primary validation method

---

## Architecture & Data Flow

### Unified Server Pattern
The app runs as a **single Express server on port 5000** that:
1. Serves the React SPA via Vite dev server middleware (in development)
2. Serves the built `dist/public/` directory (in production)
3. Handles all API requests at `/api/*` routes

### Request Flow
```
Browser → Express (port 5000)
           ├── /api/* → routes.ts handlers → DB / external APIs
           └── /* → Vite middleware (dev) / static files (prod)
```

### State Management
- **Server state**: TanStack Query (React Query) manages caching, refetching, and synchronization
- **Global UI state**: `BudgetContext` (React Context + useReducer) in `client/src/contexts/`
- **Form state**: React Hook Form with Zod validation

### Authentication Flow
```
Login form → POST /api/login → Passport.js local strategy
           → bcrypt.compare → express-session (stored in PostgreSQL)
           → isAuthenticated middleware on protected routes
```

---

## Database Schema

All table definitions are in **`shared/schema.ts`** — this is the **single source of truth**.

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (id, username, email, passwordHash, role, active) |
| `sessions` | Express-session storage (sid, sess, expire) |
| `userProjects` | User project data (JSONB project blob) |
| `projectShares` | Project sharing with permission levels |
| `auditLogs` | Compliance audit trail with IP tracking |
| `projects` | Budget project metadata |
| `budgets` | Budget calculations and versions |
| `fitoutCosts` | Construction cost data from sources |
| `specifications` | Specification level definitions (Low/Medium/High) |
| `layoutTemplates` | Space layout templates |
| `budgetTemplates` | Category hierarchy templates |
| `currencyRates` | Exchange rates (from `fx_rates_2025.json`) |
| `furnitureCosts` | Furniture cost data |
| `technologyCosts` | Technology/AV cost data |
| `chatSessions` | AI chat conversation sessions |
| `chatMessages` | Individual chat messages |

### Schema Conventions
- All tables use `serial` primary keys named `id`
- Timestamps use `timestamp` with `defaultNow()`
- JSON blobs use `jsonb` type (PostgreSQL JSONB)
- Foreign keys reference `users.id` for ownership
- Role field on users: `"admin"` or `"staff"`

### Making Schema Changes
1. Edit `shared/schema.ts`
2. Run `npm run db:push` to apply to the database
3. Update corresponding TypeScript types if using inferred types

---

## API Reference

All API routes are defined in `server/routes.ts`. The server uses session-based auth.

### Authentication Endpoints
```
POST /api/login               # { username, password } → sets session
POST /api/logout              # Destroys session
GET  /api/auth/user           # Returns current authenticated user
POST /api/register            # { username, email, password } → creates user
```

### Admin User Management (requires admin role)
```
GET    /api/admin/users           # List all users
POST   /api/admin/users           # Create user
PUT    /api/admin/users/:id       # Update user
DELETE /api/admin/users/:id       # Delete user
POST   /api/admin/users/:id/reset-password  # Reset password
```

### Projects & Budgets
```
POST   /api/projects              # Create project
GET    /api/projects              # List user's projects
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
POST   /api/budgets               # Create budget
GET    /api/budgets/:id           # Get budget
PUT    /api/budgets/:id           # Update budget
DELETE /api/budgets/:id           # Delete budget
```

### Budget Calculation (Core Feature)
```
POST /api/calculate-budget            # Main budget calculation
POST /api/calculate-budget-comparison # Multi-source comparison
GET  /api/available-countries/:dataSource  # Countries for a data source
GET  /api/available-cities/:country        # Cities for a country
```

### Reference Data
```
GET /api/specifications       # Specification levels
GET /api/currency-rates       # Exchange rates
GET /api/dataset-validation   # Data integrity check
```

### Chat
```
POST /api/chat                # Send message to AI chat
GET  /api/chat/sessions       # Chat history
```

### Auth Middleware Pattern
Routes use `isAuthenticated` middleware from `server/auth.ts`:
```typescript
app.get('/api/protected-route', isAuthenticated, async (req, res) => {
  const user = req.user; // Typed as User from schema
  // ...
});
```

---

## Frontend Architecture

### Routing
Uses **Wouter** (not React Router). Routes are defined in `client/src/App.tsx`:
```typescript
import { Route, Switch } from 'wouter';
// NOT: import { BrowserRouter, Routes, Route } from 'react-router-dom'
```

### Component Organization
Follow the existing pattern when adding components:
- **`components/ui/`** — Reusable primitives (buttons, inputs, dialogs). Based on shadcn/ui pattern with Radix UI
- **`components/layouts/`** — Layout wrappers
- **`components/budget/`** — Budget wizard steps and results
- **`components/auth/`** — Auth-related UI
- **`pages/`** — Full page components composed from components

### Styling Conventions
- **Tailwind CSS utility classes** are the primary styling mechanism
- Use the `cn()` helper from `client/src/lib/utils.ts` to merge conditional classes:
  ```typescript
  import { cn } from '@/lib/utils';
  className={cn('base-classes', condition && 'conditional-class')}
  ```
- Component variants use **`class-variance-authority` (CVA)** pattern
- Dark mode is supported via Tailwind's `dark:` prefix (class strategy)
- Theme colors are defined in `tailwind.config.ts` and `theme.json`

### Path Aliases
Configured in both `tsconfig.json` and `vite.config.ts`:
```typescript
'@/'       → 'client/src/'
'@shared/' → 'shared/'
```

### Data Fetching Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching
const { data, isLoading } = useQuery({
  queryKey: ['/api/projects'],
  queryFn: () => fetch('/api/projects').then(r => r.json()),
});

// Mutations with cache invalidation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/projects'] }),
});
```

### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

---

## Key Conventions & Patterns

### TypeScript
- **Strict mode** is enabled (`tsconfig.json`)
- Use `shared/schema.ts` inferred types for database entities:
  ```typescript
  import type { User, Project } from '@shared/schema';
  // Or use Drizzle's InferSelectModel/InferInsertModel
  ```
- Avoid `any` — use `unknown` with type guards if needed

### API Response Convention
```typescript
// Success
res.json({ data: result });

// Error
res.status(400).json({ error: 'Description of what went wrong' });
res.status(401).json({ error: 'Unauthorized' });
res.status(500).json({ error: 'Internal server error' });
```

### Database Queries (Drizzle ORM)
```typescript
import { db } from './db';
import { users, projects } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Select
const user = await db.select().from(users).where(eq(users.id, userId));

// Insert
const [newProject] = await db.insert(projects).values({ ... }).returning();

// Update
await db.update(users).set({ active: false }).where(eq(users.id, userId));

// Delete
await db.delete(projects).where(eq(projects.id, projectId));
```

### ESM Modules
The project uses **ES Modules** (`"type": "module"` in package.json):
- Use `import`/`export` syntax everywhere
- No `require()` calls
- File extensions may be needed in some Node.js imports

---

## Data Sources & Business Logic

### Three Data Sources
The core feature is multi-source budget estimation:

1. **CBRE** (`fitout_costs.json` + database `fitoutCosts` table)
   - Specification levels: Low / Medium / High / Ultra High
   - Cost components: construction, furniture, technology, professional fees
   - Global city coverage

2. **Turner & Townsend (T&T)** (`server/data/tt2025Data.ts`)
   - 2025 Global Office Fit-Out Cost Guide
   - Hardcoded TypeScript data (not from database)
   - Region/country/city hierarchy
   - Different cost structure from CBRE

3. **JLL** (hardcoded logic in `routes.ts`)
   - Regional cost estimator
   - Simpler cost model
   - Leveled to align with CBRE methodology

### Data Source Leveling
`server/utils/dataSourceLeveling.ts` handles alignment between sources so they can be meaningfully compared. When modifying budget calculations, understand how each source's cost components map to each other.

### Location Normalization
`server/utils/locationNormalizer.ts` maps city/country aliases so a user selecting "NYC" matches "New York", etc. When adding new locations, update this file.

### Budget Components
A budget consists of:
- **Construction/Fitout** — Base fit-out costs ($/sqft or $/sqm)
- **Furniture** — Workstations, seating, collaboration areas
- **Technology** — AV, IT, smart building
- **Professional Fees** — Design, project management, permits

### Currency Conversion
Exchange rates loaded from `data/fx_rates_2025.json` into the `currencyRates` table. All internal calculations are in USD; frontend converts for display.

---

## Authentication & Authorization

### Roles
- **`admin`** — Full access including user management (`/api/admin/*`)
- **`staff`** — Standard access to projects and budgets

### Session Management
- Sessions stored in PostgreSQL via `connect-pg-simple`
- Session secret from `process.env.SESSION_SECRET`
- `req.user` is populated by Passport after authentication
- Check auth status: `req.isAuthenticated()`

### Environment Variables
Required in production:
```
DATABASE_URL        # Neon PostgreSQL connection string
SESSION_SECRET      # Random secret for session signing
OPENAI_API_KEY      # OpenAI API key for chat feature
```

---

## AI Integration

### OpenAI Chat
- `server/utils/openai.ts` — OpenAI client setup and query helpers
- `server/utils/localChat.ts` — Fallback rule-based chat when OpenAI is unavailable
- `server/routes/chat.ts` — Chat API endpoints
- Model: GPT-4o for chat responses
- Chat sessions stored in `chatSessions` and `chatMessages` tables

### Fallback Behavior
If `OPENAI_API_KEY` is not set or the API fails, `localChat.ts` provides rule-based responses about budget estimation. Always ensure the fallback handles edge cases gracefully.

---

## Common Tasks & Pitfalls

### Adding a New API Endpoint
1. Add the route handler in `server/routes.ts`
2. Use `isAuthenticated` middleware for protected routes
3. Use `isAdmin` middleware for admin-only routes
4. Follow the existing response format (`{ data: ... }` or `{ error: ... }`)

### Adding a New Database Table
1. Define the table in `shared/schema.ts`
2. Run `npm run db:push`
3. Import and use in server code via Drizzle ORM
4. Create corresponding TypeScript types using Drizzle's inference

### Adding a New Frontend Page
1. Create the page component in `client/src/pages/`
2. Add the route in `client/src/App.tsx` using Wouter's `<Route>`
3. Add navigation link in `Sidebar.tsx` or `Header.tsx`

### Adding a New Budget Wizard Step
1. Create step component in `client/src/components/budget/`
2. Add to the wizard flow in `BudgetWizard.tsx`
3. Update `BudgetContext` if new state is needed

### Modifying Budget Calculations
- Core calculation logic is in `server/routes.ts` at the `/api/calculate-budget` handler
- Data source leveling is in `server/utils/dataSourceLeveling.ts`
- Always test all three data sources (CBRE, T&T, JLL) after changes
- Location lookup uses `locationNormalizer.ts` — check aliases when locations don't resolve

### Common Gotchas
- **ESM only** — no `require()`, use `import`
- **Wouter not React Router** — use `useLocation`, `useRoute` from `wouter`, not `useNavigate`
- **No test suite** — run `npm run check` and manually verify in the browser
- **T&T data is hardcoded** in `server/data/tt2025Data.ts`, not in the database
- **Session auth** — API routes need `isAuthenticated` middleware; React Query calls will automatically include session cookies
- **`shared/schema.ts`** is imported by both client and server — keep it framework-agnostic
- **Drizzle push** — always run `npm run db:push` after schema changes, not just a server restart
- **Port 5000** — the single server handles both frontend and API; there is no separate dev API port
- **`cn()` utility** — always use for conditional Tailwind classes to avoid class conflicts

### File Size Warning
`server/routes.ts` is ~2200 lines. When editing it:
- Use `grep` or search to locate the specific route before reading the whole file
- Consider whether new endpoints should be in a separate routes file under `server/routes/`

---

## Additional Documentation

- `replit.md` — Extended architecture documentation (auto-generated by Replit)
- `cbre_tt_jll_guide_comparison_analysis.md` — Detailed comparison of the three data sources
- `tt_test_results_summary.md` — T&T integration test results and validation
- `demonstrate_multi_source_comparison.md` — Multi-source comparison examples
