/**
 * Pure query-building functions for Prisma.
 * These build `where`, `orderBy`, and pagination objects from validated filter types.
 * Testable without a database connection.
 */

import type { GameFilters, TeamFilters, SeasonFilters } from "./schemas";

// ─── Game query builder ─────────────────────────────────

export interface GameWhereInput {
  seasonId?: string;
  season?: { year: number };
  week?: string;
  isPlayoff?: boolean;
  primetime?: string | { not: null };
  date?: { gte?: Date; lte?: Date };
  homeScore?: { gte?: number; lte?: number };
  awayScore?: { gte?: number; lte?: number };
  winnerId?: string;
  bettingLine?: { isNot: null } | { is: null };
  weather?: { isNot: null } | { is: null };
  OR?: Array<Record<string, unknown>>;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
  winner?: { name: string };
}

export function buildGameWhere(filters: GameFilters): GameWhereInput {
  const where: GameWhereInput = {};

  if (filters.season != null) {
    where.season = { year: filters.season };
  }

  if (filters.week) {
    where.week = filters.week;
  }

  if (filters.isPlayoff != null) {
    where.isPlayoff = filters.isPlayoff;
  }

  if (filters.primetime) {
    where.primetime = filters.primetime;
  }

  // Date range
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  // Team filter — matches either home or away
  if (filters.team) {
    where.OR = [
      { homeTeam: { name: filters.team } },
      { awayTeam: { name: filters.team } },
    ];
  }

  if (filters.homeTeam) {
    where.homeTeam = { name: filters.homeTeam };
  }

  if (filters.awayTeam) {
    where.awayTeam = { name: filters.awayTeam };
  }

  if (filters.winner) {
    where.winner = { name: filters.winner };
  }

  // Score filters apply to total (home + away)
  if (filters.minScore != null || filters.maxScore != null) {
    // We filter on homeScore + awayScore in the API route via raw query or post-filter
    // For Prisma's where clause, we approximate by filtering individual scores
    // The exact total-score filter is handled in the route handler
  }

  if (filters.hasBetting === true) {
    where.bettingLine = { isNot: null };
  } else if (filters.hasBetting === false) {
    where.bettingLine = { is: null };
  }

  if (filters.hasWeather === true) {
    where.weather = { isNot: null };
  } else if (filters.hasWeather === false) {
    where.weather = { is: null };
  }

  return where;
}

export type GameOrderBy = Record<string, "asc" | "desc">;

export function buildGameOrderBy(
  sort: string = "date",
  order: "asc" | "desc" = "desc"
): GameOrderBy {
  return { [sort]: order };
}

export function buildPagination(page: number = 1, limit: number = 25) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

// ─── Team query builder ─────────────────────────────────

export interface TeamWhereInput {
  conference?: "AFC" | "NFC";
  division?: "EAST" | "WEST" | "NORTH" | "SOUTH";
  isActive?: boolean;
  franchiseKey?: string;
}

export function buildTeamWhere(filters: TeamFilters): TeamWhereInput {
  const where: TeamWhereInput = {};

  if (filters.conference) where.conference = filters.conference;
  if (filters.division) where.division = filters.division;
  if (filters.isActive != null) where.isActive = filters.isActive;
  if (filters.franchiseKey) where.franchiseKey = filters.franchiseKey;

  return where;
}

// ─── Season query builder ───────────────────────────────

export interface SeasonWhereInput {
  year?: { gte?: number; lte?: number };
}

export function buildSeasonWhere(filters: SeasonFilters): SeasonWhereInput {
  const where: SeasonWhereInput = {};

  if (filters.startYear != null || filters.endYear != null) {
    where.year = {};
    if (filters.startYear != null) where.year.gte = filters.startYear;
    if (filters.endYear != null) where.year.lte = filters.endYear;
  }

  return where;
}
