/**
 * Sportsradar College Football API v7 response types.
 * Based on https://developer.sportradar.com/docs/read/sports_api_v3/NCAAFB/
 */

// ─── Common ─────────────────────────────────────────────

export interface SRCfbVenue {
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

export interface SRCfbBroadcast {
  network?: string;
  satellite?: string;
  internet?: string;
}

export interface SRCfbWeather {
  condition?: string;
  humidity?: number;
  temp?: number;
  wind?: {
    speed?: number;
    direction?: string;
  };
}

// ─── Teams ──────────────────────────────────────────────

export interface SRCfbTeam {
  id: string;
  name: string;       // e.g. "Kansas"
  alias: string;      // e.g. "KAN"
  market: string;     // e.g. "Kansas"
  sr_id?: string;
}

export interface SRCfbTeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

// ─── Scoring ────────────────────────────────────────────

export interface SRCfbScoringPeriod {
  id: string;
  number: number;
  sequence: number;
  type: string;
  home_points: number;
  away_points: number;
}

export interface SRCfbScoring {
  home_points: number;
  away_points: number;
  periods?: SRCfbScoringPeriod[];
}

// ─── Games ──────────────────────────────────────────────

export interface SRCfbGame {
  id: string;
  status: "scheduled" | "inprogress" | "halftime" | "closed" | "complete" | "created" | "flex-schedule";
  scheduled: string;    // ISO date-time
  entry_mode?: string;
  sr_id?: string;
  title?: string;
  home: SRCfbTeam & { points?: number };
  away: SRCfbTeam & { points?: number };
  scoring?: SRCfbScoring;
  venue?: SRCfbVenue;
  broadcast?: SRCfbBroadcast;
  weather?: SRCfbWeather;
}

// ─── Schedule ───────────────────────────────────────────

export interface SRCfbWeek {
  id: string;
  sequence: number;
  title: string;      // "1", "2", ..., "15", playoff rounds, etc.
  games: SRCfbGame[];
}

export interface SRCfbSeasonSchedule {
  id: string;
  year: number;
  type: string;        // "REG", "PST"
  name?: string;
  weeks: SRCfbWeek[];
}

export interface SRCfbWeeklySchedule {
  id: string;
  year: number;
  type: string;
  week: SRCfbWeek;
}

// ─── Hierarchy ──────────────────────────────────────────

export interface SRCfbConference {
  id: string;
  name: string;        // "Big Ten", "SEC", etc.
  alias: string;
  teams: SRCfbTeam[];
}

export interface SRCfbHierarchy {
  id: string;
  name: string;
  alias: string;
  conferences: SRCfbConference[];
}

// ─── Standings ──────────────────────────────────────────

export interface SRCfbStandingsTeam extends SRCfbTeam {
  wins: number;
  losses: number;
  ties: number;
  win_pct: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  streak?: { type: string; length: number };
  conference?: SRCfbTeamRecord;
}

export interface SRCfbStandingsConference {
  id: string;
  name: string;
  teams: SRCfbStandingsTeam[];
}

export interface SRCfbStandings {
  id: string;
  year: number;
  type: string;
  conferences: SRCfbStandingsConference[];
}
