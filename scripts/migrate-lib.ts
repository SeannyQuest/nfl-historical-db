/**
 * Migration library — pure parsing/mapping logic for data.js → DB models.
 * No database dependency; fully testable without Prisma.
 */

import { ALL_TEAMS } from "../prisma/team-data";

// ─── Raw data.js game shape ──────────────────────────────

export interface RawGame {
  s: number;    // season year
  w: string;    // week: "1"-"18", "WildCard", "Division", "ConfChamp", "SuperBowl", "Champ"
  d: string;    // day: "Sun", "Mon", "Thu", etc.
  dt: string;   // date: "YYYY-MM-DD"
  tm: string;   // time: "8:20PM" or ""
  h: string;    // home team name
  a: string;    // away team name
  hs: number;   // home score
  as: number;   // away score
  pt: string;   // primetime: "MNF", "SNF", "TNF", or ""
  sp?: number;  // spread (home perspective)
  ou?: number;  // over/under line
  sr?: string;  // spread result: "Covered", "Lost", "Push"
  our?: string; // O/U result: "Over", "Under", "Push"
  tp?: number;  // temperature
  wi?: string;  // wind
  cd?: string;  // conditions
}

// ─── Parsed output shapes ────────────────────────────────

export interface ParsedGame {
  season: number;
  week: string;
  date: Date;
  time: string | null;
  dayOfWeek: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  scoreDiff: number;
  winnerTeamName: string | null;
  primetime: string | null;
  isPlayoff: boolean;
  betting: ParsedBetting | null;
  weather: ParsedWeather | null;
}

export interface ParsedBetting {
  spread: number | null;
  overUnder: number | null;
  spreadResult: "COVERED" | "LOST" | "PUSH" | null;
  ouResult: "OVER" | "UNDER" | "PUSH" | null;
}

export interface ParsedWeather {
  temperature: number | null;
  wind: string | null;
  conditions: string | null;
}

// ─── Constants ───────────────────────────────────────────

const PLAYOFF_WEEKS = new Set([
  "WildCard", "Wild Card", "Division", "Divisional",
  "ConfChamp", "Conference", "SuperBowl", "Super Bowl", "Champ",
]);

// ─── Team name resolution ────────────────────────────────

const TEAM_NAME_SET = new Set(ALL_TEAMS.map((t) => t.name));

export function isKnownTeam(name: string): boolean {
  return TEAM_NAME_SET.has(name);
}

export function getUnknownTeams(games: RawGame[]): string[] {
  const unknown = new Set<string>();
  for (const g of games) {
    if (!isKnownTeam(g.h)) unknown.add(g.h);
    if (!isKnownTeam(g.a)) unknown.add(g.a);
  }
  return [...unknown].sort();
}

// ─── Spread result mapping ───────────────────────────────

function mapSpreadResult(sr: string | undefined): "COVERED" | "LOST" | "PUSH" | null {
  if (!sr) return null;
  switch (sr) {
    case "Covered": return "COVERED";
    case "Lost": return "LOST";
    case "Push": return "PUSH";
    default: return null;
  }
}

function mapOUResult(our: string | undefined): "OVER" | "UNDER" | "PUSH" | null {
  if (!our) return null;
  switch (our) {
    case "Over": return "OVER";
    case "Under": return "UNDER";
    case "Push": return "PUSH";
    default: return null;
  }
}

// ─── Parse a single game ─────────────────────────────────

export function parseGame(raw: RawGame): ParsedGame {
  const scoreDiff = raw.hs - raw.as;
  const isTie = raw.hs === raw.as;

  let winnerTeamName: string | null = null;
  if (!isTie) {
    winnerTeamName = raw.hs > raw.as ? raw.h : raw.a;
  }

  const hasBetting = raw.sp != null || raw.ou != null || raw.sr || raw.our;
  const hasWeather = raw.tp != null || raw.wi || raw.cd;

  return {
    season: raw.s,
    week: raw.w,
    date: new Date(raw.dt + "T12:00:00Z"), // noon UTC to avoid timezone shift
    time: raw.tm || null,
    dayOfWeek: raw.d,
    homeTeamName: raw.h,
    awayTeamName: raw.a,
    homeScore: raw.hs,
    awayScore: raw.as,
    scoreDiff,
    winnerTeamName,
    primetime: raw.pt || null,
    isPlayoff: PLAYOFF_WEEKS.has(raw.w),
    betting: hasBetting
      ? {
          spread: raw.sp ?? null,
          overUnder: raw.ou ?? null,
          spreadResult: mapSpreadResult(raw.sr),
          ouResult: mapOUResult(raw.our),
        }
      : null,
    weather: hasWeather
      ? {
          temperature: raw.tp ?? null,
          wind: raw.wi || null,
          conditions: raw.cd || null,
        }
      : null,
  };
}

// ─── Parse all games ─────────────────────────────────────

export function parseAllGames(rawGames: RawGame[]): ParsedGame[] {
  return rawGames.map(parseGame);
}

// ─── Deduplication ───────────────────────────────────────

export function deduplicateGames(games: ParsedGame[]): ParsedGame[] {
  const seen = new Set<string>();
  const unique: ParsedGame[] = [];
  for (const g of games) {
    const key = `${g.date.toISOString().split("T")[0]}|${g.homeTeamName}|${g.awayTeamName}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(g);
    }
  }
  return unique;
}

// ─── Extract unique seasons ──────────────────────────────

export function extractSeasons(games: ParsedGame[]): number[] {
  return [...new Set(games.map((g) => g.season))].sort((a, b) => a - b);
}

// ─── Migration report ────────────────────────────────────

export interface MigrationReport {
  totalGames: number;
  uniqueGames: number;
  duplicatesRemoved: number;
  seasonRange: [number, number];
  seasonCount: number;
  tieCount: number;
  bettingCount: number;
  bettingPct: string;
  weatherCount: number;
  weatherPct: string;
  playoffCount: number;
  unknownTeams: string[];
  gamesPerSeason: Record<number, number>;
}

export function generateReport(rawGames: RawGame[]): MigrationReport {
  const parsed = parseAllGames(rawGames);
  const unique = deduplicateGames(parsed);
  const seasons = extractSeasons(unique);

  const gamesPerSeason: Record<number, number> = {};
  for (const g of unique) {
    gamesPerSeason[g.season] = (gamesPerSeason[g.season] || 0) + 1;
  }

  return {
    totalGames: rawGames.length,
    uniqueGames: unique.length,
    duplicatesRemoved: rawGames.length - unique.length,
    seasonRange: [seasons[0], seasons[seasons.length - 1]],
    seasonCount: seasons.length,
    tieCount: unique.filter((g) => g.winnerTeamName === null).length,
    bettingCount: unique.filter((g) => g.betting !== null).length,
    bettingPct: ((unique.filter((g) => g.betting !== null).length / unique.length) * 100).toFixed(1),
    weatherCount: unique.filter((g) => g.weather !== null).length,
    weatherPct: ((unique.filter((g) => g.weather !== null).length / unique.length) * 100).toFixed(1),
    playoffCount: unique.filter((g) => g.isPlayoff).length,
    unknownTeams: getUnknownTeams(rawGames),
    gamesPerSeason,
  };
}
