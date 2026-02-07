import { describe, it, expect } from "vitest";
import { computeMondayFactor, type MondayGame } from "@/lib/monday-factor";

function makeGame(overrides: Partial<MondayGame> = {}): MondayGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 20,
    dayOfWeek: "Monday",
    primetime: true,
    ...overrides,
  };
}

describe("computeMondayFactor — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeMondayFactor([]);
    expect(r.mondayNightStats.totalGames).toBe(0);
    expect(r.thursdayNightStats.totalGames).toBe(0);
    expect(r.sundayNightStats.totalGames).toBe(0);
  });

  it("ignores non-primetime games", () => {
    const games = [makeGame({ primetime: false })];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.totalGames).toBe(0);
  });
});

describe("computeMondayFactor — day grouping", () => {
  it("groups Monday games separately", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Thursday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.totalGames).toBe(2);
    expect(r.thursdayNightStats.totalGames).toBe(1);
  });

  it("handles case-insensitive day names", () => {
    const games = [
      makeGame({ dayOfWeek: "MONDAY" }),
      makeGame({ dayOfWeek: "thursday" }),
      makeGame({ dayOfWeek: "Sunday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.totalGames).toBe(1);
    expect(r.thursdayNightStats.totalGames).toBe(1);
    expect(r.sundayNightStats.totalGames).toBe(1);
  });

  it("groups Thursday games separately", () => {
    const games = [
      makeGame({ dayOfWeek: "Thursday" }),
      makeGame({ dayOfWeek: "Thursday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.thursdayNightStats.totalGames).toBe(2);
  });

  it("groups Sunday games separately", () => {
    const games = [
      makeGame({ dayOfWeek: "Sunday" }),
      makeGame({ dayOfWeek: "Sunday" }),
      makeGame({ dayOfWeek: "Sunday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.sundayNightStats.totalGames).toBe(3);
  });
});

describe("computeMondayFactor — home win percentage", () => {
  it("calculates Monday home win pct", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", homeScore: 25, awayScore: 25 }),
      makeGame({ dayOfWeek: "Monday", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeMondayFactor(games);
    // 1 win, 1 tie, 1 loss = 33.33%
    expect(r.mondayNightStats.homeWinPct).toBe((1 / 3) * 100);
  });

  it("calculates Thursday home win pct", () => {
    const games = [
      makeGame({ dayOfWeek: "Thursday", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Thursday", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.thursdayNightStats.homeWinPct).toBe(100);
  });

  it("calculates Sunday home win pct", () => {
    const games = [
      makeGame({ dayOfWeek: "Sunday", homeScore: 20, awayScore: 30 }),
      makeGame({ dayOfWeek: "Sunday", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.sundayNightStats.homeWinPct).toBe(0);
  });
});

describe("computeMondayFactor — average total and margin", () => {
  it("calculates Monday avg total", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 30, awayScore: 20 }), // 50
      makeGame({ dayOfWeek: "Monday", homeScore: 28, awayScore: 22 }), // 50
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.avgTotal).toBe(50);
  });

  it("calculates Monday avg margin", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 30, awayScore: 20 }), // 10
      makeGame({ dayOfWeek: "Monday", homeScore: 28, awayScore: 20 }), // 8
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.avgMargin).toBe(9);
  });

  it("calculates Thursday stats correctly", () => {
    const games = [
      makeGame({ dayOfWeek: "Thursday", homeScore: 35, awayScore: 25 }), // total 60, margin 10
      makeGame({ dayOfWeek: "Thursday", homeScore: 40, awayScore: 30 }), // total 70, margin 10
    ];
    const r = computeMondayFactor(games);
    expect(r.thursdayNightStats.avgTotal).toBe(65);
    expect(r.thursdayNightStats.avgMargin).toBe(10);
  });
});

describe("computeMondayFactor — day comparison", () => {
  it("includes all days in comparison", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Thursday" }),
      makeGame({ dayOfWeek: "Sunday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.dayComparison).toHaveLength(3);
  });

  it("sorts day comparison by game count descending", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Monday" }),
      makeGame({ dayOfWeek: "Thursday" }),
      makeGame({ dayOfWeek: "Sunday" }),
    ];
    const r = computeMondayFactor(games);
    expect(r.dayComparison[0].day).toBe("Monday");
    expect(r.dayComparison[0].games).toBe(3);
  });

  it("includes stats in day comparison", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeMondayFactor(games);
    const mon = r.dayComparison.find((d) => d.day === "Monday");
    expect(mon?.homeWinPct).toBe(100);
    expect(mon?.avgTotal).toBe(50);
    expect(mon?.games).toBe(1);
  });
});

describe("computeMondayFactor — team Monday records", () => {
  it("creates record for team with Monday games", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", awayTeamName: "Chiefs", homeScore: 20, awayScore: 25 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
  });

  it("counts Monday wins for home team", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.mondayWins).toBe(1);
  });

  it("counts Monday losses for away team", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeMondayFactor(games);
    const ravens = r.teamMondayRecords.find((t) => t.team === "Ravens");
    expect(ravens?.mondayLosses).toBe(1);
  });

  it("calculates Monday win pct for team", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", awayTeamName: "Chiefs", homeScore: 20, awayScore: 30 }),
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 25, awayScore: 26 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    // 2 wins, 1 loss = 66.67%
    expect(chiefs?.mondayWinPct).toBeCloseTo(66.67, 1);
  });

  it("sorts team records by win pct descending", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Ravens", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.teamMondayRecords[0].mondayWinPct).toBeGreaterThanOrEqual(
      r.teamMondayRecords[1].mondayWinPct
    );
  });

  it("includes both home and away games for team", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", awayTeamName: "Chiefs", homeScore: 25, awayScore: 28 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.mondayWins).toBe(2);
    expect(chiefs?.mondayLosses).toBe(0);
  });

  it("excludes non-Monday games from team records", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ dayOfWeek: "Thursday", homeTeamName: "Chiefs", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.mondayWins).toBe(1);
    expect(chiefs?.mondayLosses).toBe(0);
  });
});

describe("computeMondayFactor — tie game handling", () => {
  it("ignores ties in home win pct", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 30, awayScore: 30 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.homeWinPct).toBe(0);
  });

  it("doesn't count ties as wins or losses for team records", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeTeamName: "Chiefs", homeScore: 25, awayScore: 25 }),
    ];
    const r = computeMondayFactor(games);
    const chiefs = r.teamMondayRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.mondayWins).toBe(0);
    expect(chiefs?.mondayLosses).toBe(0);
  });
});

describe("computeMondayFactor — multiple seasons", () => {
  it("treats games from all seasons together", () => {
    const games = [
      makeGame({ season: 2023, dayOfWeek: "Monday", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, dayOfWeek: "Monday", homeScore: 25, awayScore: 25 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.totalGames).toBe(2);
  });
});

describe("computeMondayFactor — edge cases", () => {
  it("handles all away team wins on Monday", () => {
    const games = [
      makeGame({ dayOfWeek: "Monday", homeScore: 10, awayScore: 30 }),
      makeGame({ dayOfWeek: "Monday", homeScore: 15, awayScore: 35 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.mondayNightStats.homeWinPct).toBe(0);
  });

  it("handles high-scoring primetime games", () => {
    const games = [
      makeGame({ dayOfWeek: "Sunday", homeScore: 42, awayScore: 38 }),
      makeGame({ dayOfWeek: "Sunday", homeScore: 45, awayScore: 40 }),
    ];
    const r = computeMondayFactor(games);
    expect(r.sundayNightStats.avgTotal).toBe(165 / 2);
  });
});
