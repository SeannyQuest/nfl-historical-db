import { describe, it, expect } from "vitest";
import {
  buildGameWhere,
  buildGameOrderBy,
  buildPagination,
  buildTeamWhere,
  buildSeasonWhere,
} from "@/lib/queries";

// ─── buildGameWhere ─────────────────────────────────────

describe("buildGameWhere", () => {
  it("returns empty object for no filters", () => {
    expect(buildGameWhere({})).toEqual({});
  });

  it("filters by season year", () => {
    const where = buildGameWhere({ season: 2024 });
    expect(where.season).toEqual({ year: 2024 });
  });

  it("filters by week", () => {
    const where = buildGameWhere({ week: "SuperBowl" });
    expect(where.week).toBe("SuperBowl");
  });

  it("filters by isPlayoff", () => {
    expect(buildGameWhere({ isPlayoff: true }).isPlayoff).toBe(true);
    expect(buildGameWhere({ isPlayoff: false }).isPlayoff).toBe(false);
  });

  it("filters by primetime", () => {
    const where = buildGameWhere({ primetime: "SNF" });
    expect(where.primetime).toBe("SNF");
  });

  it("filters by date range — both bounds", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-12-31");
    const where = buildGameWhere({ startDate: start, endDate: end });
    expect(where.date).toEqual({ gte: start, lte: end });
  });

  it("filters by date range — start only", () => {
    const start = new Date("2024-09-01");
    const where = buildGameWhere({ startDate: start });
    expect(where.date).toEqual({ gte: start });
  });

  it("filters by date range — end only", () => {
    const end = new Date("2024-12-31");
    const where = buildGameWhere({ endDate: end });
    expect(where.date).toEqual({ lte: end });
  });

  it("filters by team (OR home/away)", () => {
    const where = buildGameWhere({ team: "Kansas City Chiefs" });
    expect(where.OR).toEqual([
      { homeTeam: { name: "Kansas City Chiefs" } },
      { awayTeam: { name: "Kansas City Chiefs" } },
    ]);
  });

  it("filters by homeTeam specifically", () => {
    const where = buildGameWhere({ homeTeam: "Green Bay Packers" });
    expect(where.homeTeam).toEqual({ name: "Green Bay Packers" });
  });

  it("filters by awayTeam specifically", () => {
    const where = buildGameWhere({ awayTeam: "Chicago Bears" });
    expect(where.awayTeam).toEqual({ name: "Chicago Bears" });
  });

  it("filters by winner", () => {
    const where = buildGameWhere({ winner: "Kansas City Chiefs" });
    expect(where.winner).toEqual({ name: "Kansas City Chiefs" });
  });

  it("filters by hasBetting = true", () => {
    const where = buildGameWhere({ hasBetting: true });
    expect(where.bettingLine).toEqual({ isNot: null });
  });

  it("filters by hasBetting = false", () => {
    const where = buildGameWhere({ hasBetting: false });
    expect(where.bettingLine).toEqual({ is: null });
  });

  it("filters by hasWeather = true", () => {
    const where = buildGameWhere({ hasWeather: true });
    expect(where.weather).toEqual({ isNot: null });
  });

  it("filters by hasWeather = false", () => {
    const where = buildGameWhere({ hasWeather: false });
    expect(where.weather).toEqual({ is: null });
  });

  it("combines multiple filters", () => {
    const where = buildGameWhere({
      season: 2024,
      week: "1",
      isPlayoff: false,
      team: "Kansas City Chiefs",
      hasBetting: true,
    });
    expect(where.season).toEqual({ year: 2024 });
    expect(where.week).toBe("1");
    expect(where.isPlayoff).toBe(false);
    expect(where.OR).toBeDefined();
    expect(where.bettingLine).toEqual({ isNot: null });
  });
});

// ─── buildGameOrderBy ───────────────────────────────────

describe("buildGameOrderBy", () => {
  it("defaults to date desc", () => {
    expect(buildGameOrderBy()).toEqual({ date: "desc" });
  });

  it("accepts custom sort and order", () => {
    expect(buildGameOrderBy("scoreDiff", "asc")).toEqual({ scoreDiff: "asc" });
  });

  it("accepts homeScore sort", () => {
    expect(buildGameOrderBy("homeScore", "desc")).toEqual({ homeScore: "desc" });
  });
});

// ─── buildPagination ────────────────────────────────────

describe("buildPagination", () => {
  it("defaults to page 1, limit 25", () => {
    expect(buildPagination()).toEqual({ skip: 0, take: 25 });
  });

  it("calculates skip correctly for page 2", () => {
    expect(buildPagination(2, 25)).toEqual({ skip: 25, take: 25 });
  });

  it("calculates skip correctly for page 3, limit 10", () => {
    expect(buildPagination(3, 10)).toEqual({ skip: 20, take: 10 });
  });

  it("page 1 has skip 0", () => {
    expect(buildPagination(1, 50)).toEqual({ skip: 0, take: 50 });
  });
});

// ─── buildTeamWhere ─────────────────────────────────────

describe("buildTeamWhere", () => {
  it("returns empty object for no filters", () => {
    expect(buildTeamWhere({})).toEqual({});
  });

  it("filters by conference", () => {
    expect(buildTeamWhere({ conference: "AFC" })).toEqual({ conference: "AFC" });
  });

  it("filters by division", () => {
    expect(buildTeamWhere({ division: "WEST" })).toEqual({ division: "WEST" });
  });

  it("filters by isActive", () => {
    expect(buildTeamWhere({ isActive: true })).toEqual({ isActive: true });
    expect(buildTeamWhere({ isActive: false })).toEqual({ isActive: false });
  });

  it("filters by franchiseKey", () => {
    expect(buildTeamWhere({ franchiseKey: "Raiders" })).toEqual({ franchiseKey: "Raiders" });
  });

  it("combines multiple filters", () => {
    const where = buildTeamWhere({ conference: "NFC", division: "NORTH", isActive: true });
    expect(where).toEqual({ conference: "NFC", division: "NORTH", isActive: true });
  });
});

// ─── buildSeasonWhere ───────────────────────────────────

describe("buildSeasonWhere", () => {
  it("returns empty object for no filters", () => {
    expect(buildSeasonWhere({})).toEqual({});
  });

  it("filters by startYear only", () => {
    expect(buildSeasonWhere({ startYear: 2000 })).toEqual({ year: { gte: 2000 } });
  });

  it("filters by endYear only", () => {
    expect(buildSeasonWhere({ endYear: 2024 })).toEqual({ year: { lte: 2024 } });
  });

  it("filters by year range", () => {
    expect(buildSeasonWhere({ startYear: 2000, endYear: 2024 })).toEqual({
      year: { gte: 2000, lte: 2024 },
    });
  });
});
