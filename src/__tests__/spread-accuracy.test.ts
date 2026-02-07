import { describe, it, expect } from "vitest";
import {
  computeSpreadAccuracy,
  type SpreadGame,
} from "@/lib/spread-accuracy";

function makeGame(overrides: Partial<SpreadGame> = {}): SpreadGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    spread: -5.0,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeSpreadAccuracy — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeSpreadAccuracy([]);
    expect(r.avgAbsError).toBe(0);
    expect(r.spreadRangeAccuracy).toHaveLength(0);
    expect(r.homeTeamAccuracy).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });

  it("ignores games without spreads", () => {
    const games = [
      makeGame({ spread: null }),
      makeGame({ spread: null }),
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.avgAbsError).toBe(0);
  });
});

// ─── Average Absolute Error ─────────────────────────────

describe("computeSpreadAccuracy — avg absolute error", () => {
  it("computes exact error for single game", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 20, spread: -5.0 }),
      // margin is 7, spread is -5 (home favored by 5), error is |7 - (-5)| = 12
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.avgAbsError).toBe(12);
  });

  it("computes avg error for multiple games", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 20, spread: -5.0 }), // margin 7, error |7-(-5)| = 12
      makeGame({ homeScore: 24, awayScore: 21, spread: -3.0 }), // margin 3, error |3-(-3)| = 6
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.avgAbsError).toBe(9); // (12 + 6) / 2
  });

  it("handles push (zero spread)", () => {
    const games = [makeGame({ homeScore: 20, awayScore: 20, spread: 0 })];
    const r = computeSpreadAccuracy(games);
    expect(r.avgAbsError).toBe(0); // |0 - 0| = 0
  });
});

// ─── Spread Range Accuracy ──────────────────────────────

describe("computeSpreadAccuracy — spread range accuracy", () => {
  it("categorizes pick 'em games", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21, spread: 0 }),
      makeGame({ homeScore: 27, awayScore: 24, spread: 0 }),
    ];
    const r = computeSpreadAccuracy(games);
    const pkRange = r.spreadRangeAccuracy.find((x) => x.range === "PK");
    expect(pkRange).toBeDefined();
    expect(pkRange?.games).toBe(2);
  });

  it("categorizes 1-3 point spreads", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 20, spread: -2.0 }),
      makeGame({ homeScore: 24, awayScore: 21, spread: -1.5 }),
    ];
    const r = computeSpreadAccuracy(games);
    const range = r.spreadRangeAccuracy.find((x) => x.range === "1-3");
    expect(range).toBeDefined();
    expect(range?.games).toBe(2);
  });

  it("categorizes 3.5-7 point spreads", () => {
    const games = [
      makeGame({ homeScore: 28, awayScore: 20, spread: -5.0 }),
      makeGame({ homeScore: 35, awayScore: 28, spread: -7.0 }),
    ];
    const r = computeSpreadAccuracy(games);
    const range = r.spreadRangeAccuracy.find((x) => x.range === "3.5-7");
    expect(range).toBeDefined();
    expect(range?.games).toBe(2);
  });

  it("categorizes 7.5-10 point spreads", () => {
    const games = [
      makeGame({ homeScore: 28, awayScore: 20, spread: -8.0 }),
      makeGame({ homeScore: 35, awayScore: 25, spread: -10.0 }),
    ];
    const r = computeSpreadAccuracy(games);
    const range = r.spreadRangeAccuracy.find((x) => x.range === "7.5-10");
    expect(range).toBeDefined();
    expect(range?.games).toBe(2);
  });

  it("categorizes 10+ point spreads", () => {
    const games = [
      makeGame({ homeScore: 42, awayScore: 20, spread: -15.0 }),
      makeGame({ homeScore: 35, awayScore: 14, spread: -21.0 }),
    ];
    const r = computeSpreadAccuracy(games);
    const range = r.spreadRangeAccuracy.find((x) => x.range === "10+");
    expect(range).toBeDefined();
    expect(range?.games).toBe(2);
  });

  it("filters out ranges with zero games", () => {
    const games = [makeGame({ homeScore: 27, awayScore: 20, spread: -5.0 })];
    const r = computeSpreadAccuracy(games);
    expect(r.spreadRangeAccuracy.every((x) => x.games > 0)).toBe(true);
  });
});

// ─── Home Team Accuracy ─────────────────────────────────

describe("computeSpreadAccuracy — home team accuracy", () => {
  it("computes avg error per home team", () => {
    const games = [
      makeGame({
        homeTeamName: "Green Bay Packers",
        homeScore: 27,
        awayScore: 20,
        spread: -5.0,
      }), // error 12
      makeGame({
        homeTeamName: "Green Bay Packers",
        homeScore: 24,
        awayScore: 21,
        spread: -3.0,
      }), // error 6
    ];
    const r = computeSpreadAccuracy(games);
    const gb = r.homeTeamAccuracy.find((x) => x.team === "Green Bay Packers");
    expect(gb?.avgError).toBe(9); // (12 + 6) / 2
    expect(gb?.games).toBe(2);
  });

  it("computes cover percentage", () => {
    const games = [
      makeGame({
        homeTeamName: "Green Bay Packers",
        homeScore: 27,
        awayScore: 20,
        spread: -5.0,
      }), // margin 7, covers (7 >= -5)
      makeGame({
        homeTeamName: "Green Bay Packers",
        homeScore: 24,
        awayScore: 21,
        spread: -5.0,
      }), // margin 3, covers (3 >= -5)
    ];
    const r = computeSpreadAccuracy(games);
    const gb = r.homeTeamAccuracy.find((x) => x.team === "Green Bay Packers");
    expect(gb?.coverPct).toBe(Math.round((2 / 2) * 10000) / 10000); // 2 covers / 2 games
  });

  it("sorts by avg error ascending", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        homeScore: 30,
        awayScore: 20,
        spread: -10.0,
      }), // error 20
      makeGame({
        homeTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
        spread: -5.0,
      }), // error 12
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.homeTeamAccuracy[0].team).toBe("Team B");
    expect(r.homeTeamAccuracy[1].team).toBe("Team A");
  });
});

// ─── Season Trends ──────────────────────────────────────

describe("computeSpreadAccuracy — season trends", () => {
  it("groups errors by season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 27, awayScore: 20, spread: -5.0 }),
      makeGame({ season: 2023, homeScore: 24, awayScore: 21, spread: -3.0 }),
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.seasonTrends).toHaveLength(2);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ season: 2020, homeScore: 27, awayScore: 20, spread: -5.0 }),
      makeGame({ season: 2024, homeScore: 24, awayScore: 21, spread: -3.0 }),
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.seasonTrends[0].season).toBe(2024);
    expect(r.seasonTrends[1].season).toBe(2020);
  });

  it("computes avg error per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 27, awayScore: 20, spread: -5.0 }), // error 12
      makeGame({ season: 2024, homeScore: 24, awayScore: 21, spread: -3.0 }), // error 6
    ];
    const r = computeSpreadAccuracy(games);
    const s2024 = r.seasonTrends.find((x) => x.season === 2024);
    expect(s2024?.avgError).toBe(9);
    expect(s2024?.totalGames).toBe(2);
  });
});

// ─── Multiple Teams ─────────────────────────────────────

describe("computeSpreadAccuracy — multiple teams", () => {
  it("computes stats for all teams independently", () => {
    const games = [
      makeGame({
        homeTeamName: "Green Bay Packers",
        homeScore: 30,
        awayScore: 20,
        spread: -10.0,
      }), // margin 10, error |10 - (-10)| = 20
      makeGame({
        homeTeamName: "Chicago Bears",
        homeScore: 27,
        awayScore: 20,
        spread: -5.0,
      }), // margin 7, error |7 - (-5)| = 12
      makeGame({
        homeTeamName: "Detroit Lions",
        homeScore: 24,
        awayScore: 21,
        spread: -3.0,
      }), // margin 3, error |3 - (-3)| = 6
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.homeTeamAccuracy).toHaveLength(3);
    expect(r.homeTeamAccuracy[0].avgError).toBe(6); // Lions has lowest error
  });
});

// ─── Rounding ───────────────────────────────────────────

describe("computeSpreadAccuracy — rounding", () => {
  it("rounds avg error to 2 decimals", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 20, spread: -5.0 }), // margin 7, error |7 - (-5)| = 12
      makeGame({ homeScore: 25, awayScore: 20, spread: -5.0 }), // margin 5, error |5 - (-5)| = 10
    ];
    const r = computeSpreadAccuracy(games);
    expect(r.avgAbsError).toBe(11); // (12 + 10) / 2
  });

  it("rounds home team errors to 2 decimals", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        homeScore: 27,
        awayScore: 20,
        spread: -5.0,
      }), // margin 7, error |7 - (-5)| = 12
      makeGame({
        homeTeamName: "Team A",
        homeScore: 25,
        awayScore: 20,
        spread: -5.0,
      }), // margin 5, error |5 - (-5)| = 10
    ];
    const r = computeSpreadAccuracy(games);
    const teamA = r.homeTeamAccuracy[0];
    expect(teamA.avgError).toBe(11); // (12 + 10) / 2
  });
});
