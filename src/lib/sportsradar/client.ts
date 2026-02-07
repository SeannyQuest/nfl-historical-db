/**
 * Sportsradar API client with rate limiting and usage tracking.
 * Enforces 1 QPS, logs every call to ApiUsage table, handles 429 retries.
 * Reusable across NFL, NCAAFB, and NCAAMB.
 */

import { prisma } from "@/lib/prisma";

const RATE_LIMIT_MS = 1100; // slightly over 1 second to be safe
const MAX_RETRIES = 2;
const TRIAL_QUOTA = 1000;
const WARNING_THRESHOLD = 0.8; // warn at 80%

let lastCallTime = 0;

// ─── Rate limiter ───────────────────────────────────────

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastCallTime = Date.now();
}

// ─── Usage tracking ─────────────────────────────────────

export async function logApiCall(
  sport: string,
  endpoint: string
): Promise<void> {
  await prisma.apiUsage.create({
    data: { sport, endpoint },
  });
}

export async function getApiUsage(
  sport: string
): Promise<{ used: number; quota: number; remaining: number; warning: boolean }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const used = await prisma.apiUsage.count({
    where: {
      sport,
      calledAt: { gte: thirtyDaysAgo },
    },
  });

  return {
    used,
    quota: TRIAL_QUOTA,
    remaining: Math.max(0, TRIAL_QUOTA - used),
    warning: used >= TRIAL_QUOTA * WARNING_THRESHOLD,
  };
}

// ─── Core fetch ─────────────────────────────────────────

export interface SportsradarFetchOptions {
  sport: string;
  endpoint: string;
}

export async function sportsradarFetch<T>(
  url: string,
  options: SportsradarFetchOptions
): Promise<T> {
  await waitForRateLimit();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      // Log the call regardless of outcome
      await logApiCall(options.sport, options.endpoint);

      if (response.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = parseInt(
          response.headers.get("retry-after") || "2",
          10
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryAfter * 1000)
        );
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Sportsradar API error: ${response.status} ${response.statusText} for ${url}`
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, (attempt + 1) * 1000)
        );
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

// ─── Key helpers ────────────────────────────────────────

export function getNflApiKey(): string {
  const key = process.env.SPORTSRADAR_NFL_KEY;
  if (!key) throw new Error("SPORTSRADAR_NFL_KEY environment variable is not set");
  return key;
}

export function getNcaafbApiKey(): string {
  const key = process.env.SPORTSRADAR_NCAAFB_KEY;
  if (!key) throw new Error("SPORTSRADAR_NCAAFB_KEY environment variable is not set");
  return key;
}

export function getNcaambApiKey(): string {
  const key = process.env.SPORTSRADAR_NCAAMB_KEY;
  if (!key) throw new Error("SPORTSRADAR_NCAAMB_KEY environment variable is not set");
  return key;
}

// ─── Reset for testing ──────────────────────────────────

export function resetRateLimiter(): void {
  lastCallTime = 0;
}
