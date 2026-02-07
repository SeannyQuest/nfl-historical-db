/**
 * Sportsradar College Football API v7 endpoint wrappers.
 * Each function builds the URL and calls the rate-limited client.
 */

import { sportsradarFetch, getNcaafbApiKey } from "./client";
import type {
  SRCfbSeasonSchedule,
  SRCfbWeeklySchedule,
  SRCfbHierarchy,
  SRCfbStandings,
} from "./types-cfb";

const BASE_URL = "https://api.sportradar.com/ncaafb/trial/v7/en";

function cfbUrl(path: string): string {
  const key = getNcaafbApiKey();
  return `${BASE_URL}${path}?api_key=${key}`;
}

/**
 * Get the full College Football league hierarchy (conferences → teams).
 * Uses 1 API call. Call once at setup.
 */
export async function getCfbHierarchy(): Promise<SRCfbHierarchy> {
  return sportsradarFetch<SRCfbHierarchy>(
    cfbUrl("/league/hierarchy.json"),
    { sport: "ncaafb", endpoint: "hierarchy" }
  );
}

/**
 * Get the full season schedule with all weeks and games.
 * @param year e.g. 2024
 * @param type "REG" | "PST"
 */
export async function getCfbSeasonSchedule(
  year: number,
  type: string = "REG"
): Promise<SRCfbSeasonSchedule> {
  return sportsradarFetch<SRCfbSeasonSchedule>(
    cfbUrl(`/games/${year}/${type}/schedule.json`),
    { sport: "ncaafb", endpoint: "season_schedule" }
  );
}

/**
 * Get the schedule for a specific week.
 * Includes scores for completed games and weather data.
 * @param year e.g. 2024
 * @param type "REG" | "PST"
 * @param week Week number (1-15) or playoff round
 */
export async function getCfbWeeklySchedule(
  year: number,
  type: string,
  week: number | string
): Promise<SRCfbWeeklySchedule> {
  return sportsradarFetch<SRCfbWeeklySchedule>(
    cfbUrl(`/games/${year}/${type}/${week}/schedule.json`),
    { sport: "ncaafb", endpoint: "weekly_schedule" }
  );
}

/**
 * Get current standings for a season.
 * @param year e.g. 2024
 * @param type "REG" | "PST"
 */
export async function getCfbStandings(
  year: number,
  type: string = "REG"
): Promise<SRCfbStandings> {
  return sportsradarFetch<SRCfbStandings>(
    cfbUrl(`/seasons/${year}/${type}/standings.json`),
    { sport: "ncaafb", endpoint: "standings" }
  );
}
