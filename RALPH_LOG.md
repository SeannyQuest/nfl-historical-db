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
