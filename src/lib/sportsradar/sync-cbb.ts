/**
 * College Basketball sync logic — maps Sportsradar responses to our Prisma models.
 * NOTE: CBB teams are not yet in the database, so this is API layer + types only.
 * When CBB teams are added to the schema, implement upsert logic similar to syncNflSchedule.
 */

import { getCbbSeasonSchedule, getCbbDailySchedule } from "./cbb";
import type { SRCbbGame } from "./types-cbb";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

// ─── Day of week from ISO date ──────────────────────────

function getDayOfWeek(isoDate: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(isoDate);
  return days[d.getUTCDay()];
}

// ─── Format ET game time from ISO ───────────────────────

function formatGameTime(scheduled: string): string | null {
  try {
    const d = new Date(scheduled);
    const et = d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });
    return et;
  } catch {
    return null;
  }
}

// ─── Prepare game data (exported for future DB integration) ─────────────────

export interface PreparedCbbGame {
  srId: string;
  homeAlias: string;
  awayAlias: string;
  scheduled: string;
  status: string;
  homePoints?: number;
  awayPoints?: number;
  dayOfWeek: string;
  time: string | null;
  isClosed: boolean;
}

function prepareGame(srGame: SRCbbGame): PreparedCbbGame {
  const isClosed = srGame.status === "closed" || srGame.status === "complete";
  const homePoints = isClosed
    ? (srGame.scoring?.home_points ?? srGame.home.points ?? 0)
    : undefined;
  const awayPoints = isClosed
    ? (srGame.scoring?.away_points ?? srGame.away.points ?? 0)
    : undefined;

  const dayOfWeek = getDayOfWeek(srGame.scheduled);
  const time = formatGameTime(srGame.scheduled);

  return {
    srId: srGame.id,
    homeAlias: srGame.home.alias,
    awayAlias: srGame.away.alias,
    scheduled: srGame.scheduled,
    status: srGame.status,
    homePoints,
    awayPoints,
    dayOfWeek,
    time,
    isClosed,
  };
}

// ─── Public sync functions ──────────────────────────────

/**
 * Fetch and parse a full CBB season schedule.
 * Returns prepared game data but does NOT sync to DB (no CBB teams in schema yet).
 * Uses 1 API call.
 */
export async function fetchCbbSeasonSchedule(
  year: number
): Promise<PreparedCbbGame[]> {
  const schedule = await getCbbSeasonSchedule(year);
  const games: PreparedCbbGame[] = [];

  for (const game of schedule.games) {
    games.push(prepareGame(game));
  }

  return games;
}

/**
 * Fetch and parse CBB games for a specific day.
 * Returns prepared game data but does NOT sync to DB.
 * Uses 1 API call.
 */
export async function fetchCbbDailySchedule(
  year: number,
  date: string
): Promise<PreparedCbbGame[]> {
  const dailySchedule = await getCbbDailySchedule(year, date);
  const games: PreparedCbbGame[] = [];

  for (const game of dailySchedule.games) {
    games.push(prepareGame(game));
  }

  return games;
}

// ─── Pure mapping helpers (exported for testing) ────────

export { getDayOfWeek, formatGameTime };
