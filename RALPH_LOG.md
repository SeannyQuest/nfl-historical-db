# RALPH Log — GridIron Intel

## Cycle 1 — Foundation: Project Scaffold & Netlify Config

**Date:** 2026-02-06

### Hypothesis
Initialize a Next.js 16 project with the full target toolchain (TypeScript, Tailwind, ESLint, Prisma, Vitest, Zod, TanStack Query) and Netlify deployment config. Remove legacy static site files. Establish the skeleton for all future cycles.

### Changes
1. **Initialized Next.js 16 project** via `create-next-app` with App Router, TypeScript, Tailwind CSS v4, ESLint, and `src/` directory structure
2. **Added dependencies:**
   - Runtime: `prisma`, `@prisma/client`, `zod`, `@tanstack/react-query`
   - Dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom@24`, `@vitejs/plugin-react`
3. **Created `netlify.toml`** with Next.js plugin configuration
4. **Created Prisma schema** (`prisma/schema.prisma`) with PostgreSQL datasource, `User` model, and `SubscriptionTier` enum (FREE/PRO/ADMIN)
5. **Created `.env.example`** with `DATABASE_URL`, `AUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `ANTHROPIC_API_KEY`
6. **Created `vitest.config.ts`** with jsdom environment, React plugin, and path alias
7. **Updated Home page** (`src/app/page.tsx`) — replaced create-next-app boilerplate with GridIron Intel branding (dark theme, gold accent)
8. **Updated layout metadata** — title "GridIron Intel", description with game count
9. **Created smoke test** (`src/__tests__/smoke.test.tsx`) — verifies Home renders without throwing and displays title
10. **Removed legacy files:** `middleware.ts` (Vercel edge auth), `vercel.json` (Vercel config), `public/data.js` (2.1 MB static data), `public/app.js` (928-line vanilla JS), `public/index.html`, `public/styles.css`
11. **Preserved `scripts/`** directory with Python scrapers for reference
12. **Updated `.gitignore`** for Next.js + Prisma + Python artifacts

### Outcome
- `npm run build` — **PASS** (static pages generated)
- `npm test` — **PASS** (2/2 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  1 passed (1)
     Tests  2 passed (2)
  Duration  446ms
```

### Key Learnings
- `jsdom@27` has ESM/CJS compatibility issues with `@csstools/css-calc` in Node 20.x — downgraded to `jsdom@24` which works cleanly
- `@testing-library/react` does not auto-cleanup between tests in Vitest — must explicitly call `cleanup` in `afterEach`
- Next.js 16 uses Turbopack by default for builds
- `create-next-app` cannot run in a directory with existing files — required temp move of `scripts/`, `.github/`, and legacy files
- Prisma 6 uses `prisma-client` provider (not `prisma-client-js`) and outputs to `src/generated/prisma` by default

---

## Cycle 2 — Schema: Core Database Models

**Date:** 2026-02-06

### Hypothesis
Design the complete Prisma schema for games, teams, betting data, and weather. Create seed data for all 32 current NFL teams plus 14 historical franchise names. Validate schema and seed data integrity through tests.

### Changes
1. **Expanded Prisma schema** (`prisma/schema.prisma`) with full models:
   - `Team` — name, abbreviation, city, nickname, conference, division, franchiseKey, isActive
   - `Season` — year (unique), type (REGULAR/POSTSEASON)
   - `Game` — seasonId, week, date, time, dayOfWeek, homeTeamId, awayTeamId, homeScore, awayScore, scoreDiff, winnerId, primetime, isPlayoff
   - `BettingLine` — gameId (1:1), spread, overUnder, moneylineHome/Away, spreadResult, ouResult, source
   - `Weather` — gameId (1:1), temperature, wind, conditions
2. **Added enums:** `SeasonType`, `SpreadResult`, `OUResult`, `Conference`, `Division`
3. **Added indexes:** Game(date), Game(homeTeamId), Game(awayTeamId), Game(seasonId, week), Team(franchiseKey), BettingLine(gameId), Weather(gameId)
4. **Unique constraints:** Game(date, homeTeamId, awayTeamId) for deduplication
5. **Created `prisma/team-data.ts`** — Pure data file with 32 active teams and 14 historical franchise names, importable without Prisma client dependency
6. **Created `prisma/seed-teams.ts`** — Executable seed script using Prisma upsert, separated from data to allow testing without DB
7. **Created `src/__tests__/schema.test.ts`** — 11 tests validating:
   - 32 active teams, all historical marked inactive
   - No duplicate names or abbreviations
   - All required fields populated
   - Valid conference/division values
   - 8 divisions with 4 active teams each
   - All FRANCHISE_MAP keys and historical names covered
   - Franchise groupings correct (Raiders, Colts, Washington, Titans)
8. **Updated `tsconfig.json`** — Excluded `prisma/seed-teams.ts` from Next.js build (uses dynamic Prisma import unavailable at build time)

### Outcome
- `npm run build` — **PASS**
- `npm test` — **PASS** (13/13 tests passing)
- `npx eslint src/` — **PASS** (0 errors)
- `npx prisma validate` — **PASS** (schema valid)

### Verification
```
Test Files  2 passed (2)
     Tests  13 passed (13)
  Duration  661ms
```

### Key Learnings
- Separate seed data (pure TS arrays) from seed execution (Prisma client calls) to enable testing without a database connection
- Vite's import analysis resolves dynamic `import()` paths even when they're unreachable at test time — fails if the module doesn't exist. Solution: isolate the dynamic import in a separate file excluded from test scope
- `prisma/seed-teams.ts` must be excluded from `tsconfig.json` because the generated Prisma client doesn't exist until `prisma generate` runs against a real DB
- The FRANCHISE_MAP from `generate_data.py` maps 14 historical names to 9 franchise keys — seed data covers all of them

---

## Cycle 3 — Auth: Username & Password Protection

**Date:** 2026-02-06

### Hypothesis
Lock the app behind authentication before adding data features. Use NextAuth v5 (beta) with CredentialsProvider, JWT strategy, and env-var credentials. Same owner-only pattern as the original Vercel middleware but now with proper session management.

### Changes
1. **Installed `next-auth@beta`** (Auth.js v5) — still in beta as of Feb 2026 but widely used in production
2. **Created `src/auth.ts`** — NextAuth config with:
   - CredentialsProvider validating against `AUTH_USERNAME` / `AUTH_PASSWORD` env vars
   - JWT session strategy
   - Custom sign-in page at `/login`
   - `authorized` callback for middleware integration
3. **Created `src/middleware.ts`** — Protects all routes except `/api/auth/*` and `/login`. Redirects unauthenticated users to `/login` with `callbackUrl` param
4. **Created `src/app/api/auth/[...nextauth]/route.ts`** — Two-line route handler exporting GET/POST from auth handlers
5. **Created `src/app/login/page.tsx`** — Client-side login form with:
   - NFL-themed dark UI matching original site branding (gold accents, dark panels)
   - Username + password fields with validation
   - Error display for incorrect credentials
   - Loading state on submit
   - Redirect to `callbackUrl` after successful login
   - Wrapped in Suspense for `useSearchParams()`
6. **Created `src/lib/providers.tsx`** — SessionProvider wrapper for client-side session access
7. **Created `src/components/navbar.tsx`** — Server component navbar with:
   - App title and subtitle
   - User name display from session
   - Sign-out button using server action
   - Only renders when authenticated
8. **Updated `src/app/layout.tsx`** — Wraps children with Providers and Navbar
9. **Created `src/__tests__/auth.test.tsx`** — 6 tests:
   - Auth config env var contract
   - Login form renders with all fields
   - Submit button present
   - Required attributes on inputs
   - Credentials rejection logic
   - Credentials acceptance logic

### Outcome
- `npm run build` — **PASS** (all routes dynamic due to middleware)
- `npm test` — **PASS** (19/19 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  3 passed (3)
     Tests  19 passed (19)
  Duration  717ms
```

### Key Learnings
- NextAuth v5 is still `next-auth@beta` on npm — no stable v5 release yet as of Feb 2026
- NextAuth v5 exports `{ handlers, signIn, signOut, auth }` from a single config — much simpler than v4
- Server-side `signIn`/`signOut` come from `@/auth`, client-side versions from `next-auth/react` — different imports for different contexts
- The `authorized` callback in NextAuth config is used by middleware to determine if a request is authenticated
- Next.js 16 shows deprecation warning for `middleware` (wants `proxy`), but middleware still works and is required by NextAuth
- Login page needs `Suspense` wrapper when using `useSearchParams()` in App Router
- Mock both `next-auth/react` and `next/navigation` in Vitest for testing auth-dependent components
