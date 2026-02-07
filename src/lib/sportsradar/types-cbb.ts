/**
 * Sportsradar College Basketball API v8 response types.
 * Based on https://developer.sportradar.com/docs/read/sports_api_v3/NCAAMB/
 */

// ─── Common ─────────────────────────────────────────────

export interface SRCbbVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  address?: string;
  capacity?: number;
}

export interface SRCbbBroadcast {
  network?: string;
  satellite?: string;
  internet?: string;
}

// ─── Teams ──────────────────────────────────────────────

export interface SRCbbTeam {
  id: string;
  name: string;       // e.g. "Duke"
  alias: string;      // e.g. "DUK"
  market: string;     // e.g. "Duke"
  sr_id?: string;
}

export interface SRCbbTeamRecord {
  wins: number;
  losses: number;
}

// ─── Scoring ────────────────────────────────────────────

export interface SRCbbScoringPeriod {
  id: string;
  number: number;
  sequence: number;
  type: string;
  home_points: number;
  away_points: number;
}

export interface SRCbbScoring {
  home_points: number;
  away_points: number;
  periods?: SRCbbScoringPeriod[];
}

// ─── Games ──────────────────────────────────────────────

export interface SRCbbGame {
  id: string;
  status: "scheduled" | "inprogress" | "closed" | "complete" | "created";
  scheduled: string;    // ISO date-time
  entry_mode?: string;
  sr_id?: string;
  title?: string;
  home: SRCbbTeam & { points?: number };
  away: SRCbbTeam & { points?: number };
  scoring?: SRCbbScoring;
  venue?: SRCbbVenue;
  broadcast?: SRCbbBroadcast;
}

// ─── Schedule ───────────────────────────────────────────

export interface SRCbbDay {
  id: string;
  date: string;        // ISO date, e.g. "2024-01-15"
  games: SRCbbGame[];
}

export interface SRCbbDailySchedule {
  id: string;
  date: string;        // ISO date
  games: SRCbbGame[];
}

export interface SRCbbSeasonSchedule {
  id: string;
  year: number;
  games: SRCbbGame[];
}

// ─── Hierarchy ──────────────────────────────────────────

export interface SRCbbConference {
  id: string;
  name: string;        // "ACC", "Big Ten", etc.
  alias: string;
  teams: SRCbbTeam[];
}

export interface SRCbbHierarchy {
  id: string;
  name: string;
  alias: string;
  conferences: SRCbbConference[];
}

// ─── Standings ──────────────────────────────────────────

export interface SRCbbStandingsTeam extends SRCbbTeam {
  wins: number;
  losses: number;
  win_pct: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  streak?: { type: string; length: number };
}

export interface SRCbbStandingsConference {
  id: string;
  name: string;
  teams: SRCbbStandingsTeam[];
}

export interface SRCbbStandings {
  id: string;
  year: number;
  conferences: SRCbbStandingsConference[];
}
