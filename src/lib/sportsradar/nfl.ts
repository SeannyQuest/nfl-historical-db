/**
 * Sportsradar NFL API v7 endpoint wrappers.
 * Each function builds the URL and calls the rate-limited client.
 */

import { sportsradarFetch, getNflApiKey } from "./client";
import type {
  SRSeasonSchedule,
  SRWeeklySchedule,
  SRHierarchy,
  SRStandings,
} from "./types";

const BASE_URL = "https://api.sportradar.com/nfl/official/trial/v7/en";

function nflUrl(path: string): string {
  const key = getNflApiKey();
  return `${BASE_URL}${path}?api_key=${key}`;
}

/**
 * Get the full NFL league hierarchy (conferences → divisions → teams).
 * Uses 1 API call. Call once at setup.
 */
export async function getNflHierarchy(): Promise<SRHierarchy> {
  return sportsradarFetch<SRHierarchy>(
    nflUrl("/league/hierarchy.json"),
    { sport: "nfl", endpoint: "hierarchy" }
  );
}

/**
 * Get the full season schedule with all weeks and games.
 * @param year e.g. 2024
 * @param type "REG" | "PST" | "PRE"
 */
export async function getNflSeasonSchedule(
  year: number,
  type: string = "REG"
): Promise<SRSeasonSchedule> {
  return sportsradarFetch<SRSeasonSchedule>(
    nflUrl(`/games/${year}/${type}/schedule.json`),
    { sport: "nfl", endpoint: "season_schedule" }
  );
}

/**
 * Get the schedule for a specific week.
 * Includes scores for completed games and weather data.
 * @param year e.g. 2024
 * @param type "REG" | "PST"
 * @param week Week number (1-18) or playoff round
 */
export async function getNflWeeklySchedule(
  year: number,
  type: string,
  week: number | string
): Promise<SRWeeklySchedule> {
  return sportsradarFetch<SRWeeklySchedule>(
    nflUrl(`/games/${year}/${type}/${week}/schedule.json`),
    { sport: "nfl", endpoint: "weekly_schedule" }
  );
}

/**
 * Get current standings for a season.
 * @param year e.g. 2024
 * @param type "REG" | "PST"
 */
export async function getNflStandings(
  year: number,
  type: string = "REG"
): Promise<SRStandings> {
  return sportsradarFetch<SRStandings>(
    nflUrl(`/seasons/${year}/${type}/standings.json`),
    { sport: "nfl", endpoint: "standings" }
  );
}
