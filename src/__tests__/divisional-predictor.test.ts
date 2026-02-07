import { describe, it, expect } from "vitest";
import {
  computeDivisionalPredictor,
  type DivPredGame,
} from "@/lib/divisional-predictor";

function makeGame(overrides: Partial<DivPredGame> = {}): DivPredGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 24,
    awayScore: 17,
    isPlayoff: false,
    homeDivision: "NFC North",
    awayDivision: "NFC North",
    ...overrides,
  };
}

// ─── Empty ───────────────────────────────────────────────

describe("computeDivisionalPredictor — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeDivisionalPredictor([]);
    expect(r.divisionWinPctInPlayoffs).toHaveLength(0);
    expect(r.regularSeasonPlayoffCorrelation).toBe(0);
    expect(r.homeFieldInPlayoffs.homeWins).toBe(0);
    expect(r.upsetRate).toBe(0);
  });
});

// ─── Division Playoff Stats ─────────────────────────────

describe("computeDivisionalPredictor — division playoff stats", () => {
  it("counts division playoff wins and losses", () => {
    const games = [
      // Regular season
      makeGame({ season: 2024, week: "1", isPlayoff: false, homeTeamName: "A", awayTeamName: "B", homeScore: 24, awayScore: 17 }),
      makeGame({ season: 2024, week: "2", isPlayoff: false, homeTeamName: "A", awayTeamName: "C", homeScore: 24, awayScore: 17 }),
      // Playoffs
      makeGame({
        season: 2024,
        week: "Wild Card",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 28,
        awayScore: 14,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
      makeGame({
        season: 2024,
        week: "Wild Card",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 20,
        awayScore: 24,
        homeDivision: "NFC West",
        awayDivision: "NFC West",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.divisionWinPctInPlayoffs.length).toBeGreaterThan(0);
  });

  it("computes playoff win percentage per division", () => {
    const games = [
      makeGame({ season: 2023, week: "1", isPlayoff: false }),
      makeGame({ season: 2023, week: "2", isPlayoff: false }),
      makeGame({
        season: 2023,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
      makeGame({
        season: 2023,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    const nflcEast = r.divisionWinPctInPlayoffs.find(
      (d) => d.division === "NFC East"
    );
    expect(nflcEast?.playoffWinPct).toBe(0.5);
  });

  it("ignores regular season games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 50,
        awayScore: 0,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    const nflcEast = r.divisionWinPctInPlayoffs.find(
      (d) => d.division === "NFC East"
    );
    expect(nflcEast?.playoffWins).toBe(0);
  });

  it("sorts by win percentage descending", () => {
    const games = [
      makeGame({ season: 2023, week: "1", isPlayoff: false }),
      makeGame({
        season: 2023,
        week: "PO1",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
      makeGame({
        season: 2023,
        week: "PO2",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
        homeDivision: "NFC West",
        awayDivision: "AFC East",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    for (let i = 0; i < r.divisionWinPctInPlayoffs.length - 1; i++) {
      expect(r.divisionWinPctInPlayoffs[i].playoffWinPct).toBeGreaterThanOrEqual(
        r.divisionWinPctInPlayoffs[i + 1].playoffWinPct
      );
    }
  });
});

// ─── Regular Season Playoff Correlation ──────────────────

describe("computeDivisionalPredictor — regular season playoff correlation", () => {
  it("measures correlation between regular season record and playoff wins", () => {
    const games = [
      // Regular season: A goes 2-0, B goes 0-2
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "2",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "3",
        isPlayoff: false,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 14,
        awayScore: 24,
      }),
      // Playoff: A beats B (higher seed wins)
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.regularSeasonPlayoffCorrelation).toBeGreaterThan(0);
    expect(r.regularSeasonPlayoffCorrelation).toBeLessThanOrEqual(1);
  });

  it("handles no playoff games", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({ season: 2024, week: "2", isPlayoff: false }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.regularSeasonPlayoffCorrelation).toBe(0);
  });
});

// ─── Home Field Advantage in Playoffs ────────────────────

describe("computeDivisionalPredictor — home field in playoffs", () => {
  it("counts home wins and losses in playoffs", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      // Playoffs
      makeGame({
        season: 2024,
        week: "PO1",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
      makeGame({
        season: 2024,
        week: "PO2",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
        homeDivision: "NFC West",
        awayDivision: "NFC West",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.homeFieldInPlayoffs.homeWins).toBe(1);
    expect(r.homeFieldInPlayoffs.homeLosses).toBe(1);
  });

  it("computes home win percentage in playoffs", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({
        season: 2024,
        week: "PO1",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
      makeGame({
        season: 2024,
        week: "PO2",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC West",
        awayDivision: "NFC West",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.homeFieldInPlayoffs.homeWinPct).toBe(1);
  });

  it("ignores regular season games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeScore: 50,
        awayScore: 0,
      }),
      makeGame({
        season: 2024,
        week: "PO1",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 14,
        awayScore: 24,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.homeFieldInPlayoffs.homeWins).toBe(0);
    expect(r.homeFieldInPlayoffs.homeLosses).toBe(1);
  });
});

// ─── Upset Rate ──────────────────────────────────────────

describe("computeDivisionalPredictor — upset rate", () => {
  it("measures lower seed playoff wins", () => {
    const games = [
      // Regular season: A 2-0, B 0-2
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "2",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "3",
        isPlayoff: false,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 14,
        awayScore: 24,
      }),
      // Playoff: B (lower seed) beats A (upset)
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 17,
        awayScore: 24,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.upsetRate).toBeGreaterThan(0);
  });

  it("counts no upsets when higher seeds win", () => {
    const games = [
      // Regular season: A 2-0, B 0-2
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "2",
        isPlayoff: false,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: "3",
        isPlayoff: false,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 14,
        awayScore: 24,
      }),
      // Playoff: A (higher seed) beats B
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC East",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.upsetRate).toBe(0);
  });

  it("handles no playoff games", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({ season: 2024, week: "2", isPlayoff: false }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.upsetRate).toBe(0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeDivisionalPredictor — edge cases", () => {
  it("handles single playoff game", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.homeFieldInPlayoffs.homeWins).toBe(1);
  });

  it("handles team not in regular season", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false, homeTeamName: "A", awayTeamName: "B" }),
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 24,
        awayScore: 17,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.regularSeasonPlayoffCorrelation).toBe(0);
  });

  it("handles ties in playoff", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({
        season: 2024,
        week: "Playoff",
        isPlayoff: true,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 24,
        homeDivision: "NFC East",
        awayDivision: "NFC South",
      }),
    ];
    const r = computeDivisionalPredictor(games);
    expect(r.homeFieldInPlayoffs.homeWins).toBe(0);
  });
});
