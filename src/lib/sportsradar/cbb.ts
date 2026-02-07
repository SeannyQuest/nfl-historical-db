/**
 * Sportsradar College Basketball API v8 endpoint wrappers.
 * Each function builds the URL and calls the rate-limited client.
 */

import { sportsradarFetch, getNcaambApiKey } from "./client";
import type {
  SRCbbSeasonSchedule,
  SRCbbDailySchedule,
  SRCbbHierarchy,
  SRCbbStandings,
} from "./types-cbb";

const BASE_URL = "https://api.sportradar.com/ncaamb/trial/v8/en";

function cbbUrl(path: string): string {
  const key = getNcaambApiKey();
  return `${BASE_URL}${path}?api_key=${key}`;
}

/**
 * Get the full College Basketball league hierarchy (conferences → teams).
 * Uses 1 API call. Call once at setup.
 */
export async function getCbbHierarchy(): Promise<SRCbbHierarchy> {
  return sportsradarFetch<SRCbbHierarchy>(
    cbbUrl("/league/hierarchy.json"),
    { sport: "ncaamb", endpoint: "hierarchy" }
  );
}

/**
 * Get the full season schedule with all games.
 * @param year e.g. 2024 (for 2023-24 season)
 */
export async function getCbbSeasonSchedule(
  year: number
): Promise<SRCbbSeasonSchedule> {
  return sportsradarFetch<SRCbbSeasonSchedule>(
    cbbUrl(`/games/${year}/schedule.json`),
    { sport: "ncaamb", endpoint: "season_schedule" }
  );
}

/**
 * Get the schedule for a specific day.
 * Includes scores for completed games.
 * @param year e.g. 2024
 * @param date ISO date string, e.g. "2024-01-15"
 */
export async function getCbbDailySchedule(
  year: number,
  date: string
): Promise<SRCbbDailySchedule> {
  return sportsradarFetch<SRCbbDailySchedule>(
    cbbUrl(`/games/${year}/${date}/schedule.json`),
    { sport: "ncaamb", endpoint: "daily_schedule" }
  );
}

/**
 * Get current standings for a season.
 * @param year e.g. 2024
 */
export async function getCbbStandings(
  year: number
): Promise<SRCbbStandings> {
  return sportsradarFetch<SRCbbStandings>(
    cbbUrl(`/seasons/${year}/standings.json`),
    { sport: "ncaamb", endpoint: "standings" }
  );
}
