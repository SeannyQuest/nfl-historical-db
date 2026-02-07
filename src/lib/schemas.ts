/**
 * Zod schemas mirroring Prisma models for runtime validation.
 * Used by API routes, query parameters, and the migration pipeline.
 */

import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────

/** Coerce string query params to boolean ("true" → true, everything else → false) */
const queryBoolean = z
  .union([z.boolean(), z.string()])
  .transform((val) => (typeof val === "string" ? val === "true" : val));

// ─── Enum schemas ───────────────────────────────────────

export const SubscriptionTierSchema = z.enum(["FREE", "PRO", "ADMIN"]);
export const SeasonTypeSchema = z.enum(["REGULAR", "POSTSEASON"]);
export const SpreadResultSchema = z.enum(["COVERED", "LOST", "PUSH"]);
export const OUResultSchema = z.enum(["OVER", "UNDER", "PUSH"]);
export const ConferenceSchema = z.enum(["AFC", "NFC"]);
export const DivisionSchema = z.enum(["EAST", "WEST", "NORTH", "SOUTH"]);

// ─── Model schemas ──────────────────────────────────────

export const TeamSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(4),
  city: z.string().min(1),
  nickname: z.string().min(1),
  conference: ConferenceSchema,
  division: DivisionSchema,
  franchiseKey: z.string().min(1),
  isActive: z.boolean(),
});

export const SeasonSchema = z.object({
  id: z.string().cuid(),
  year: z.number().int().min(1920).max(2100),
  type: SeasonTypeSchema,
});

export const GameSchema = z.object({
  id: z.string().cuid(),
  seasonId: z.string().cuid(),
  week: z.string().min(1),
  date: z.coerce.date(),
  time: z.string().nullable(),
  dayOfWeek: z.string().min(1),
  homeTeamId: z.string().cuid(),
  awayTeamId: z.string().cuid(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  scoreDiff: z.number().int(),
  winnerId: z.string().cuid().nullable(),
  primetime: z.string().nullable(),
  isPlayoff: z.boolean(),
});

export const BettingLineSchema = z.object({
  id: z.string().cuid(),
  gameId: z.string().cuid(),
  spread: z.number().nullable(),
  overUnder: z.number().nullable(),
  moneylineHome: z.number().int().nullable(),
  moneylineAway: z.number().int().nullable(),
  spreadResult: SpreadResultSchema.nullable(),
  ouResult: OUResultSchema.nullable(),
  source: z.string().default("pfr"),
});

export const WeatherSchema = z.object({
  id: z.string().cuid(),
  gameId: z.string().cuid(),
  temperature: z.number().int().nullable(),
  wind: z.string().nullable(),
  conditions: z.string().nullable(),
});

// ─── Create schemas (no id required) ────────────────────

export const TeamCreateSchema = TeamSchema.omit({ id: true });
export const SeasonCreateSchema = SeasonSchema.omit({ id: true });
export const GameCreateSchema = GameSchema.omit({ id: true });
export const BettingLineCreateSchema = BettingLineSchema.omit({ id: true });
export const WeatherCreateSchema = WeatherSchema.omit({ id: true });

// ─── Query parameter schemas ────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const SortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const GameSortFieldSchema = z.enum([
  "date",
  "homeScore",
  "awayScore",
  "scoreDiff",
  "week",
]).default("date");

export const GameFiltersSchema = z.object({
  season: z.coerce.number().int().min(1920).max(2100).optional(),
  week: z.string().optional(),
  team: z.string().optional(), // team name or ID — matches home or away
  homeTeam: z.string().optional(),
  awayTeam: z.string().optional(),
  isPlayoff: queryBoolean.optional(),
  primetime: z.string().optional(),
  minScore: z.coerce.number().int().min(0).optional(),
  maxScore: z.coerce.number().int().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  winner: z.string().optional(), // team name or ID
  hasBetting: queryBoolean.optional(),
  hasWeather: queryBoolean.optional(),
});

export const GameQuerySchema = GameFiltersSchema.merge(PaginationSchema).extend({
  sort: GameSortFieldSchema.optional(),
  order: SortOrderSchema.optional(),
});

export const TeamFiltersSchema = z.object({
  conference: ConferenceSchema.optional(),
  division: DivisionSchema.optional(),
  isActive: queryBoolean.optional(),
  franchiseKey: z.string().optional(),
});

export const SeasonFiltersSchema = z.object({
  startYear: z.coerce.number().int().min(1920).max(2100).optional(),
  endYear: z.coerce.number().int().min(1920).max(2100).optional(),
});

// ─── Type exports ───────────────────────────────────────

export type Team = z.infer<typeof TeamSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Game = z.infer<typeof GameSchema>;
export type BettingLine = z.infer<typeof BettingLineSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type TeamCreate = z.infer<typeof TeamCreateSchema>;
export type SeasonCreate = z.infer<typeof SeasonCreateSchema>;
export type GameCreate = z.infer<typeof GameCreateSchema>;
export type BettingLineCreate = z.infer<typeof BettingLineCreateSchema>;
export type WeatherCreate = z.infer<typeof WeatherCreateSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type GameFilters = z.infer<typeof GameFiltersSchema>;
export type GameQuery = z.infer<typeof GameQuerySchema>;
export type TeamFilters = z.infer<typeof TeamFiltersSchema>;
export type SeasonFilters = z.infer<typeof SeasonFiltersSchema>;
