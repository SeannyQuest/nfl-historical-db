import { describe, it, expect } from "vitest";
import {
  computeRivalryHeatmap,
  type RivalryHeatGame,
} from "@/lib/rivalry-heatmap";

function makeGame(overrides: Partial<RivalryHeatGame> = {}): RivalryHeatGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    homeDivision: "NFC North",
    awayDivision: "NFC North",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeRivalryHeatmap — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeRivalryHeatmap([]);
    expect(r.rivalryIntensity).toHaveLength(0);
    expect(r.hottestRivalries).toHaveLength(0);
    expect(r.highestScoringRivalries).toHaveLength(0);
    expect(r.divisionRivalryStats).toHaveLength(0);
  });

  it("returns empty arrays for non-divisional games", () => {
    const games = [
      makeGame({
        homeTeamName: "Dallas Cowboys",
        awayTeamName: "Green Bay Packers",
        homeDivision: "NFC East",
        awayDivision: "NFC North",
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.rivalryIntensity).toHaveLength(0);
    expect(r.divisionRivalryStats).toHaveLength(0);
  });
});

// ─── Rivalry Intensity ───────────────────────────────────

describe("computeRivalryHeatmap — rivalry intensity", () => {
  it("counts head-to-head games", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Green Bay Packers",
        awayTeamName: "Chicago Bears",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Chicago Bears",
        awayTeamName: "Green Bay Packers",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
        homeScore: 24,
        awayScore: 25,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.rivalryIntensity.length).toBeGreaterThan(0);
    const matchup = r.rivalryIntensity[0];
    expect(matchup.games).toBe(2);
  });

  it("computes average margin for matchup", () => {
    const games = [
      makeGame({
        homeTeamName: "Minnesota Vikings",
        awayTeamName: "Detroit Lions",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Detroit Lions",
        awayTeamName: "Minnesota Vikings",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
        homeScore: 28,
        awayScore: 27,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.rivalryIntensity.length).toBeGreaterThan(0);
    const matchup = r.rivalryIntensity[0];
    expect(parseFloat(matchup.avgMargin)).toBeGreaterThan(0);
  });

  it("counts one-score games", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test Division",
        awayDivision: "Test Division",
        homeScore: 27,
        awayScore: 26,
      }),
      makeGame({
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeDivision: "Test Division",
        awayDivision: "Test Division",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const matchup = r.rivalryIntensity[0];
    expect(matchup.oneScoreGames).toBe(1);
  });

  it("computes one-score percentage", () => {
    const games = [
      makeGame({
        homeTeamName: "Team X",
        awayTeamName: "Team Y",
        homeDivision: "DIV",
        awayDivision: "DIV",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        homeTeamName: "Team X",
        awayTeamName: "Team Y",
        homeDivision: "DIV",
        awayDivision: "DIV",
        homeScore: 35,
        awayScore: 10,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const matchup = r.rivalryIntensity[0];
    expect(parseFloat(matchup.oneScorePct)).toBeLessThanOrEqual(100);
    expect(parseFloat(matchup.oneScorePct)).toBeGreaterThanOrEqual(0);
  });
});

// ─── Hottest Rivalries ───────────────────────────────────

describe("computeRivalryHeatmap — hottest rivalries", () => {
  it("sorts by lowest average margin", () => {
    const games = [
      // Matchup 1: average margin 5
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 27,
        awayScore: 20,
      }),
      // Matchup 2: average margin 1 (hottest)
      makeGame({
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 22,
        awayScore: 21,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const hottest = r.hottestRivalries[0];
    expect(hottest.avgMargin).toBe("1.0");
  });

  it("limits hottest to top 10", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          homeTeamName: `Team ${i}`,
          awayTeamName: `Team ${i + 100}`,
          homeDivision: "Test",
          awayDivision: "Test",
          homeScore: 20 + i,
          awayScore: 17,
        })
      );
    }
    const r = computeRivalryHeatmap(games);
    expect(r.hottestRivalries.length).toBeLessThanOrEqual(10);
  });

  it("identifies competitive matchups", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 21,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 22,
        awayScore: 21,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.hottestRivalries.length).toBeGreaterThan(0);
    expect(parseFloat(r.hottestRivalries[0].avgMargin)).toBeLessThan(2);
  });
});

// ─── Highest Scoring Rivalries ───────────────────────────

describe("computeRivalryHeatmap — highest scoring", () => {
  it("sorts by highest average total", () => {
    const games = [
      // Low scoring
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 13,
        awayScore: 10,
      }),
      // High scoring
      makeGame({
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 42,
        awayScore: 39,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const highest = r.highestScoringRivalries[0];
    expect(parseFloat(highest.avgTotal)).toBeGreaterThan(40);
  });

  it("limits highest scoring to top 10", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          homeTeamName: `Team ${i}`,
          awayTeamName: `Team ${i + 100}`,
          homeDivision: "Test",
          awayDivision: "Test",
          homeScore: 35 + i,
          awayScore: 30,
        })
      );
    }
    const r = computeRivalryHeatmap(games);
    expect(r.highestScoringRivalries.length).toBeLessThanOrEqual(10);
  });

  it("identifies high-scoring matchups", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 48,
        awayScore: 45,
      }),
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 44,
        awayScore: 42,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.highestScoringRivalries.length).toBeGreaterThan(0);
    expect(parseFloat(r.highestScoringRivalries[0].avgTotal)).toBeGreaterThan(85);
  });
});

// ─── Division Rivalry Stats ──────────────────────────────

describe("computeRivalryHeatmap — division stats", () => {
  it("tracks stats by division", () => {
    const games = [
      makeGame({
        homeTeamName: "Green Bay Packers",
        awayTeamName: "Chicago Bears",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Denver Broncos",
        homeDivision: "AFC West",
        awayDivision: "AFC West",
        homeScore: 24,
        awayScore: 22,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.divisionRivalryStats.length).toBe(2);
  });

  it("computes division average margin", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
        homeScore: 28,
        awayScore: 18,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const divStats = r.divisionRivalryStats[0];
    expect(parseFloat(divStats.avgMargin)).toBeGreaterThan(0);
  });

  it("computes division average total", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
        homeScore: 35,
        awayScore: 32,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const divStats = r.divisionRivalryStats[0];
    expect(parseFloat(divStats.avgTotal)).toBe(67);
  });

  it("counts division games", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
      }),
      makeGame({
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
      }),
      makeGame({
        homeTeamName: "Team E",
        awayTeamName: "Team F",
        homeDivision: "Test Div",
        awayDivision: "Test Div",
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.divisionRivalryStats[0].games).toBe(3);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeRivalryHeatmap — edge cases", () => {
  it("handles single matchup", () => {
    const games = [makeGame()];
    const r = computeRivalryHeatmap(games);
    expect(r.rivalryIntensity).toHaveLength(1);
  });

  it("normalizes team order in matchups", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 25,
        awayScore: 22,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.rivalryIntensity).toHaveLength(1);
    expect(r.rivalryIntensity[0].games).toBe(2);
  });

  it("handles multiple divisions", () => {
    const games = [
      makeGame({
        homeTeamName: "NFC North Team A",
        awayTeamName: "NFC North Team B",
        homeDivision: "NFC North",
        awayDivision: "NFC North",
      }),
      makeGame({
        homeTeamName: "AFC West Team A",
        awayTeamName: "AFC West Team B",
        homeDivision: "AFC West",
        awayDivision: "AFC West",
      }),
      makeGame({
        homeTeamName: "NFC South Team A",
        awayTeamName: "NFC South Team B",
        homeDivision: "NFC South",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeRivalryHeatmap(games);
    expect(r.divisionRivalryStats.length).toBe(3);
  });

  it("handles all tight games", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 23,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeDivision: "Test",
        awayDivision: "Test",
        homeScore: 24,
        awayScore: 23,
      }),
    ];
    const r = computeRivalryHeatmap(games);
    const matchup = r.rivalryIntensity[0];
    expect(parseFloat(matchup.oneScorePct)).toBe(100);
  });
});
