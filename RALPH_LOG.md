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

---

## Cycle 4 — Data Migration: Import 14,140 Games

**Date:** 2026-02-06

### Hypothesis
Extract the raw game data from the legacy static `data.js` (recovered from git history) into a structured JSON file, then build a pure parsing/mapping library and a database migration script. The parsing library must be fully testable without a database connection by separating pure logic from Prisma calls.

### Changes
1. **Analyzed raw data.js** from git history — 14,140 games across 44 team names (32 current + 12 historical), with 83 ties, spread data from ~2004 onward (42%), weather data only from 2025 (2%)
2. **Extracted `scripts/games-export.json`** (2.1 MB) — raw game array extracted from the legacy `data.js` variable assignment
3. **Created `scripts/migrate-lib.ts`** — Pure parsing/mapping library with no database dependency:
   - `RawGame`, `ParsedGame`, `ParsedBetting`, `ParsedWeather` interfaces
   - `parseGame()` — maps raw abbreviations to typed fields, handles ties (null winner), noon-UTC dates, empty-string-to-null conversions
   - `parseAllGames()` — batch parse
   - `deduplicateGames()` — composite key: `date|homeTeam|awayTeam`
   - `extractSeasons()` — unique sorted season years
   - `generateReport()` — pre-migration summary with counts, percentages, unknown team detection
   - `isKnownTeam()` / `getUnknownTeams()` — validates team names against `prisma/team-data.ts`
   - Spread result mapping: `"Covered"→"COVERED"`, `"Lost"→"LOST"`, `"Push"→"PUSH"`
   - O/U result mapping: `"Over"→"OVER"`, `"Under"→"UNDER"`, `"Push"→"PUSH"`
   - Playoff detection via `PLAYOFF_WEEKS` set: WildCard, Division, ConfChamp, SuperBowl, Champ
4. **Created `scripts/migrate-games.ts`** — Database execution script:
   - Loads `games-export.json`, generates report, validates all team names
   - Creates Season records, builds team→ID and season→ID maps
   - Inserts games in batches of 100 using upsert (idempotent)
   - Creates associated BettingLine and Weather records
   - Post-migration verification with count comparison
5. **Created `src/__tests__/migration.test.ts`** — 30 tests covering:
   - Full game parsing with all fields
   - Betting data mapping (spread, O/U, results)
   - Weather data parsing
   - Missing data → null handling
   - Tie detection (winner null, scoreDiff 0)
   - Away-team winner detection
   - Playoff week detection (all 5 week types)
   - Spread result mapping (all 3 + null)
   - O/U result mapping (all 3 + null)
   - Noon-UTC date storage
   - Batch parsing and empty input
   - Deduplication (same game, different dates, different teams)
   - Season extraction (unique + sorted)
   - Team name resolution (current, historical, unknown)
   - Report generation (counts, ranges, percentages, per-season)
6. **Updated `tsconfig.json`** — Excluded `scripts/migrate-games.ts` from build (uses dynamic Prisma import)

### Outcome
- `npm run build` — **PASS**
- `npm test` — **PASS** (49/49 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  4 passed (4)
     Tests  49 passed (49)
  Duration  695ms
```

### Key Learnings
- Same separation pattern from Cycle 2 applies: pure parsing logic (`migrate-lib.ts`) separated from DB execution (`migrate-games.ts`) enables full testing without Prisma/database
- Dates stored as noon UTC (`T12:00:00Z`) to prevent JavaScript's timezone offset from shifting game dates backward when converting to `Date` objects
- Raw data uses single-char keys (`s`, `w`, `d`, `dt`, `h`, `a`, `hs`, `as`) for size optimization in the original static file — migration maps them to readable field names
- Deduplication key is `date|homeTeam|awayTeam` — same composite unique constraint used in the Prisma schema
- `scripts/migrate-games.ts` must be excluded from tsconfig.json for the same reason as `prisma/seed-teams.ts` — dynamic `import("../src/generated/prisma")` fails at build time

---

## Cycle 5 — Zod Schemas & Validation Layer

**Date:** 2026-02-06

### Hypothesis
Create Zod schemas mirroring every Prisma model for runtime validation. Build query parameter schemas for API routes with coercion, defaults, and constraints. These schemas serve as the contract between frontend and backend, ensuring type safety beyond TypeScript's compile-time checks.

### Changes
1. **Created `src/lib/schemas.ts`** — Complete validation library with:
   - **Enum schemas:** `SubscriptionTierSchema`, `SeasonTypeSchema`, `SpreadResultSchema`, `OUResultSchema`, `ConferenceSchema`, `DivisionSchema` — mirror Prisma enums exactly
   - **Model schemas:** `TeamSchema`, `SeasonSchema`, `GameSchema`, `BettingLineSchema`, `WeatherSchema` — full validation with CUID IDs, nullable fields, coerced dates
   - **Create schemas:** `TeamCreateSchema`, `SeasonCreateSchema`, `GameCreateSchema`, `BettingLineCreateSchema`, `WeatherCreateSchema` — omit `id` for insert operations
   - **Pagination:** `PaginationSchema` — page (min 1, default 1), limit (1–100, default 25), string coercion
   - **Sorting:** `SortOrderSchema` (asc/desc, default desc), `GameSortFieldSchema` (date/homeScore/awayScore/scoreDiff/week, default date)
   - **Game filters:** `GameFiltersSchema` — season, week, team, homeTeam, awayTeam, isPlayoff, primetime, minScore, maxScore, startDate, endDate, winner, hasBetting, hasWeather
   - **Combined query:** `GameQuerySchema` — merges filters + pagination + sorting
   - **Team filters:** `TeamFiltersSchema` — conference, division, isActive, franchiseKey
   - **Season filters:** `SeasonFiltersSchema` — startYear, endYear range
   - **Type exports** for all schemas via `z.infer<>`
   - **`queryBoolean` helper** — custom transformer for string→boolean coercion that correctly handles `"false"` (unlike `z.coerce.boolean()`)
2. **Created `src/__tests__/schemas.test.ts`** — 53 tests covering:
   - All 6 enum schemas (valid values + rejection)
   - TeamSchema (valid, empty name, long abbreviation, invalid conference, missing id)
   - TeamCreateSchema (accepts without id)
   - SeasonSchema (valid, year bounds 1920–2100)
   - GameSchema (valid, tie with null winner, null optionals, negative scores, date coercion)
   - GameCreateSchema (omits id)
   - BettingLineSchema (valid, all nulls, source default)
   - WeatherSchema (valid, all nulls)
   - PaginationSchema (defaults, coercion, bounds)
   - SortOrderSchema (default, valid, invalid)
   - GameSortFieldSchema (default, all valid fields, invalid)
   - GameFiltersSchema (empty, coercion for season/isPlayoff/dates/scores/booleans, team filter)
   - GameQuerySchema (merged filters + pagination + sort, defaults)
   - TeamFiltersSchema (empty, conference validation, division, isActive coercion)
   - SeasonFiltersSchema (empty, year coercion, out-of-range rejection)

### Outcome
- `npm run build` — **PASS**
- `npm test` — **PASS** (102/102 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  5 passed (5)
     Tests  102 passed (102)
  Duration  692ms
```

### Key Learnings
- `z.coerce.boolean()` uses JavaScript's `Boolean()` constructor, which means `Boolean("false")` returns `true` — any non-empty string is truthy. Query params from URLs are always strings, so a custom `queryBoolean` transformer that checks `val === "true"` is needed for correct string→boolean coercion
- Zod's `.omit()` cleanly creates "Create" variants of model schemas without `id` — avoids duplicating the full schema definition
- `z.coerce.date()` handles both `Date` objects and ISO date strings, making it ideal for the `GameSchema.date` field which receives strings from API params and `Date` objects from Prisma
- Season year bounded to 1920–2100 matches the NFL's founding year and prevents far-future invalid data
- Pagination limit capped at 100 prevents large unbounded queries that could overload the database

---

## Cycle 6 — Games API: REST Routes & Query Building

**Date:** 2026-02-06

### Hypothesis
Build the REST API layer for games, teams, and seasons. Separate pure query-building logic from route handlers for testability. Use Zod schemas from Cycle 5 for request validation and the Prisma singleton pattern for database access.

### Changes
1. **Created `src/lib/prisma.ts`** — Prisma client singleton using the global-for-dev pattern to prevent connection exhaustion during hot reload
2. **Created `src/lib/queries.ts`** — Pure query-building functions (no DB dependency):
   - `buildGameWhere(filters)` — translates validated `GameFilters` to Prisma `where` input: season year, week, isPlayoff, primetime, date range (gte/lte), team (OR home/away), homeTeam, awayTeam, winner, hasBetting/hasWeather (relation isNot/is null)
   - `buildGameOrderBy(sort, order)` — maps sort field + order to Prisma `orderBy` object
   - `buildPagination(page, limit)` — calculates `skip`/`take` from page/limit
   - `buildTeamWhere(filters)` — conference, division, isActive, franchiseKey
   - `buildSeasonWhere(filters)` — year range with gte/lte
   - Full TypeScript interfaces for all where/orderBy inputs
3. **Created `src/app/api/games/route.ts`** — `GET /api/games`:
   - Validates query params with `GameQuerySchema.safeParse()`
   - Returns 400 with flattened Zod errors on invalid params
   - Parallel `findMany` + `count` for data + pagination metadata
   - Includes related homeTeam, awayTeam, winner, season, bettingLine, weather
   - Response shape: `{ data: [...], pagination: { page, limit, total, totalPages } }`
4. **Created `src/app/api/games/[id]/route.ts`** — `GET /api/games/:id`:
   - Finds by unique ID with full includes
   - Returns 404 for missing games
   - Next.js 16 async params pattern: `{ params }: { params: Promise<{ id: string }> }`
5. **Created `src/app/api/teams/route.ts`** — `GET /api/teams`:
   - Filters by conference, division, isActive, franchiseKey
   - Sorted alphabetically by name
6. **Created `src/app/api/seasons/route.ts`** — `GET /api/seasons`:
   - Filters by startYear/endYear range
   - Sorted by year descending (most recent first)
7. **Created `src/__tests__/queries.test.ts`** — 34 tests covering:
   - `buildGameWhere`: empty, season, week, isPlayoff, primetime, date range (both/start/end), team OR, homeTeam, awayTeam, winner, hasBetting true/false, hasWeather true/false, combined filters
   - `buildGameOrderBy`: default, custom sort/order
   - `buildPagination`: default, page 2, page 3 with custom limit, page 1 skip=0
   - `buildTeamWhere`: empty, conference, division, isActive, franchiseKey, combined
   - `buildSeasonWhere`: empty, startYear, endYear, range
8. **Updated `package.json`** — Added `prisma generate` to build script and `postinstall` hook for Netlify/CI

### Outcome
- `npm run build` — **PASS** (all 8 routes compiled, including 4 new API routes)
- `npm test` — **PASS** (136/136 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  6 passed (6)
     Tests  136 passed (136)
  Duration  814ms
```

Routes:
```
├ ƒ /api/games
├ ƒ /api/games/[id]
├ ƒ /api/seasons
├ ƒ /api/teams
```

### Key Learnings
- Prisma 6 generates `client.ts` as the entry point (not `index.ts`), so imports must use `@/generated/prisma/client` — bare directory imports fail with Turbopack's module resolver
- `prisma generate` only needs the schema file, not a running database — safe to run at build time and in `postinstall` for CI/Netlify
- Next.js 16 route params are now `Promise`-based: `{ params }: { params: Promise<{ id: string }> }` with `await params` — breaking change from Next.js 15
- The global Prisma singleton pattern (`globalThis as unknown as { prisma }`) prevents connection pool exhaustion during dev hot reload but creates a fresh client in production
- Pure query-building functions that return Prisma-shaped objects are fully testable without mocking — same separation pattern as Cycles 2 and 4

---

## Cycle 7 — Dashboard UI: Game Table, Filters & Stats

**Date:** 2026-02-06

### Hypothesis
Build the main dashboard that users see after login. Display games in a sortable, filterable table with betting data columns, pagination, stat cards for at-a-glance metrics, and a filter bar for season/week/team. The UI should be visually polished with the dark NFL theme and responsive across screen sizes.

### Changes
1. **Updated `src/app/globals.css`** — Established design system with CSS custom properties:
   - Background: `--bg-primary` (#0a0f1a), `--bg-surface` (#141b2d), `--bg-input` (#0d1321)
   - Borders: `--border` (#1e2a45), `--border-hover` (#2a3a55)
   - Accent: `--accent` (#d4af37), `--accent-dim` (#b8941e)
   - Text hierarchy: `--text-primary` (#f0f0f0), `--text-secondary` (#8899aa), `--text-muted` (#5a6a7a)
   - Status colors: `--success` (#22c55e), `--danger` (#ef4444), `--info` (#3b82f6)
   - Custom scrollbar styling for dark theme
   - `.game-row:hover` with subtle gold tint, `.input-glow:focus` with gold box-shadow
2. **Updated `src/lib/providers.tsx`** — Added `QueryClientProvider` wrapping `SessionProvider`:
   - `QueryClient` created via `useState` to prevent recreation on re-render
   - Default `staleTime: 60s`, `refetchOnWindowFocus: false`
3. **Created `src/hooks/use-games.ts`** — TanStack Query hooks:
   - `useGames(params)` — fetches `/api/games` with dynamic query params
   - `useTeams()` — fetches active teams, 5-minute stale time
   - `useSeasons()` — fetches all seasons, 5-minute stale time
4. **Created `src/components/stat-card.tsx`** — Metric card with label, large value, and optional detail text
5. **Created `src/components/filter-bar.tsx`** — Filter controls:
   - Season dropdown (all seasons, most recent first)
   - Week dropdown with readable labels (Week 1–18, Wild Card, Conf. Championship, Super Bowl)
   - Team dropdown (all active teams, alphabetical)
   - "Clear filters" button appears only when filters are active
   - Gold focus glow on select elements
6. **Created `src/components/game-table.tsx`** — Game data table:
   - Columns: Date (with week/primetime badge), Matchup (abbreviation + full name), Score (with total), Spread, O/U, ATS Result, O/U Result
   - Winner team names bold, losers muted
   - Color-coded spread results: COVERED (green), LOST (red), PUSH (gold)
   - Color-coded O/U results: OVER (blue), UNDER (orange), PUSH (gold)
   - Responsive: betting columns hidden on mobile, ATS/O/U result columns hidden on tablet
   - Loading state and empty state with centered messages
   - Formatted dates (e.g., "Sep 8, 2024") with UTC timezone
7. **Created `src/components/pagination.tsx`** — Page navigation:
   - "Showing X–Y of Z games" counter with locale formatting
   - Previous/Next buttons with disabled states
   - Current page / total pages indicator
   - Returns null when total is 0
8. **Created `src/components/dashboard.tsx`** — Main dashboard orchestrator:
   - Stat cards row: Total Games, Page info, Seasons, Teams
   - Filter bar in a bordered panel
   - Game table with automatic re-fetch on filter/page changes
   - Pagination below table
   - Filter changes reset to page 1
   - `max-w-7xl` container with responsive padding
9. **Updated `src/app/page.tsx`** — Replaced placeholder with `<Dashboard />`
10. **Updated `src/__tests__/smoke.test.tsx`** — Mocks `useGames`/`useTeams`/`useSeasons` hooks and TanStack Query
11. **Created `src/__tests__/dashboard.test.tsx`** — 27 tests:
    - StatCard: renders label/value, optional detail, no detail omission
    - GameTable: loading state, empty state, game rows, scores, total score, primetime badge, spread result, O/U result, formatted date, no betting data
    - Pagination: page range text, current/total, buttons, disabled states, null on 0
    - FilterBar: dropdowns with aria labels, team options, clear button visibility, week label formatting

### Outcome
- `npm run build` — **PASS**
- `npm test` — **PASS** (162/162 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  7 passed (7)
     Tests  162 passed (162)
  Duration  916ms
```

### Key Learnings
- `QueryClient` must be created inside `useState(() => new QueryClient())` in App Router — creating it at module scope causes hydration mismatches since the client would be shared across requests on the server
- TanStack Query hooks can be cleanly mocked in Vitest with `vi.mock("@/hooks/use-games")` — returns static data shapes without needing a `QueryClientProvider` in tests
- CSS custom properties in globals.css provide a single source of truth for the design system — all components reference the same tokens, making theme changes trivial
- Responsive table columns with `hidden md:table-cell` / `hidden lg:table-cell` keep the mobile experience clean without horizontal scrolling on small screens
- UTC timezone in `toLocaleDateString` prevents date display shifting when user timezone differs from server — matches the noon-UTC storage decision from Cycle 4
- `useGames` hook rebuilds the query key from all filter params, causing TanStack Query to automatically refetch when any filter changes — no manual invalidation needed
