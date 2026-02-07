import { describe, it, expect } from "vitest";
import {
  SubscriptionTierSchema,
  SeasonTypeSchema,
  SpreadResultSchema,
  OUResultSchema,
  ConferenceSchema,
  DivisionSchema,
  TeamSchema,
  SeasonSchema,
  GameSchema,
  BettingLineSchema,
  WeatherSchema,
  TeamCreateSchema,
  GameCreateSchema,
  PaginationSchema,
  SortOrderSchema,
  GameSortFieldSchema,
  GameFiltersSchema,
  GameQuerySchema,
  TeamFiltersSchema,
  SeasonFiltersSchema,
} from "@/lib/schemas";

// ─── Enum schemas ───────────────────────────────────────

describe("enum schemas", () => {
  it("validates SubscriptionTier", () => {
    expect(SubscriptionTierSchema.parse("FREE")).toBe("FREE");
    expect(SubscriptionTierSchema.parse("PRO")).toBe("PRO");
    expect(SubscriptionTierSchema.parse("ADMIN")).toBe("ADMIN");
    expect(() => SubscriptionTierSchema.parse("INVALID")).toThrow();
  });

  it("validates SeasonType", () => {
    expect(SeasonTypeSchema.parse("REGULAR")).toBe("REGULAR");
    expect(SeasonTypeSchema.parse("POSTSEASON")).toBe("POSTSEASON");
    expect(() => SeasonTypeSchema.parse("PRESEASON")).toThrow();
  });

  it("validates SpreadResult", () => {
    expect(SpreadResultSchema.parse("COVERED")).toBe("COVERED");
    expect(SpreadResultSchema.parse("LOST")).toBe("LOST");
    expect(SpreadResultSchema.parse("PUSH")).toBe("PUSH");
    expect(() => SpreadResultSchema.parse("WIN")).toThrow();
  });

  it("validates OUResult", () => {
    expect(OUResultSchema.parse("OVER")).toBe("OVER");
    expect(OUResultSchema.parse("UNDER")).toBe("UNDER");
    expect(OUResultSchema.parse("PUSH")).toBe("PUSH");
    expect(() => OUResultSchema.parse("EVEN")).toThrow();
  });

  it("validates Conference", () => {
    expect(ConferenceSchema.parse("AFC")).toBe("AFC");
    expect(ConferenceSchema.parse("NFC")).toBe("NFC");
    expect(() => ConferenceSchema.parse("XFL")).toThrow();
  });

  it("validates Division", () => {
    expect(DivisionSchema.parse("EAST")).toBe("EAST");
    expect(DivisionSchema.parse("WEST")).toBe("WEST");
    expect(DivisionSchema.parse("NORTH")).toBe("NORTH");
    expect(DivisionSchema.parse("SOUTH")).toBe("SOUTH");
    expect(() => DivisionSchema.parse("CENTRAL")).toThrow();
  });
});

// ─── Model schemas ──────────────────────────────────────

const validTeam = {
  id: "clz1234567890abcdef12345",
  name: "Kansas City Chiefs",
  abbreviation: "KC",
  city: "Kansas City",
  nickname: "Chiefs",
  conference: "AFC" as const,
  division: "WEST" as const,
  franchiseKey: "Chiefs",
  isActive: true,
};

const validGame = {
  id: "clz1234567890abcdef12345",
  seasonId: "clz1234567890abcdef12345",
  week: "1",
  date: new Date("2024-09-08T12:00:00Z"),
  time: "1:00PM",
  dayOfWeek: "Sun",
  homeTeamId: "clz1234567890abcdef12345",
  awayTeamId: "clzabcdefghij1234567890",
  homeScore: 27,
  awayScore: 20,
  scoreDiff: 7,
  winnerId: "clz1234567890abcdef12345",
  primetime: "SNF",
  isPlayoff: false,
};

describe("TeamSchema", () => {
  it("accepts valid team", () => {
    expect(TeamSchema.parse(validTeam)).toEqual(validTeam);
  });

  it("rejects empty name", () => {
    expect(() => TeamSchema.parse({ ...validTeam, name: "" })).toThrow();
  });

  it("rejects abbreviation longer than 4 chars", () => {
    expect(() => TeamSchema.parse({ ...validTeam, abbreviation: "ABCDE" })).toThrow();
  });

  it("rejects invalid conference", () => {
    expect(() => TeamSchema.parse({ ...validTeam, conference: "XFL" })).toThrow();
  });

  it("rejects missing id", () => {
    const { id: _, ...noId } = validTeam;
    expect(() => TeamSchema.parse(noId)).toThrow();
  });
});

describe("TeamCreateSchema", () => {
  it("accepts team without id", () => {
    const { id: _, ...create } = validTeam;
    expect(TeamCreateSchema.parse(create)).toEqual(create);
  });
});

describe("SeasonSchema", () => {
  it("accepts valid season", () => {
    const season = { id: "clz1234567890abcdef12345", year: 2024, type: "REGULAR" as const };
    expect(SeasonSchema.parse(season)).toEqual(season);
  });

  it("rejects year below 1920", () => {
    expect(() =>
      SeasonSchema.parse({ id: "clz1234567890abcdef12345", year: 1919, type: "REGULAR" })
    ).toThrow();
  });

  it("rejects year above 2100", () => {
    expect(() =>
      SeasonSchema.parse({ id: "clz1234567890abcdef12345", year: 2101, type: "REGULAR" })
    ).toThrow();
  });
});

describe("GameSchema", () => {
  it("accepts valid game", () => {
    const result = GameSchema.parse(validGame);
    expect(result.homeScore).toBe(27);
    expect(result.winnerId).toBe(validGame.winnerId);
  });

  it("accepts null winnerId (tie)", () => {
    const tie = { ...validGame, winnerId: null, scoreDiff: 0 };
    expect(GameSchema.parse(tie).winnerId).toBeNull();
  });

  it("accepts null time and primetime", () => {
    const g = { ...validGame, time: null, primetime: null };
    const result = GameSchema.parse(g);
    expect(result.time).toBeNull();
    expect(result.primetime).toBeNull();
  });

  it("rejects negative scores", () => {
    expect(() => GameSchema.parse({ ...validGame, homeScore: -1 })).toThrow();
  });

  it("coerces date string to Date", () => {
    const g = { ...validGame, date: "2024-09-08T12:00:00Z" };
    const result = GameSchema.parse(g);
    expect(result.date).toBeInstanceOf(Date);
  });
});

describe("GameCreateSchema", () => {
  it("accepts game without id", () => {
    const { id: _, ...create } = validGame;
    expect(GameCreateSchema.parse(create)).toBeDefined();
  });
});

describe("BettingLineSchema", () => {
  it("accepts valid betting line", () => {
    const bl = {
      id: "clz1234567890abcdef12345",
      gameId: "clz1234567890abcdef12345",
      spread: -3.5,
      overUnder: 47.5,
      moneylineHome: -150,
      moneylineAway: 130,
      spreadResult: "COVERED" as const,
      ouResult: "UNDER" as const,
      source: "pfr",
    };
    expect(BettingLineSchema.parse(bl)).toEqual(bl);
  });

  it("accepts all nullable fields as null", () => {
    const bl = {
      id: "clz1234567890abcdef12345",
      gameId: "clz1234567890abcdef12345",
      spread: null,
      overUnder: null,
      moneylineHome: null,
      moneylineAway: null,
      spreadResult: null,
      ouResult: null,
      source: "pfr",
    };
    expect(BettingLineSchema.parse(bl)).toEqual(bl);
  });

  it("defaults source to pfr", () => {
    const bl = {
      id: "clz1234567890abcdef12345",
      gameId: "clz1234567890abcdef12345",
      spread: null,
      overUnder: null,
      moneylineHome: null,
      moneylineAway: null,
      spreadResult: null,
      ouResult: null,
    };
    expect(BettingLineSchema.parse(bl).source).toBe("pfr");
  });
});

describe("WeatherSchema", () => {
  it("accepts valid weather", () => {
    const w = {
      id: "clz1234567890abcdef12345",
      gameId: "clz1234567890abcdef12345",
      temperature: 72,
      wind: "8 mph",
      conditions: "Clear",
    };
    expect(WeatherSchema.parse(w)).toEqual(w);
  });

  it("accepts all nullable fields as null", () => {
    const w = {
      id: "clz1234567890abcdef12345",
      gameId: "clz1234567890abcdef12345",
      temperature: null,
      wind: null,
      conditions: null,
    };
    expect(WeatherSchema.parse(w)).toEqual(w);
  });
});

// ─── Query parameter schemas ────────────────────────────

describe("PaginationSchema", () => {
  it("provides defaults for missing values", () => {
    const result = PaginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it("coerces string values to numbers", () => {
    const result = PaginationSchema.parse({ page: "3", limit: "50" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("rejects page below 1", () => {
    expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects limit above 100", () => {
    expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects limit below 1", () => {
    expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
  });
});

describe("SortOrderSchema", () => {
  it("defaults to desc", () => {
    expect(SortOrderSchema.parse(undefined)).toBe("desc");
  });

  it("accepts asc", () => {
    expect(SortOrderSchema.parse("asc")).toBe("asc");
  });

  it("rejects invalid values", () => {
    expect(() => SortOrderSchema.parse("random")).toThrow();
  });
});

describe("GameSortFieldSchema", () => {
  it("defaults to date", () => {
    expect(GameSortFieldSchema.parse(undefined)).toBe("date");
  });

  it("accepts all valid sort fields", () => {
    expect(GameSortFieldSchema.parse("date")).toBe("date");
    expect(GameSortFieldSchema.parse("homeScore")).toBe("homeScore");
    expect(GameSortFieldSchema.parse("awayScore")).toBe("awayScore");
    expect(GameSortFieldSchema.parse("scoreDiff")).toBe("scoreDiff");
    expect(GameSortFieldSchema.parse("week")).toBe("week");
  });

  it("rejects invalid sort field", () => {
    expect(() => GameSortFieldSchema.parse("name")).toThrow();
  });
});

describe("GameFiltersSchema", () => {
  it("accepts empty filters", () => {
    expect(GameFiltersSchema.parse({})).toEqual({});
  });

  it("coerces season from string", () => {
    const result = GameFiltersSchema.parse({ season: "2024" });
    expect(result.season).toBe(2024);
  });

  it("coerces isPlayoff from string", () => {
    const result = GameFiltersSchema.parse({ isPlayoff: "true" });
    expect(result.isPlayoff).toBe(true);
  });

  it("coerces dates from strings", () => {
    const result = GameFiltersSchema.parse({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it("accepts team filter", () => {
    const result = GameFiltersSchema.parse({ team: "Kansas City Chiefs" });
    expect(result.team).toBe("Kansas City Chiefs");
  });

  it("accepts score range filters", () => {
    const result = GameFiltersSchema.parse({ minScore: "20", maxScore: "50" });
    expect(result.minScore).toBe(20);
    expect(result.maxScore).toBe(50);
  });

  it("accepts hasBetting and hasWeather", () => {
    const result = GameFiltersSchema.parse({ hasBetting: "true", hasWeather: "false" });
    expect(result.hasBetting).toBe(true);
    expect(result.hasWeather).toBe(false);
  });
});

describe("GameQuerySchema", () => {
  it("merges filters with pagination and sort", () => {
    const result = GameQuerySchema.parse({
      season: "2024",
      page: "2",
      limit: "10",
      sort: "scoreDiff",
      order: "asc",
    });
    expect(result.season).toBe(2024);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.sort).toBe("scoreDiff");
    expect(result.order).toBe("asc");
  });

  it("provides pagination defaults with filters", () => {
    const result = GameQuerySchema.parse({ team: "Chiefs" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.team).toBe("Chiefs");
  });
});

describe("TeamFiltersSchema", () => {
  it("accepts empty filters", () => {
    expect(TeamFiltersSchema.parse({})).toEqual({});
  });

  it("validates conference filter", () => {
    expect(TeamFiltersSchema.parse({ conference: "AFC" }).conference).toBe("AFC");
    expect(() => TeamFiltersSchema.parse({ conference: "XFL" })).toThrow();
  });

  it("validates division filter", () => {
    expect(TeamFiltersSchema.parse({ division: "WEST" }).division).toBe("WEST");
  });

  it("coerces isActive from string", () => {
    expect(TeamFiltersSchema.parse({ isActive: "true" }).isActive).toBe(true);
  });
});

describe("SeasonFiltersSchema", () => {
  it("accepts empty filters", () => {
    expect(SeasonFiltersSchema.parse({})).toEqual({});
  });

  it("coerces year range from strings", () => {
    const result = SeasonFiltersSchema.parse({ startYear: "2000", endYear: "2024" });
    expect(result.startYear).toBe(2000);
    expect(result.endYear).toBe(2024);
  });

  it("rejects years outside valid range", () => {
    expect(() => SeasonFiltersSchema.parse({ startYear: 1919 })).toThrow();
    expect(() => SeasonFiltersSchema.parse({ endYear: 2101 })).toThrow();
  });
});
