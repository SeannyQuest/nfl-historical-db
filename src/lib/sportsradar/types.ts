/**
 * Sportsradar NFL API v7 response types.
 * Based on https://developer.sportradar.com/football/reference/nfl-overview
 */

// ─── Common ─────────────────────────────────────────────

export interface SRVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  address?: string;
  capacity?: number;
  surface?: string;
  roof_type?: string;
}

export interface SRBroadcast {
  network?: string;
  satellite?: string;
  internet?: string;
}

export interface SRWeather {
  condition?: string;
  humidity?: number;
  temp?: number;
  wind?: {
    speed?: number;
    direction?: string;
  };
}

// ─── Teams ──────────────────────────────────────────────

export interface SRTeam {
  id: string;
  name: string;       // e.g. "Chiefs"
  alias: string;      // e.g. "KC"
  market: string;     // e.g. "Kansas City"
  sr_id?: string;
}

export interface SRTeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

// ─── Scoring ────────────────────────────────────────────

export interface SRScoringPeriod {
  id: string;
  number: number;
  sequence: number;
  type: string;
  home_points: number;
  away_points: number;
}

export interface SRScoring {
  home_points: number;
  away_points: number;
  periods?: SRScoringPeriod[];
}

// ─── Games ──────────────────────────────────────────────

export interface SRGame {
  id: string;
  status: "scheduled" | "inprogress" | "halftime" | "closed" | "complete" | "created" | "flex-schedule";
  scheduled: string;    // ISO date-time
  entry_mode?: string;
  sr_id?: string;
  title?: string;       // e.g. "Super Bowl LVIII"
  home: SRTeam & { points?: number };
  away: SRTeam & { points?: number };
  scoring?: SRScoring;
  venue?: SRVenue;
  broadcast?: SRBroadcast;
  weather?: SRWeather;
}

// ─── Schedule ───────────────────────────────────────────

export interface SRWeek {
  id: string;
  sequence: number;
  title: string;      // "1", "2", ..., "18", "Wild Card", "Divisional", etc.
  games: SRGame[];
}

export interface SRSeasonSchedule {
  id: string;
  year: number;
  type: string;        // "REG", "PST", "PRE"
  name?: string;
  weeks: SRWeek[];
}

export interface SRWeeklySchedule {
  id: string;
  year: number;
  type: string;
  week: SRWeek;
}

// ─── Hierarchy ──────────────────────────────────────────

export interface SRDivision {
  id: string;
  name: string;        // "East", "West", etc.
  alias: string;
  teams: SRTeam[];
}

export interface SRConference {
  id: string;
  name: string;        // "AFC", "NFC"
  alias: string;
  divisions: SRDivision[];
}

export interface SRHierarchy {
  id: string;
  name: string;
  alias: string;
  conferences: SRConference[];
}

// ─── Standings ──────────────────────────────────────────

export interface SRStandingsTeam extends SRTeam {
  wins: number;
  losses: number;
  ties: number;
  win_pct: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  streak?: { type: string; length: number };
  division?: SRTeamRecord;
  conference?: SRTeamRecord;
}

export interface SRStandingsDivision {
  id: string;
  name: string;
  teams: SRStandingsTeam[];
}

export interface SRStandingsConference {
  id: string;
  name: string;
  divisions: SRStandingsDivision[];
}

export interface SRStandings {
  id: string;
  year: number;
  type: string;
  conferences: SRStandingsConference[];
}
