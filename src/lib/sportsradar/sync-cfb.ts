/**
 * College Football sync logic — maps Sportsradar responses to our Prisma models.
 * NOTE: CFB teams are not yet in the database, so this is API layer + types only.
 * When CFB teams are added to the schema, implement upsert logic similar to syncNflSchedule.
 */

import { getCfbSeasonSchedule, getCfbWeeklySchedule } from "./cfb";
import type { SRCfbGame } from "./types-cfb";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

// ─── Week title → our week format ───────────────────────

function mapWeekTitle(title: string, isPostseason: boolean): string {
  if (!isPostseason) return title; // "1", "2", ..., "15"
  // College Football playoff titles
  if (/playoff/i.test(title)) return "Playoff";
  if (/bowl/i.test(title)) return "Bowl";
  return title;
}

// ─── Day of week from ISO date ──────────────────────────

function getDayOfWeek(isoDate: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(isoDate);
  return days[d.getUTCDay()];
}

// ─── Format ET kickoff time from ISO ────────────────────

function formatKickoffTime(scheduled: string): string | null {
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

export interface PreparedCfbGame {
  srId: string;
  homeAlias: string;
  awayAlias: string;
  scheduled: string;
  status: string;
  homePoints?: number;
  awayPoints?: number;
  weekTitle: string;
  dayOfWeek: string;
  time: string | null;
  isClosed: boolean;
}

function prepareGame(
  srGame: SRCfbGame,
  weekTitle: string,
  isPostseason: boolean
): PreparedCfbGame {
  const isClosed = srGame.status === "closed" || srGame.status === "complete";
  const homePoints = isClosed
    ? (srGame.scoring?.home_points ?? srGame.home.points ?? 0)
    : undefined;
  const awayPoints = isClosed
    ? (srGame.scoring?.away_points ?? srGame.away.points ?? 0)
    : undefined;

  const dayOfWeek = getDayOfWeek(srGame.scheduled);
  const time = formatKickoffTime(srGame.scheduled);

  return {
    srId: srGame.id,
    homeAlias: srGame.home.alias,
    awayAlias: srGame.away.alias,
    scheduled: srGame.scheduled,
    status: srGame.status,
    homePoints,
    awayPoints,
    weekTitle: mapWeekTitle(weekTitle, isPostseason),
    dayOfWeek,
    time,
    isClosed,
  };
}

// ─── Public sync functions ──────────────────────────────

/**
 * Fetch and parse a full CFB season schedule.
 * Returns prepared game data but does NOT sync to DB (no CFB teams in schema yet).
 * Uses 1 API call.
 */
export async function fetchCfbSchedule(
  year: number,
  type: string = "REG"
): Promise<PreparedCfbGame[]> {
  const schedule = await getCfbSeasonSchedule(year, type);
  const isPostseason = type === "PST";
  const games: PreparedCfbGame[] = [];

  for (const week of schedule.weeks) {
    for (const game of week.games) {
      games.push(prepareGame(game, week.title, isPostseason));
    }
  }

  return games;
}

/**
 * Fetch and parse CFB scores for a specific week.
 * Returns prepared game data but does NOT sync to DB.
 * Uses 1 API call.
 */
export async function fetchCfbScores(
  year: number,
  type: string,
  week: number | string
): Promise<PreparedCfbGame[]> {
  const weeklySchedule = await getCfbWeeklySchedule(year, type, week);
  const isPostseason = type === "PST";
  const games: PreparedCfbGame[] = [];

  for (const game of weeklySchedule.week.games) {
    games.push(prepareGame(game, weeklySchedule.week.title, isPostseason));
  }

  return games;
}

// ─── Pure mapping helpers (exported for testing) ────────

export { mapWeekTitle, getDayOfWeek, formatKickoffTime };
