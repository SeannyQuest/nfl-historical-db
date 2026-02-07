import { describe, it, expect } from "vitest";
import { computeBettingValue, type BettingGame } from "@/lib/betting-value";

function makeGame(overrides: Partial<BettingGame> = {}): BettingGame {
  return {
    season: 2024,
    week: "5",
    homeTeamName: "New England Patriots",
    awayTeamName: "Buffalo Bills",
    homeScore: 24,
    awayScore: 21,
    homeTeamAbbr: "NE",
    awayTeamAbbr: "BUF",
    spread: -2.5,
    spreadResult: "COVERED",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeBettingValue — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeBettingValue([]);
    expect(r.stats.totalGames).toBe(0);
    expect(r.stats.homeUnderdogs.games).toBe(0);
    expect(r.stats.roadFavorites.games).toBe(0);
  });
});

// ─── Home Underdogs ─────────────────────────────────────

describe("computeBettingValue — home underdogs", () => {
  it("identifies home underdogs (positive spread)", () => {
    const games = [
      makeGame({ spread: 2.5, spreadResult: "COVERED" }),
      makeGame({ spread: 5.0, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.homeUnderdogs.games).toBe(2);
  });

  it("counts covers for home underdogs", () => {
    const games = [
      makeGame({ spread: 2.5, spreadResult: "COVERED" }),
      makeGame({ spread: 3.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.homeUnderdogs.wins).toBe(1);
  });
});

// ─── Road Favorites ────────────────────────────────────

describe("computeBettingValue — road favorites", () => {
  it("identifies road favorites (negative spread)", () => {
    const games = [
      makeGame({ spread: -2.5, spreadResult: "COVERED" }),
      makeGame({ spread: -5.0, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.roadFavorites.games).toBe(2);
  });

  it("counts covers for road favorites", () => {
    const games = [
      makeGame({ spread: -2.5, spreadResult: "COVERED" }),
      makeGame({ spread: -3.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.roadFavorites.wins).toBe(1);
  });
});

// ─── Spread Categories ──────────────────────────────────

describe("computeBettingValue — spread categories", () => {
  it("counts big spreads (>10)", () => {
    const games = [
      makeGame({ spread: -12.0, spreadResult: "COVERED" }),
      makeGame({ spread: 11.5, spreadResult: "COVERED" }),
      makeGame({ spread: -8.0, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.bigSpreads.games).toBe(2);
  });

  it("counts small spreads (<3)", () => {
    const games = [
      makeGame({ spread: -1.5, spreadResult: "COVERED" }),
      makeGame({ spread: 2.0, spreadResult: "COVERED" }),
      makeGame({ spread: -5.0, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.smallSpreads.games).toBe(2);
  });

  it("ignores zero spread", () => {
    const games = [
      makeGame({ spread: 0, spreadResult: "PUSH" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.smallSpreads.games).toBe(0);
  });
});

// ─── Divisional Games ───────────────────────────────────

describe("computeBettingValue — divisional ATS", () => {
  it("counts divisional games (same conference)", () => {
    const games = [
      makeGame({ homeTeamAbbr: "NE", awayTeamAbbr: "NB", spreadResult: "COVERED" }), // Both N* abbreviations
      makeGame({ homeTeamAbbr: "KC", awayTeamAbbr: "KA", spreadResult: "COVERED" }), // Both K* abbreviations
      makeGame({ homeTeamAbbr: "NE", awayTeamAbbr: "KC", spreadResult: "COVERED" }), // Different first letters
    ];
    const r = computeBettingValue(games);
    expect(r.stats.divisionalATS.games).toBe(2);
    expect(r.stats.nonDivisionalATS.games).toBe(1);
  });
});

// ─── Team ATS Records ───────────────────────────────────

describe("computeBettingValue — team ATS records", () => {
  it("tracks team ATS wins", () => {
    const games = [
      makeGame({ homeTeamName: "Kansas City Chiefs", spread: -3.0, spreadResult: "COVERED" }),
      makeGame({ homeTeamName: "Kansas City Chiefs", spread: -2.5, spreadResult: "COVERED" }),
      makeGame({ awayTeamName: "Kansas City Chiefs", spread: 3.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    const chiefs = r.stats.bestATSTeams.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.atsWins).toBe(2);
  });

  it("limits best ATS teams to 10", () => {
    const games = Array.from({ length: 15 }, (_, i) =>
      makeGame({
        season: 2024,
        week: String(i + 1),
        homeTeamName: `Team ${i % 12}`,
        awayTeamName: `Team ${(i + 1) % 12}`,
        spread: -2.0,
        spreadResult: "COVERED",
      })
    );
    const r = computeBettingValue(games);
    expect(r.stats.bestATSTeams.length).toBeLessThanOrEqual(10);
  });

  it("computes ATS win rate", () => {
    const games = [
      makeGame({ homeTeamName: "Green Bay Packers", spread: -3.0, spreadResult: "COVERED" }),
      makeGame({ homeTeamName: "Green Bay Packers", spread: -2.5, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    const packers = r.stats.bestATSTeams.find((t) => t.team === "Green Bay Packers");
    expect(packers?.winRate).toBe("1.000");
  });
});

// ─── ATS Win Rates ──────────────────────────────────────

describe("computeBettingValue — ATS win rates", () => {
  it("computes edge win rates", () => {
    const games = [
      makeGame({ spread: 2.5, spreadResult: "COVERED" }),
      makeGame({ spread: 3.0, spreadResult: "COVERED" }),
      makeGame({ spread: 4.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    // 2 wins, 1 loss among home underdogs
    expect(parseFloat(r.stats.homeUnderdogs.atsWinRate)).toBeCloseTo(0.667, 2);
  });

  it("returns .000 for no games in category", () => {
    const games = [
      makeGame({ spread: -2.5, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.homeUnderdogs.atsWinRate).toBe(".000");
  });
});

// ─── ROI Calculation ────────────────────────────────────

describe("computeBettingValue — ROI", () => {
  it("calculates positive ROI for winning edges", () => {
    const games = [
      makeGame({ spread: 2.5, spreadResult: "COVERED" }),
      makeGame({ spread: 3.0, spreadResult: "COVERED" }),
    ];
    const r = computeBettingValue(games);
    expect(parseFloat(r.stats.homeUnderdogs.roi)).toBeGreaterThan(0);
  });

  it("calculates negative ROI for losing edges", () => {
    const games = [
      makeGame({ spread: 2.5, spreadResult: "LOST" }),
      makeGame({ spread: 3.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    expect(parseFloat(r.stats.homeUnderdogs.roi)).toBeLessThan(0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeBettingValue — edge cases", () => {
  it("handles null spread", () => {
    const games = [
      makeGame({ spread: null, spreadResult: "PUSH" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.totalGames).toBe(1);
  });

  it("handles null spreadResult", () => {
    const games = [
      makeGame({ spread: -2.5, spreadResult: null }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.totalGames).toBe(1);
  });

  it("includes worst ATS teams", () => {
    const games = [
      makeGame({ homeTeamName: "Team A", spread: -3.0, spreadResult: "COVERED" }),
      makeGame({ homeTeamName: "Team B", spread: -3.0, spreadResult: "LOST" }),
    ];
    const r = computeBettingValue(games);
    expect(r.stats.worstATSTeams.length).toBeGreaterThan(0);
  });
});
