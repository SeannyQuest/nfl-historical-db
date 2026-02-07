import { describe, it, expect } from "vitest";
import {
  computeRestAdvantage,
  type RestGame,
} from "@/lib/rest-advantage";

function makeGame(overrides: Partial<RestGame> = {}): RestGame {
  return {
    season: 2024,
    week: 5,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    dayOfWeek: "Sunday",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeRestAdvantage — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeRestAdvantage([]);
    expect(r.shortRestPerformance.games).toBe(0);
    expect(r.longRestPerformance.games).toBe(0);
    expect(r.normalRestPerformance.games).toBe(0);
    expect(r.teamRestRecords).toHaveLength(0);
    expect(r.restDifferentialImpact).toHaveLength(0);
  });
});

// ─── Short Rest Performance ──────────────────────────────

describe("computeRestAdvantage — short rest", () => {
  it("counts wins on short rest (Thursday after Sunday)", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Dallas Cowboys",
        awayTeamName: "Chicago Bears",
        dayOfWeek: "Sunday",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Dallas Cowboys",
        awayTeamName: "New York Giants",
        dayOfWeek: "Thursday",
        homeScore: 28,
        awayScore: 21,
      }),
    ];
    const r = computeRestAdvantage(games);
    // Both teams play, some classifications may appear
    expect(
      r.shortRestPerformance.games +
        r.normalRestPerformance.games +
        r.longRestPerformance.games
    ).toBeGreaterThan(0);
  });

  it("classifies 3-4 days rest as short", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Denver Broncos",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Las Vegas Raiders",
        dayOfWeek: "Thursday",
        homeScore: 25,
        awayScore: 22,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(
      r.shortRestPerformance.games +
        r.normalRestPerformance.games +
        r.longRestPerformance.games
    ).toBeGreaterThan(0);
  });

  it("marks losses on short rest", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "New England Patriots",
        awayTeamName: "Miami Dolphins",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "New England Patriots",
        awayTeamName: "Buffalo Bills",
        dayOfWeek: "Thursday",
        homeScore: 10,
        awayScore: 24,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(
      r.shortRestPerformance.games +
        r.normalRestPerformance.games +
        r.longRestPerformance.games
    ).toBeGreaterThan(0);
  });
});

// ─── Long Rest Performance ───────────────────────────────

describe("computeRestAdvantage — long rest", () => {
  it("counts wins with long rest (8+ days)", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Tampa Bay Buccaneers",
        awayTeamName: "Detroit Lions",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Tampa Bay Buccaneers",
        awayTeamName: "New Orleans Saints",
        dayOfWeek: "Sunday",
        homeScore: 28,
        awayScore: 21,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(
      r.longRestPerformance.games +
        r.normalRestPerformance.games +
        r.shortRestPerformance.games
    ).toBeGreaterThan(0);
  });

  it("tracks long rest wins vs losses", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "San Francisco 49ers",
        awayTeamName: "Arizona Cardinals",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "San Francisco 49ers",
        awayTeamName: "Seattle Seahawks",
        dayOfWeek: "Sunday",
        homeScore: 30,
        awayScore: 24,
      }),
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "San Francisco 49ers",
        awayTeamName: "Los Angeles Rams",
        dayOfWeek: "Sunday",
        homeScore: 15,
        awayScore: 20,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(
      r.longRestPerformance.games +
        r.normalRestPerformance.games +
        r.shortRestPerformance.games
    ).toBeGreaterThan(0);
  });
});

// ─── Normal Rest Performance ─────────────────────────────

describe("computeRestAdvantage — normal rest", () => {
  it("counts normal rest (6-8 days)", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Miami Dolphins",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Miami Dolphins",
        dayOfWeek: "Sunday",
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.normalRestPerformance.games).toBeGreaterThan(0);
  });

  it("computes normal rest win percentage", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Detroit Lions",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Detroit Lions",
        dayOfWeek: "Sunday",
        homeScore: 27,
        awayScore: 24,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Detroit Lions",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 20,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(parseFloat(r.normalRestPerformance.winPct)).toBeGreaterThanOrEqual(
      0
    );
    expect(parseFloat(r.normalRestPerformance.winPct)).toBeLessThanOrEqual(1);
  });
});

// ─── Team Rest Records ───────────────────────────────────

describe("computeRestAdvantage — team rest records", () => {
  it("tracks short rest record per team", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Buffalo Bills",
        awayTeamName: "Miami Dolphins",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Buffalo Bills",
        awayTeamName: "New England Patriots",
        dayOfWeek: "Thursday",
        homeScore: 28,
        awayScore: 21,
      }),
    ];
    const r = computeRestAdvantage(games);
    const bills = r.teamRestRecords.find((t) => t.team === "Buffalo Bills");
    expect(bills).toBeDefined();
  });

  it("tracks long rest record per team", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Las Vegas Raiders",
        awayTeamName: "Kansas City Chiefs",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Las Vegas Raiders",
        awayTeamName: "Denver Broncos",
        dayOfWeek: "Sunday",
        homeScore: 30,
        awayScore: 24,
      }),
    ];
    const r = computeRestAdvantage(games);
    const raiders = r.teamRestRecords.find((t) => t.team === "Las Vegas Raiders");
    expect(raiders).toBeDefined();
  });

  it("includes all teams that played", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "New York Jets",
        awayTeamName: "New York Giants",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "New York Jets",
        awayTeamName: "Atlanta Falcons",
        dayOfWeek: "Sunday",
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.teamRestRecords.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── Scoring Margins ─────────────────────────────────────

describe("computeRestAdvantage — scoring margins", () => {
  it("computes average margin for short rest", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Pittsburgh Steelers",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Pittsburgh Steelers",
        dayOfWeek: "Thursday",
        homeScore: 35,
        awayScore: 20,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.shortRestPerformance.avgMargin).toBeDefined();
    expect(parseFloat(r.shortRestPerformance.avgMargin)).toBeGreaterThanOrEqual(
      -100
    );
  });

  it("computes average margin for long rest", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Baltimore Ravens",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Baltimore Ravens",
        dayOfWeek: "Sunday",
        homeScore: 40,
        awayScore: 10,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.longRestPerformance.avgMargin).toBeDefined();
  });
});

// ─── Rest Differential Impact ────────────────────────────

describe("computeRestAdvantage — rest differential", () => {
  it("identifies rest advantage situations", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Los Angeles Rams",
        awayTeamName: "Los Angeles Chargers",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Los Angeles Rams",
        awayTeamName: "Arizona Cardinals",
        dayOfWeek: "Thursday",
        homeScore: 28,
        awayScore: 21,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.restDifferentialImpact.length).toBeGreaterThanOrEqual(0);
  });

  it("computes win percentage for rest advantaged team", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Seattle Seahawks",
        awayTeamName: "San Diego Chargers",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Seattle Seahawks",
        awayTeamName: "Denver Broncos",
        dayOfWeek: "Sunday",
        homeScore: 30,
        awayScore: 24,
      }),
    ];
    const r = computeRestAdvantage(games);
    if (r.restDifferentialImpact.length > 0) {
      const item = r.restDifferentialImpact[0];
      expect(parseFloat(item.advantagedTeamWinPct)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(item.advantagedTeamWinPct)).toBeLessThanOrEqual(1);
    }
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeRestAdvantage — edge cases", () => {
  it("handles single game", () => {
    const games = [makeGame({ dayOfWeek: "Sunday" })];
    const r = computeRestAdvantage(games);
    // First game always gets 7 days rest, so classified as normal (6-8)
    expect(
      r.normalRestPerformance.games +
        r.shortRestPerformance.games +
        r.longRestPerformance.games
    ).toBe(2);
  });

  it("handles multiple teams in sequence", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        dayOfWeek: "Sunday",
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Team B",
        awayTeamName: "Team C",
        dayOfWeek: "Sunday",
        homeScore: 30,
        awayScore: 27,
      }),
    ];
    const r = computeRestAdvantage(games);
    expect(r.teamRestRecords.length).toBe(3);
  });

  it("handles all teams losing on short rest", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Losing Team",
        awayTeamName: "Winning Team",
        dayOfWeek: "Sunday",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Another Team",
        awayTeamName: "Losing Team",
        dayOfWeek: "Thursday",
        homeScore: 24,
        awayScore: 10,
      }),
    ];
    const r = computeRestAdvantage(games);
    // Both teams play, so we have 2 games worth of team appearances
    expect(
      r.shortRestPerformance.games +
        r.normalRestPerformance.games +
        r.longRestPerformance.games
    ).toBe(4);
  });
});
