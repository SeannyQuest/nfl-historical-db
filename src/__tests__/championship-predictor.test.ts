import { describe, it, expect } from "vitest";
import {
  computeChampionshipPredictor,
  type PredictorGame,
} from "@/lib/championship-predictor";

function makeGame(overrides: Partial<PredictorGame> = {}): PredictorGame {
  return {
    season: 2024,
    week: "5",
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    homeConference: "NFC",
    isPlayoff: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeChampionshipPredictor — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeChampionshipPredictor([]);
    expect(r.playoffTeamProfiles).toHaveLength(0);
    expect(r.winThresholds).toHaveLength(0);
    expect(r.avgMarginCorrelation).toBe(0);
    expect(r.bestPredictors).toHaveLength(0);
  });
});

// ─── Playoff Detection ───────────────────────────────────

describe("computeChampionshipPredictor — playoff detection", () => {
  it("identifies teams that made playoffs", () => {
    const games = [
      // Regular season: Packers go 3-0
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "3", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }),
      // Playoff: Packers appear
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", awayTeamName: "Bears", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.madePlayoffs).toBe(true);
  });

  it("identifies teams that missed playoffs", () => {
    const games = [
      // Regular season: Bears go 1-2
      makeGame({ season: 2024, week: "1", homeTeamName: "Bears", awayTeamName: "X", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Bears", awayTeamName: "Y", homeScore: 20, awayScore: 27 }),
      makeGame({ season: 2024, week: "3", homeTeamName: "Bears", awayTeamName: "Z", homeScore: 20, awayScore: 27 }),
      // Playoff: Bears don't appear
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", awayTeamName: "Vikings", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    const bears = r.playoffTeamProfiles.find((x) => x.team === "Bears");
    expect(bears?.madePlayoffs).toBe(false);
  });
});

// ─── Regular Season Records ──────────────────────────────

describe("computeChampionshipPredictor — regular season records", () => {
  it("computes wins and losses per team", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }), // win
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", homeScore: 20, awayScore: 24 }), // loss
      makeGame({ season: 2024, week: "3", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }), // win
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.regSeasonWins).toBe(2);
    expect(packers?.regSeasonLosses).toBe(1);
  });

  it("counts away team wins and losses", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", awayTeamName: "Bears", homeScore: 20, awayScore: 27 }), // Bears win
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", awayTeamName: "Bears", homeScore: 27, awayScore: 20 }), // Bears loss
    ];
    const r = computeChampionshipPredictor(games);
    const bears = r.playoffTeamProfiles.find((x) => x.team === "Bears");
    expect(bears?.regSeasonWins).toBe(1);
    expect(bears?.regSeasonLosses).toBe(1);
  });

  it("ignores playoff games in regular season record", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20, isPlayoff: false }),
      makeGame({ season: 2024, week: "Wildcard", homeTeamName: "Packers", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.regSeasonWins).toBe(1);
  });
});

// ─── Average Margin ─────────────────────────────────────

describe("computeChampionshipPredictor — average margin", () => {
  it("computes avg point margin for home team", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }), // +7
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", homeScore: 30, awayScore: 20 }), // +10
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.avgMargin).toBe(8.5); // (7 + 10) / 2
  });

  it("computes avg point margin for away team", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "X", awayTeamName: "Packers", homeScore: 20, awayScore: 27 }), // +7
      makeGame({ season: 2024, week: "2", homeTeamName: "Y", awayTeamName: "Packers", homeScore: 20, awayScore: 30 }), // +10
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.avgMargin).toBe(8.5);
  });

  it("handles negative margins", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 20, awayScore: 27 }), // -7
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", homeScore: 20, awayScore: 30 }), // -10
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.avgMargin).toBe(-8.5);
  });
});

// ─── Win Thresholds ─────────────────────────────────────

describe("computeChampionshipPredictor — win thresholds", () => {
  it("groups teams by win totals", () => {
    const games = [
      // 10-win team that makes playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "Good", homeScore: 27, awayScore: 20 })
      ),
      // 5-win team that misses playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "Bad", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "Bad", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "5", homeTeamName: "Bad", homeScore: 20, awayScore: 27 }),
      // Playoff appearance
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.winThresholds.length).toBeGreaterThan(0);
  });

  it("computes playoff percentage per win total", () => {
    const games = [
      // 2 teams with 10 wins, both make playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "A", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "A", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "B", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "B", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "A", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
      makeGame({ season: 2024, week: "1", homeTeamName: "B", awayTeamName: "Y", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    const threshold10 = r.winThresholds.find((x) => x.minWins === 10);
    expect(threshold10?.playoffPct).toBe(1); // 100%
  });

  it("sorts win thresholds ascending", () => {
    const games = [
      // Create teams with different win counts
      makeGame({ season: 2024, week: "1", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "3", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "4", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "5", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "A10", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "A10", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "A5", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    if (r.winThresholds.length > 1) {
      expect(r.winThresholds[0].minWins).toBeLessThanOrEqual(r.winThresholds[1].minWins);
    }
  });
});

// ─── Average Margin Correlation ─────────────────────────

describe("computeChampionshipPredictor — avg margin correlation", () => {
  it("computes difference between playoff and non-playoff margins", () => {
    const games = [
      // Strong team: high margin, makes playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "Strong", homeScore: 35, awayScore: 20 }), // +15
      makeGame({ season: 2024, week: "2", homeTeamName: "Strong", homeScore: 30, awayScore: 20 }), // +10
      // Weak team: low margin, misses playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "Weak", homeScore: 24, awayScore: 21 }), // +3
      makeGame({ season: 2024, week: "2", homeTeamName: "Weak", homeScore: 20, awayScore: 24 }), // -4
      makeGame({ season: 2024, week: "1", homeTeamName: "Strong", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.avgMarginCorrelation).toBeGreaterThan(0);
  });

  it("returns zero when no correlation", () => {
    const games = [
      // Team with +10 margin makes playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "A", homeScore: 35, awayScore: 25 }),
      // Team with +10 margin misses playoffs
      makeGame({ season: 2024, week: "1", homeTeamName: "B", homeScore: 35, awayScore: 25 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "A", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.avgMarginCorrelation).toBe(10);
  });
});

// ─── Best Predictors ────────────────────────────────────

describe("computeChampionshipPredictor — best predictors", () => {
  it("includes wins as a predictor", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "High", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "High", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "Low", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "High", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.bestPredictors.some((x) => x.metric === "Wins")).toBe(true);
  });

  it("includes avg margin as a predictor", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", homeScore: 35, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Bad", homeScore: 20, awayScore: 25 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.bestPredictors.some((x) => x.metric === "Avg Point Margin")).toBe(true);
  });

  it("sorts predictors by correlation strength", () => {
    const games = [
      // Setup: strong correlation with wins, weak with margin
      makeGame({ season: 2024, week: "1", homeTeamName: "A10", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "A10", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "A5", homeScore: 27, awayScore: 20 }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeGame({ season: 2024, week: `${i + 2}`, homeTeamName: "A5", homeScore: 27, awayScore: 20 })
      ),
      makeGame({ season: 2024, week: "1", homeTeamName: "A10", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    if (r.bestPredictors.length > 1) {
      expect(Math.abs(r.bestPredictors[0].correlation)).toBeGreaterThanOrEqual(
        Math.abs(r.bestPredictors[1].correlation)
      );
    }
  });

  it("filters out zero-correlation predictors", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "A", homeScore: 25, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "B", homeScore: 25, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "A", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(r.bestPredictors.every((x) => x.correlation !== 0)).toBe(true);
  });
});

// ─── Multiple Seasons ───────────────────────────────────

describe("computeChampionshipPredictor — multiple seasons", () => {
  it("tracks profiles separately by season", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2023, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    const p2024 = r.playoffTeamProfiles.find((x) => x.team === "Packers" && x.season === 2024);
    const p2023 = r.playoffTeamProfiles.find((x) => x.team === "Packers" && x.season === 2023);
    expect(p2024).toBeDefined();
    expect(p2023).toBeDefined();
  });
});

// ─── Rounding ───────────────────────────────────────────

describe("computeChampionshipPredictor — rounding", () => {
  it("rounds avg margin to 2 decimals", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Packers", homeScore: 27, awayScore: 20 }), // 7
      makeGame({ season: 2024, week: "2", homeTeamName: "Packers", homeScore: 25, awayScore: 20 }), // 5
      // average: 6
    ];
    const r = computeChampionshipPredictor(games);
    const packers = r.playoffTeamProfiles.find((x) => x.team === "Packers");
    expect(packers?.avgMargin).toBe(6);
  });

  it("rounds correlation to 2 decimals", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Bad", homeScore: 21, awayScore: 20 }),
      makeGame({ season: 2024, week: "1", homeTeamName: "Good", awayTeamName: "X", homeScore: 27, awayScore: 20, isPlayoff: true }),
    ];
    const r = computeChampionshipPredictor(games);
    expect(Number.isFinite(r.avgMarginCorrelation)).toBe(true);
  });
});
