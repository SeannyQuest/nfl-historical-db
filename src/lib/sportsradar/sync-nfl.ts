/**
 * NFL sync logic — maps Sportsradar responses to our Prisma models.
 * Upserts into existing Game/Team/Season tables.
 */

import { prisma } from "@/lib/prisma";
import { getNflSeasonSchedule, getNflWeeklySchedule } from "./nfl";
import type { SRGame } from "./types";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

// ─── Week title → our week format ───────────────────────

function mapWeekTitle(title: string, isPostseason: boolean): string {
  if (!isPostseason) return title; // "1", "2", ..., "18"
  // Sportsradar playoff titles
  if (/wild\s*card/i.test(title)) return "WildCard";
  if (/divisional/i.test(title)) return "Division";
  if (/conference/i.test(title) || /conf/i.test(title)) return "ConfChamp";
  if (/super\s*bowl/i.test(title)) return "SuperBowl";
  return title;
}

// ─── Day of week from ISO date ──────────────────────────

function getDayOfWeek(isoDate: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(isoDate);
  return days[d.getUTCDay()];
}

// ─── Detect primetime from scheduled time ───────────────

function detectPrimetime(scheduled: string, dayOfWeek: string): string | null {
  const hour = new Date(scheduled).getUTCHours();
  // Games after 23:00 UTC (7 PM ET) on specific days
  if (dayOfWeek === "Mon" && hour >= 23) return "MNF";
  if (dayOfWeek === "Sun" && hour >= 23) return "SNF";
  if (dayOfWeek === "Thu" && hour >= 23) return "TNF";
  // Saturday primetime
  if (dayOfWeek === "Sat" && hour >= 23) return null; // Saturday games aren't labeled primetime
  return null;
}

// ─── Format ET kickoff time from ISO ────────────────────

function formatKickoffTime(scheduled: string): string | null {
  try {
    const d = new Date(scheduled);
    // Convert UTC to ET (UTC-5 or UTC-4 depending on DST)
    // Approximate: use toLocaleString
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

// ─── Process a single SR game → upsert ─────────────────

async function processGame(
  srGame: SRGame,
  weekTitle: string,
  seasonYear: number,
  isPostseason: boolean,
  teamMap: Map<string, string> // abbreviation → team ID
): Promise<"synced" | "skipped" | string> {
  const homeAbbr = srGame.home.alias;
  const awayAbbr = srGame.away.alias;

  const homeTeamId = teamMap.get(homeAbbr);
  const awayTeamId = teamMap.get(awayAbbr);

  if (!homeTeamId || !awayTeamId) {
    return `Unknown team: ${homeAbbr} or ${awayAbbr}`;
  }

  // Get or create season
  const season = await prisma.season.upsert({
    where: { year: seasonYear },
    update: {},
    create: { year: seasonYear },
  });

  const week = mapWeekTitle(weekTitle, isPostseason);
  const dayOfWeek = getDayOfWeek(srGame.scheduled);
  const primetime = detectPrimetime(srGame.scheduled, dayOfWeek);
  const time = formatKickoffTime(srGame.scheduled);

  // Determine scores (only if game is closed/complete)
  const isClosed = srGame.status === "closed" || srGame.status === "complete";
  const homeScore = isClosed
    ? (srGame.scoring?.home_points ?? srGame.home.points ?? 0)
    : 0;
  const awayScore = isClosed
    ? (srGame.scoring?.away_points ?? srGame.away.points ?? 0)
    : 0;
  const scoreDiff = homeScore - awayScore;

  // Determine winner
  let winnerId: string | null = null;
  if (isClosed && homeScore !== awayScore) {
    winnerId = homeScore > awayScore ? homeTeamId : awayTeamId;
  }

  // Game date at noon UTC to avoid timezone shift
  const gameDate = new Date(srGame.scheduled);
  gameDate.setUTCHours(12, 0, 0, 0);

  try {
    await prisma.game.upsert({
      where: {
        date_homeTeamId_awayTeamId: {
          date: gameDate,
          homeTeamId,
          awayTeamId,
        },
      },
      update: {
        // Update scores if game is now closed
        ...(isClosed
          ? {
              homeScore,
              awayScore,
              scoreDiff,
              winnerId,
            }
          : {}),
        time,
        primetime,
      },
      create: {
        seasonId: season.id,
        week,
        date: gameDate,
        time,
        dayOfWeek,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        scoreDiff,
        winnerId,
        primetime,
        isPlayoff: isPostseason,
      },
    });
    return "synced";
  } catch (err) {
    return `DB error for ${awayAbbr}@${homeAbbr}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Build team abbreviation → ID map ───────────────────

async function buildTeamMap(): Promise<Map<string, string>> {
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    select: { id: true, abbreviation: true },
  });
  const map = new Map<string, string>();
  for (const t of teams) {
    map.set(t.abbreviation, t.id);
  }
  return map;
}

// ─── Public sync functions ──────────────────────────────

/**
 * Sync a full NFL season schedule into our Game table.
 * Fetches the season schedule from SR and upserts all games.
 * Uses 1 API call.
 */
export async function syncNflSchedule(
  year: number,
  type: string = "REG"
): Promise<SyncResult> {
  const teamMap = await buildTeamMap();
  const schedule = await getNflSeasonSchedule(year, type);
  const isPostseason = type === "PST";

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  for (const week of schedule.weeks) {
    for (const game of week.games) {
      const outcome = await processGame(
        game,
        week.title,
        year,
        isPostseason,
        teamMap
      );
      if (outcome === "synced") result.synced++;
      else if (outcome === "skipped") result.skipped++;
      else result.errors.push(outcome);
    }
  }

  return result;
}

/**
 * Sync scores for a specific NFL week.
 * Only updates games that are closed/complete.
 * Uses 1 API call.
 */
export async function syncNflScores(
  year: number,
  type: string,
  week: number | string
): Promise<SyncResult> {
  const teamMap = await buildTeamMap();
  const weeklySchedule = await getNflWeeklySchedule(year, type, week);
  const isPostseason = type === "PST";

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  for (const game of weeklySchedule.week.games) {
    if (game.status !== "closed" && game.status !== "complete") {
      result.skipped++;
      continue;
    }
    const outcome = await processGame(
      game,
      weeklySchedule.week.title,
      year,
      isPostseason,
      teamMap
    );
    if (outcome === "synced") result.synced++;
    else if (outcome === "skipped") result.skipped++;
    else result.errors.push(outcome);
  }

  return result;
}

// ─── Pure mapping helpers (exported for testing) ────────

export { mapWeekTitle, getDayOfWeek, detectPrimetime, formatKickoffTime };
