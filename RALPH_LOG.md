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

---

## Cycle 8 — Game Detail Page: Scoreboard & Info Panels

**Date:** 2026-02-06

### Hypothesis
Build a dedicated game detail page at `/games/[id]` that users navigate to by clicking rows in the dashboard table. Show a large scoreboard with team abbreviations, scores, and winner indicator, plus info panels for betting line details and weather/game conditions. This creates the navigation skeleton for future features: scorebug, live odds, and forecast widgets.

### Changes
1. **Updated `src/components/game-table.tsx`** — Made rows clickable:
   - Added `useRouter` from `next/navigation`
   - Each `<tr>` has `onClick={() => router.push(\`/games/${game.id}\`)}` with `cursor-pointer`
2. **Added `useGame(id)` to `src/hooks/use-games.ts`** — Single-game TanStack Query hook:
   - Fetches `/api/games/${id}` with `enabled: !!id` guard
   - Query key `["game", id]` for per-game caching
3. **Created `src/components/game-detail.tsx`** — Full game detail view:
   - **Context bar**: season, week, date (long format), kickoff time, primetime badge, playoff badge
   - **Scoreboard**: 3-column grid (away team / scores / home team), large abbreviations, city + nickname, WINNER badge on winning side, gold background tint for winner column, TIE badge for ties, point margin, total score
   - **Betting panel** (InfoPanel): spread with team abbreviation prefix, over/under, ATS result (color-coded), O/U result (color-coded), total points, O/U margin with signed difference
   - **Weather panel** (InfoPanel): temperature, wind, conditions, plus game info section (day, kickoff, season, week)
   - **Empty states**: "No betting data available" / "No weather data available" when absent
   - **Error state**: "Game not found" with "Back to Dashboard" button
   - **Loading state**: centered loading message
   - **Navigation**: "Back to Games" link at top
   - Helper components: `InfoPanel`, `DataRow`, `resultColor` for consistent styling
4. **Created `src/app/games/[id]/page.tsx`** — Client page component:
   - Uses `use(params)` for Next.js 16 async params in client components
   - Passes `useGame` hook data to `GameDetail` component
5. **Updated `src/__tests__/dashboard.test.tsx`** — Added `vi.mock("next/navigation")` for GameTable's `useRouter`
6. **Updated `src/__tests__/smoke.test.tsx`** — Added `vi.mock("next/navigation")` for Dashboard rendering
7. **Created `src/__tests__/game-detail.test.tsx`** — 26 tests:
   - Loading, error, and error back button states
   - Team abbreviations, cities, nicknames in scoreboard
   - Scores, WINNER badge, point margin, total score
   - Primetime badge, formatted date, season year, week display, kickoff time
   - Spread value with team prefix, O/U value, ATS result, O/U result
   - Weather conditions and wind
   - No-data messages for missing betting/weather
   - TIE badge for tied games, Playoff badge
   - Back to Games navigation link

### Outcome
- `npm run build` — **PASS** (9 routes including new `/games/[id]`)
- `npm test` — **PASS** (188/188 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  8 passed (8)
     Tests  188 passed (188)
  Duration  1.20s
```

Routes:
```
├ ƒ /games/[id]    ← NEW
```

### Key Learnings
- Next.js 16 client components use `use(params)` from React to unwrap the `Promise<{ id: string }>` — the `await` pattern only works in server components
- When `useRouter` is used in a child component (GameTable), all tests rendering that component need `vi.mock("next/navigation")` — the mock propagates through the component tree
- The `InfoPanel` / `DataRow` pattern creates a consistent card layout with dividers — reusable for future panels (player stats, franchise history, etc.)
- Color-coded betting results use the same palette as the dashboard table for consistency: green/red/gold for ATS, blue/orange/gold for O/U

### Future Features Noted (from user)
- **Weekly data updates**: automated ingestion of new game results after each NFL week
- **Scorebug widget**: upcoming games within the current week's schedule, showing spread (real-time) and weather forecast (daily updates)
- These will be addressed in future cycles with live data integration and a scorebug component on the dashboard

---

## Cycle 9 — Team Profile Page

**Date:** 2026-02-06

### Hypothesis
Build a team profile page at `/teams/[name]` that displays comprehensive team statistics: all-time record, home/away/playoff splits, ATS record with cover rate, O/U trends, scoring averages, recent games, and season-by-season breakdown. The pure stats computation should be fully testable without a database. Team abbreviations throughout the app should link to their respective profile pages.

### Changes
1. **Created `src/lib/team-stats.ts`** — Pure team stats computation module:
   - `GameForStats` interface — minimal shape for stats computation (no DB dependency)
   - `TeamRecord`, `ATSRecord`, `OURecord`, `SeasonRecord`, `TeamStatsResult` interfaces
   - `computeTeamStats(games, teamName)` — computes all-time record, ATS record (with home/away perspective flip), O/U record, home/away/playoff splits, avg points for/against, and season-by-season breakdowns
   - ATS perspective flip: `spreadResult` is stored from home team perspective — when computing for the away team, COVERED↔LOST are swapped
   - Season records sorted descending (most recent first)
2. **Created `src/app/api/teams/[name]/stats/route.ts`** — `GET /api/teams/:name/stats`:
   - Looks up team by exact name, returns 404 if not found
   - Fetches all games for the team (home + away) with related data
   - Maps DB rows to `GameForStats` interface and calls `computeTeamStats()`
   - Returns team info, computed stats, recent games (last 10), and total game count
   - URL-decodes team name for names with spaces
3. **Added `useTeamStats(teamName)` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Fetches `/api/teams/${encodeURIComponent(teamName)}/stats`
   - 5-minute stale time, `enabled: !!teamName` guard
4. **Created `src/components/team-profile.tsx`** — Full team profile view:
   - **Team header**: abbreviation, city + nickname, conference/division, game count, Historical badge for inactive teams
   - **Record overview**: 4 stat boxes (All-Time, Home, Away, Playoffs) with win-loss-tie and win percentage
   - **Betting trends panel**: ATS record, cover rate (green ≥.500, red <.500), O/U record
   - **Scoring panel**: avg points for/against, avg margin (green positive, red negative)
   - **Recent games**: last 10 with W/L/T indicator, vs/@ opponent, score, ATS/O/U results, date — clickable to game detail
   - **Season-by-season table**: year, record, win%, ATS, cover%, PF, PA — responsive column hiding
   - Loading, error, and empty states matching existing design patterns
   - Reuses `InfoPanel` / `DataRow` / `StatBox` component patterns from game detail
5. **Created `src/app/teams/[name]/page.tsx`** — Client page component:
   - Uses `use(params)` with `decodeURIComponent` for Next.js 16 async params
   - Passes `useTeamStats` hook data to `TeamProfile` component
6. **Updated `src/components/game-table.tsx`** — Added team navigation links:
   - Team abbreviations in the Matchup column are now clickable with `onClick` + `stopPropagation`
   - Gold hover color (`hover:text-[#d4af37]`) on team abbreviations
   - Row click still navigates to game detail, team click navigates to team profile
7. **Updated `src/components/game-detail.tsx`** — Added team navigation links:
   - Team abbreviations in the scoreboard are now clickable
   - Gold hover color on abbreviations
8. **Created `src/__tests__/team-stats.test.ts`** — 31 tests covering:
   - Empty games, home/away win/loss/tie, win percentage calculation
   - Home/away record splits
   - Playoff record (only counts playoff games, zeroes for none)
   - ATS: home COVERED/LOST/PUSH, away perspective flip (COVERED↔LOST), null skip, cover pct
   - O/U: OVER/UNDER/PUSH counts, null skip
   - Scoring averages: home/away perspective, empty games
   - Season breakdown: grouping, descending sort, per-season record/ATS/points
   - Full integration test with multi-season dataset
9. **Created `src/__tests__/team-profile.test.tsx`** — 23 tests covering:
   - Loading, error, back button states
   - Team info: abbreviation, name, conference/division, total games
   - Records: all-time, home, away, playoff
   - Betting: ATS record, cover rate, O/U record
   - Scoring: avg points for, avg points against
   - Recent games: W/L indicators, vs/@ opponent format, spread/O/U results
   - Season table: years, records
   - Historical badge for inactive teams
   - Empty recent games message

### Outcome
- `npm run build` — **PASS** (11 routes including new `/api/teams/[name]/stats` and `/teams/[name]`)
- `npm test` — **PASS** (242/242 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  10 passed (10)
     Tests  242 passed (242)
  Duration  1.39s
```

Routes:
```
├ ƒ /api/teams/[name]/stats    ← NEW
├ ƒ /teams/[name]              ← NEW
```

### Key Learnings
- ATS records are stored from the home team's perspective in the database — when computing stats for a specific team, the perspective must be flipped for away games (home COVERED = away LOST, home LOST = away COVERED)
- `(0 / 1).toFixed(3)` returns `"0.000"` (with leading zero), not `".000"` — the `.000` format only appears when dividing by zero and returning the fallback. Tests must account for this difference
- `stopPropagation()` on nested clickable elements prevents the parent row's click handler from firing — allows team links inside clickable game rows
- The same pure-logic separation pattern (Cycles 2, 4, 5, 6) continues to pay dividends: `computeTeamStats` is a pure function with 31 tests, fully independent of Prisma or API layer
- URL encoding is needed for team names with spaces (e.g., "Kansas City Chiefs" → "Kansas%20City%20Chiefs") — both the hook and the API route handle encoding/decoding

---

## Cycle 10 — Head-to-Head Matchup Comparison

**Date:** 2026-02-07

### Hypothesis
Build a head-to-head matchup comparison page at `/matchups` where users select two teams and see their full rivalry history: W-L-T record, scoring trends, betting trends (favorite/cover data, O/U splits), win streaks, and a recent games table. Add navigation links in the navbar for discoverability.

### Changes
1. **Created `src/lib/matchups.ts`** — Pure H2H matchup computation module:
   - `MatchupGame` interface — minimal shape for matchup computation
   - `MatchupRecord`, `MatchupScoringTrend`, `MatchupBettingTrend`, `MatchupGameSummary`, `MatchupResult` interfaces
   - `computeMatchup(games, team1, team2)` — computes:
     - Both teams' W-L-T records against each other
     - Scoring trends: avg total, avg margin, highest/lowest total
     - Betting trends: which team was favored more often + how often they covered, avg spread, O/U splits with over percentage
     - Win streak: walks backwards from most recent game to find current streak (broken by tie or opponent win)
     - Recent games: last 10 with full game details, most recent first
   - Favorite detection: determines who was favored based on spread sign and home/away position, tracks cover rate per favorite
   - Margin calculation: computed from team1's perspective across home and away games
2. **Created `src/app/api/matchups/route.ts`** — `GET /api/matchups?team1=...&team2=...`:
   - Validates both team names required and must be different
   - Verifies both teams exist, returns 404 if not found
   - Fetches all games between the two teams with related data
   - Maps DB rows to `MatchupGame` interface and calls `computeMatchup()`
   - Returns matchup result plus team info (abbreviation, city, nickname)
3. **Added `useMatchup(team1, team2)` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Fetches `/api/matchups` with query params
   - `enabled` guard: both teams must be set and different
   - 5-minute stale time
4. **Created `src/components/matchup-comparison.tsx`** — Full H2H comparison view:
   - **H2H scoreboard**: 3-column grid with team1 record / VS divider / team2 record, gold tint on leading team, total games count, current win streak
   - **Scoring trends panel**: avg total, avg margin, highest/lowest totals
   - **Betting trends panel**: favorite info, avg spread, O/U record, over percentage (blue/orange color coding)
   - **Recent matchups table**: date, matchup, score, ATS result, O/U result — responsive column hiding
   - Team abbreviations clickable to team profiles
   - Loading, error, null states
5. **Created `src/app/matchups/page.tsx`** — Matchups page with team selector:
   - Two dropdown selectors with all active teams (alphabetical)
   - Disables already-selected team in opposite dropdown
   - VS divider between selectors
   - Clear button when any team selected
   - Same-team validation error message
   - Prompt text when no selection made
   - TanStack Query auto-fetches when both teams selected
6. **Updated `src/components/navbar.tsx`** — Added navigation links:
   - Made "GridIron Intel" title a link to home
   - Added "Games" and "Matchups" nav links in a bordered section
   - Links hidden on mobile, visible on `sm:` breakpoint
   - Gold hover color on all nav links
   - Imported `Link` from `next/link` for client-side navigation
7. **Created `src/__tests__/matchups.test.ts`** — 24 tests covering:
   - Empty games, team1/team2 home/away wins, ties, mixed results pct
   - Scoring: avg total/margin, highest/lowest, away perspective
   - Betting: home/away favorite detection, favorite cover tracking, avg spread, O/U counts, no spread data, null O/U skip
   - Streak: single, multi-game, tie break, team2 streak
   - Recent games: limit 10, fewer than 10, game details
   - Full integration test with multi-season rivalry
8. **Created `src/__tests__/matchup-comparison.test.tsx`** — 22 tests covering:
   - Loading, error, null states
   - Team abbreviations, cities, nicknames
   - Total games count, team records (both sides)
   - Win streak display
   - Scoring trends (all 4 values)
   - Betting: favorite info, avg spread, O/U record, over pct
   - Recent game dates, scores, ATS/O/U results, playoff week labels
   - Empty games message, no streak display
9. **Created `src/__tests__/matchups-page.test.tsx`** — 5 tests covering:
   - Page title, team selector dropdowns, team options, prompt text, description

### Outcome
- `npm run build` — **PASS** (13 routes including new `/api/matchups` and `/matchups`)
- `npm test` — **PASS** (293/293 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  13 passed (13)
     Tests  293 passed (293)
  Duration  1.53s
```

Routes:
```
├ ƒ /api/matchups    ← NEW
├ ƒ /matchups        ← NEW
```

### Key Learnings
- Favorite detection requires combining spread sign with home/away position: negative spread = home favored, positive = away favored. When team1 is away and spread is positive, team1 is the favorite
- Win streak calculation must walk backwards from the most recent game — a tie breaks any streak, not just a loss
- The navbar is a server component (uses `auth()`) so navigation links use `next/link` `Link` instead of `useRouter` — `Link` works in both server and client components
- Team abbreviations appearing in both the scoreboard header and the recent games table cause `getByText` failures in tests — `getAllByText` with `toBeGreaterThanOrEqual(1)` handles this pattern
- The `computeMatchup` function naturally produces symmetric records: team1Record.wins === team2Record.losses, which simplifies the API response

---

## Cycle 11 — League-Wide Trends Dashboard

**Date:** 2026-02-07

### Hypothesis
Build a league-wide trends dashboard at `/trends` that displays historical scoring, home-field advantage, and betting trends across all NFL seasons. Include overall stats, season-by-season breakdown, primetime slot analysis, and playoff vs regular season comparison. The pure trend computation should be fully testable without a database.

### Changes
1. **Created `src/lib/trends.ts`** — Pure league-wide trend computation module:
   - `TrendGame` interface — minimal shape for trend computation (no DB dependency)
   - `SeasonTrend`, `PrimetimeTrend`, `TrendsResult` interfaces
   - `computeTrends(games)` — single-pass computation of:
     - Overall stats: avg total points, home win percentage (excludes ties from denominator), over percentage, highest/lowest scoring games
     - Season-by-season breakdown: game count, avg total, avg home/away score, home/away/tie record, home win pct, O/U splits, home cover rate
     - Primetime trends by slot (SNF/MNF/TNF): game count, avg total, home win pct, over pct
     - Playoff vs regular season comparison: avg total, home win pct for each
   - Seasons sorted descending, primetime sorted by game count descending
   - Empty game array returns zero-value defaults
2. **Created `src/app/api/trends/route.ts`** — `GET /api/trends`:
   - Fetches all games with season and bettingLine includes, ordered by date ascending
   - Maps DB rows to `TrendGame` interface and calls `computeTrends()`
   - Returns `{ data: TrendsResult }`
3. **Added `useTrends()` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Fetches `/api/trends` with 5-minute stale time
4. **Created `src/components/trends-dashboard.tsx`** — Full trends dashboard view:
   - **Overview stat boxes**: total games (with season count), avg total, home win %, over %, scoring range (low–high)
   - **Playoff vs Regular panels**: side-by-side comparison of avg total and home win pct with color-coded percentages (green >0.500, red <0.500, gold =0.500)
   - **Primetime breakdown table**: slot name (gold), game count, avg total, home win %, over % — hidden when empty
   - **Season-by-season table**: year, games, avg total, home win %, over %, home cover %, home-away-tie record — responsive column hiding for mobile/tablet
   - Loading, error, null states matching existing design patterns
   - Reuses `InfoPanel` / `DataRow` / `StatBox` component patterns
   - `pctColor` helper for consistent percentage color coding
5. **Created `src/app/trends/page.tsx`** — Trends page:
   - "League Trends" title with description
   - `useTrends` hook data passed to `TrendsDashboard` component
6. **Updated `src/components/navbar.tsx`** — Added "Trends" nav link alongside Games and Matchups
7. **Created `src/__tests__/trends.test.ts`** — 20 tests covering:
   - Empty games zero-value defaults
   - Overall stats: avg total, home win pct (excludes ties), over pct (excludes null), highest/lowest scoring games, game/season counts
   - Season breakdown: grouping, descending sort, per-season stats (avg, home/away splits), O/U stats, spread stats
   - Primetime: grouping by slot, avg total, home win pct, over pct, non-primetime exclusion
   - Playoff vs regular: split stats, regular/playoff home win pct, no playoff games edge case
   - Full integration test with multi-season dataset
8. **Created `src/__tests__/trends-dashboard.test.tsx`** — 24 tests covering:
   - Loading, error, null states
   - Overview stat boxes: total games, seasons, avg total, home win %, over %, scoring range
   - Playoff vs regular: panel titles, avg total values, home win pct values
   - Primetime table: header, slot names, game counts, avg totals
   - Season table: header, years, game counts, avg totals, home-away-tie records
   - Empty primetime/season sections hidden
9. **Created `src/__tests__/trends-page.test.tsx`** — 2 tests: page title, description text

### Outcome
- `npm run build` — **PASS** (15 routes including new `/api/trends` and `/trends`)
- `npm test` — **PASS** (339/339 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  16 passed (16)
     Tests  339 passed (339)
  Duration  2.18s
```

Routes:
```
├ ƒ /api/trends    ← NEW
├ ƒ /trends        ← NEW
```

### Key Learnings
- Home win percentage should exclude ties from the denominator (decisions = homeWins + awayWins, not total games) — this gives a more accurate picture of home-field advantage
- The single-pass computation pattern (one loop populating multiple maps/accumulators) is efficient for league-wide stats — iterating 14K+ games only once keeps API response time reasonable
- The `pctColor` helper centralizes the threshold-based color logic (green/red/gold at 0.500) — reusable across season table, primetime table, and playoff comparison
- Unused variables that only serve as accumulators in a loop (e.g., `ties` at the overall level) should be removed if they're only tracked in sub-aggregations (season-level) — ESLint catches this as a warning

---

## Cycle 12 — Division & Conference Standings

**Date:** 2026-02-07

### Hypothesis
Build a division/conference standings page at `/standings` where users can view NFL teams ranked within their divisions by win percentage. Support filtering by season (or all-time) and display comprehensive records including home/away splits, division/conference records, point differentials, and current streaks. Teams should link to their profile pages for deeper analysis.

### Changes
1. **Created `src/lib/standings.ts`** — Pure standings computation module:
   - `StandingsGame`, `TeamInfo`, `TeamStanding`, `DivisionStandings`, `StandingsResult` interfaces
   - `computeStandings(games, teams, season?)` — computes:
     - W-L-T record with win percentage for each team
     - Points for/against and point differential
     - Home/away split records
     - Division record (games against same-division opponents)
     - Conference record (games against same-conference opponents)
     - Current streak (W/L/T + count, walking backward from most recent game)
   - Excludes playoff games from standings (regular season only)
   - Teams sorted by win pct (desc) then point differential (desc) as tiebreaker
   - Divisions ordered: AFC EAST/NORTH/SOUTH/WEST, then NFC EAST/NORTH/SOUTH/WEST
   - Pre-computes division and conference team sets for O(1) lookups during game processing
2. **Created `src/app/api/standings/route.ts`** — `GET /api/standings?season=`:
   - Optional `season` query param to filter by year (validates 1920–2100)
   - Fetches active teams and all games (or season-filtered), maps to interfaces
   - Returns `{ data: StandingsResult }` with grouped division standings
3. **Added `useStandings(season)` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Fetches `/api/standings` with optional season param
   - 5-minute stale time
4. **Created `src/components/standings-dashboard.tsx`** — Full standings dashboard view:
   - **Conference sections**: AFC and NFC with bold headers
   - **Division tables**: one per division with division label header
   - **Team rows**: rank number, abbreviation (gold), nickname, W-L-T, PCT, PF, PA, point diff (green positive/red negative), home/away/div/conf records, streak (green W/red L)
   - Responsive column hiding: PF/PA/DIFF on sm+, HOME/AWAY on md+, DIV/CONF/STRK on lg+
   - Rows clickable to team profile pages
   - Loading, error, null states
5. **Created `src/app/standings/page.tsx`** — Standings page:
   - "Standings" title with dynamic description (season or all-time)
   - Season dropdown selector using `useSeasons` hook
   - Clear button to return to all-time view
   - Auto-fetches standings when season changes
6. **Updated `src/components/navbar.tsx`** — Added "Standings" nav link alongside Games, Matchups, Trends
7. **Created `src/__tests__/standings.test.ts`** — 23 tests covering:
   - Empty games (zero records), null/provided season
   - Basic records: home wins, away wins, ties, win percentage, point differential
   - Home/away split records with ties
   - Division record tracking (same-division games only)
   - Conference record tracking (same-conference, excludes cross-conference)
   - Playoff game exclusion from standings
   - Sorting by win pct desc, point diff tiebreaker
   - Division ordering (AFC before NFC, EAST/NORTH/SOUTH/WEST)
   - Streak computation: winning, losing, no games
   - Full integration test with mini season
8. **Created `src/__tests__/standings-dashboard.test.tsx`** — 21 tests covering:
   - Loading, error, null states
   - Conference headers (AFC, NFC), division labels
   - Team abbreviations, nicknames
   - Win/loss counts, win percentage
   - Points for/against, positive point diff with + prefix
   - Home/away records, division/conference records
   - Winning/losing streak display
   - Rank numbers
9. **Created `src/__tests__/standings-page.test.tsx`** — 4 tests: title, season selector, all-time option, description text

### Outcome
- `npm run build` — **PASS** (17 routes including new `/api/standings` and `/standings`)
- `npm test` — **PASS** (387/387 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  19 passed (19)
     Tests  387 passed (387)
  Duration  2.44s
```

Routes:
```
├ ƒ /api/standings    ← NEW
├ ƒ /standings        ← NEW
```

### Key Learnings
- Division/conference record computation requires pre-computing team sets per team (which teams share a division/conference) — avoids O(n²) lookups during game processing by using `Set.has()` for O(1) checks
- Standings should only count regular season games — playoff games are excluded by filtering `isPlayoff: false` before processing
- Win percentage for standings uses total games as denominator (W/total, including ties), unlike the trends module which excludes ties — this matches the standard NFL standings format where ties count as half a win
- Point differential is the primary tiebreaker after win percentage in NFL standings — more meaningful than alphabetical or head-to-head for a general standings view
- The `formatSplitRecord` helper omits ties when zero (e.g., "7-1" vs "6-1-1") — keeps the display clean for the majority of games that don't end in ties
- Streak computation walks games backward (most recent first) — breaks on any result that differs from the initial result, naturally handling ties as streak-breakers

---

## Cycle 13 — Record Book / Superlatives

**Date:** 2026-02-07

### Hypothesis
Build a record book page at `/records` that surfaces the most extreme and notable games and team seasons from the entire 14,140-game dataset. Include highest/lowest scoring games, biggest blowouts, closest games, highest home/away scores, and best/worst team season records. Users should be able to browse categories and click through to game detail or team profile pages.

### Changes
1. **Created `src/lib/records.ts`** — Pure record book computation module:
   - `RecordGame`, `RecordEntry`, `TeamSeasonEntry`, `RecordsResult` interfaces
   - `computeRecords(games, limit?)` — computes 8 superlative categories:
     - Highest scoring games (total points descending)
     - Lowest scoring games (total points ascending)
     - Biggest blowouts (margin descending)
     - Closest games (margin ascending, ties labeled "TIE")
     - Highest home scores
     - Highest away scores
     - Best team seasons (win% descending, min 10 games, regular season only)
     - Worst team seasons (win% ascending, min 10 games, regular season only)
   - Each entry includes rank, value, label, and full game/team data for click-through
   - Team season records exclude playoff games and require minimum 10 games to filter out partial seasons
   - Configurable limit (default 10) for number of entries per category
2. **Created `src/app/api/records/route.ts`** — `GET /api/records`:
   - Fetches all games with full includes (teams, winner, season, bettingLine)
   - Maps to `RecordGame` interface and calls `computeRecords(games, 15)`
   - Returns `{ data: RecordsResult }`
3. **Added `useRecords()` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Fetches `/api/records` with 5-minute stale time
4. **Created `src/components/records-dashboard.tsx`** — Full records dashboard view:
   - **Category selector**: 8 buttons in a flex-wrap layout, active category highlighted with gold background
   - **Game record table**: rank (gold), matchup (away @ home with winner bold), score, value (gold), season, date — playoff badge on playoff games
   - **Team season table**: rank, team abbreviation + name, season, record, win% — clickable to team profiles
   - Rows clickable to game detail or team profile pages
   - Responsive column hiding: season on sm+, date on md+
   - Loading, error, null, and empty states
5. **Created `src/app/records/page.tsx`** — Record Book page:
   - "Record Book" title with description
   - `useRecords` hook data passed to `RecordsDashboard` component
6. **Updated `src/components/navbar.tsx`** — Added "Records" nav link
7. **Created `src/__tests__/records.test.ts`** — 20 tests covering:
   - Empty games, highest/lowest scoring ranking, labels
   - Biggest blowouts ranking and labels
   - Closest games ranking with TIE label
   - Highest home/away score ranking and labels
   - Best/worst team seasons with win%, playoff exclusion, 10-game minimum, ties in detail
   - Custom limit, fewer than limit, mixed dataset integration
8. **Created `src/__tests__/records-dashboard.test.tsx`** — 15 tests covering:
   - Loading, error, null states
   - Category button rendering
   - Default category display (highest scoring)
   - Game matchup, scores, season, rank rendering
   - Category switching: blowouts, closest games, best seasons, worst seasons, lowest scoring
   - Empty category "No records found" message
9. **Created `src/__tests__/records-page.test.tsx`** — 2 tests: title, description text

### Outcome
- `npm run build` — **PASS** (19 routes including new `/api/records` and `/records`)
- `npm test` — **PASS** (424/424 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  22 passed (22)
     Tests  424 passed (424)
  Duration  2.72s
```

Routes:
```
├ ƒ /api/records    ← NEW
├ ƒ /records        ← NEW
```

### Key Learnings
- Team season records need a minimum game threshold (10 games) to filter out partial seasons from early NFL history or mid-season franchise relocations — without this, a team going 1-0 in a partial season would top "best seasons"
- The `sortAndRank` helper pattern (sort first, slice, then assign ranks) cleanly produces ranked lists without maintaining rank state during sort — simpler than tracking indices
- Text values like "3" can appear in multiple table cells (score column AND value column) causing `getByText` failures — use `getAllByText` with `toBeGreaterThanOrEqual(1)` for values that naturally repeat
- The same active category text appears in both the button (selected state) and the panel header — another case for `getAllByText`
- Playoff games should be excluded from team season win% records since they're bonus games that would inflate a team's total game count relative to regular-season-only teams

---

## Cycle 14 — Weekly Schedule & Scorebug Widget

**Date:** 2026-02-07

### Hypothesis
Build a weekly schedule page at `/schedule` with scorebug-style game cards that show matchups, scores (for completed games), team records, spreads, and over/under lines. Support filtering by season and week. Group games by day within each week (Thursday → Sunday → Monday). This creates the foundation for future real-time odds and weather forecast integration directly addressing the user's stated need for a "scorebug of all upcoming games within that week's schedule that includes the spread."

### Changes
1. **Created `src/lib/schedule.ts`** — Pure schedule computation module:
   - `ScheduleGame`, `ScorebugEntry`, `WeekGroup`, `ScheduleResult` interfaces
   - `computeSchedule(games, filterSeason?, filterWeek?)` — computes:
     - Week grouping with proper ordering (Weeks 1–18, then WildCard → Division → ConfChamp → SuperBowl)
     - Game sorting within weeks by day order (Thu → Fri → Sat → Sun → Mon) then by kickoff time
     - Team records computed from regular-season games for the season (excludes playoffs, skips unplayed 0-0 games)
     - Status labels: "Final" for completed, "TIE" for ties, time with "ET" suffix for upcoming, "TBD" for no time set
     - Available seasons (descending) and available weeks for the filtered season
   - `weekLabel()` helper: converts week codes to readable labels ("1" → "Week 1", "WildCard" → "Wild Card", etc.)
   - Day-within-week sorting ensures Thursday Night Football appears first, Monday Night Football last
2. **Created `src/app/api/schedule/route.ts`** — `GET /api/schedule?season=&week=`:
   - Optional `season` and `week` query params
   - Validates season range (1920–2100)
   - Fetches all games with team, winner, season, and bettingLine includes
   - Maps to `ScheduleGame` interface and calls `computeSchedule()`
   - Returns `{ data: ScheduleResult }`
3. **Added `useSchedule(season, week)` to `src/hooks/use-games.ts`** — TanStack Query hook:
   - Builds query params from season/week, 5-minute stale time
4. **Created `src/components/schedule-dashboard.tsx`** — Full schedule dashboard view:
   - **Scorebug card component**: compact game card with status bar (Final/time/TIE), primetime and playoff badges, away team row (abbreviation + record + score), home team row (abbreviation + record + score), betting footer (spread + O/U) — gold tint on winner's row, green status for upcoming games, team abbreviations clickable to profiles
   - **Week sections**: header with week label + season, games grouped by day (Thursday, Sunday, Monday)
   - **Day headers**: full day name with formatted date
   - **Responsive grid**: 1 column mobile, 2 on sm, 3 on lg
   - **Filter controls**: season dropdown, week dropdown (appears when season selected), clear button, game count
   - Season change resets week selection
   - Loading, error, null, and empty states
5. **Created `src/app/schedule/page.tsx`** — Schedule page:
   - "Schedule" title with description
   - `useState` for season and week filters
   - `useSchedule` hook data passed to `ScheduleDashboard` component
6. **Updated `src/components/navbar.tsx`** — Added "Schedule" nav link alongside Games, Matchups, Trends, Standings, Records
7. **Created `src/__tests__/schedule.test.ts`** — 26 tests covering:
   - `weekLabel`: numeric weeks, playoff rounds, unknown values
   - Empty games, season filtering (filter + available seasons preserved)
   - Week filtering (filter + available weeks for season)
   - Week grouping: game count per week, ascending week order, playoff after regular season, correct weekLabel
   - Game sorting: day order (Thu before Sun before Mon), time order within same day
   - Status labels: Final, TIE, upcoming with time, TBD
   - Team records: computed from regular season, playoff exclusion, ties in format, unplayed games
   - Betting data passthrough: spread and overUnder preserved, null handling
   - Multi-season ordering (descending)
8. **Created `src/__tests__/schedule-dashboard.test.tsx`** — 20 tests covering:
   - Loading, error, null states
   - Season dropdown, onSeasonChange callback, week dropdown visibility
   - Clear button when season set
   - Week headers, game count
   - Team abbreviations, scores, team records, status labels (Final, upcoming time)
   - Primetime badge, spread, O/U in betting footer
   - Day grouping (Thursday, Sunday)
   - Empty schedule "No games found" message
9. **Created `src/__tests__/schedule-page.test.tsx`** — 2 tests: title, description text

### Outcome
- `npm run build` — **PASS** (21 routes including new `/api/schedule` and `/schedule`)
- `npm test` — **PASS** (472/472 tests passing)
- `npx eslint src/` — **PASS** (0 errors)

### Verification
```
Test Files  25 passed (25)
     Tests  472 passed (472)
  Duration  3.02s
```

Routes:
```
├ ƒ /api/schedule    ← NEW
├ ƒ /schedule        ← NEW
```

### Key Learnings
- NFL weeks have a predictable day ordering (Thu → Fri → Sat → Sun → Mon) that differs from calendar order — a custom `DAY_ORDER` map ensures Thursday Night Football appears first and Monday Night Football last within each week
- Team records on scorebugs must be computed from the full season's regular-season games (not just the filtered week) — otherwise the record would only reflect games in the current view
- Unplayed games (both scores 0, no winner) must be distinguished from 0-0 ties — checking all three conditions prevents counting upcoming games as ties in team records
- The scorebug card pattern (status bar → team rows → betting footer) naturally maps to a compact card layout where each section has a clear purpose — status at top, matchup in middle, betting context at bottom
- Cascading filter resets (season change clears week) prevent stale filter combinations — selecting a new season should always start with "All Weeks" to avoid showing an empty week that doesn't exist in the new season
- `computeSchedule` takes the full game array for record computation even when filtering — this ensures team records are accurate across the entire season regardless of which week is displayed
