import { describe, it, expect } from "vitest";
import { computeScoringMargins, type MarginGame } from "@/lib/scoring-margins";

function makeGame(overrides: Partial<MarginGame> = {}): MarginGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 24,
    ...overrides,
  };
}

describe("computeScoringMargins — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeScoringMargins([]);
    expect(r.avgMargin).toBe(0);
    expect(r.marginDistribution).toHaveLength(0);
    expect(r.teamMargins).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeScoringMargins — average margin", () => {
  it("calculates average margin correctly", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 20 }), // 10
      makeGame({ homeScore: 25, awayScore: 20 }), // 5
      makeGame({ homeScore: 40, awayScore: 30 }), // 10
    ];
    const r = computeScoringMargins(games);
    expect(r.avgMargin).toBe(8.3);
  });

  it("handles single game", () => {
    const games = [makeGame({ homeScore: 35, awayScore: 28 })];
    const r = computeScoringMargins(games);
    expect(r.avgMargin).toBe(7);
  });

  it("calculates zero margin for ties", () => {
    const games = [makeGame({ homeScore: 30, awayScore: 30 })];
    const r = computeScoringMargins(games);
    expect(r.avgMargin).toBe(0);
  });
});

describe("computeScoringMargins — margin distribution", () => {
  it("creates 7 buckets", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 28 }), // 2 (0-5)
      makeGame({ homeScore: 35, awayScore: 27 }), // 8 (6-10)
      makeGame({ homeScore: 40, awayScore: 26 }), // 14 (11-15)
      makeGame({ homeScore: 45, awayScore: 25 }), // 20 (16-20)
      makeGame({ homeScore: 50, awayScore: 24 }), // 26 (26-30)
    ];
    const r = computeScoringMargins(games);
    expect(r.marginDistribution).toHaveLength(7);
  });

  it("correctly categorizes margins into buckets", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 28 }), // 2 → 0-5
      makeGame({ homeScore: 30, awayScore: 20 }), // 10 → 6-10
      makeGame({ homeScore: 30, awayScore: 16 }), // 14 → 11-15
      makeGame({ homeScore: 30, awayScore: 12 }), // 18 → 16-20
      makeGame({ homeScore: 30, awayScore: 7 }), // 23 → 21-25
      makeGame({ homeScore: 30, awayScore: 2 }), // 28 → 26-30
      makeGame({ homeScore: 50, awayScore: 10 }), // 40 → 31+
    ];
    const r = computeScoringMargins(games);
    expect(r.marginDistribution[0].count).toBe(1); // 0-5
    expect(r.marginDistribution[1].count).toBe(1); // 6-10
    expect(r.marginDistribution[2].count).toBe(1); // 11-15
    expect(r.marginDistribution[3].count).toBe(1); // 16-20
    expect(r.marginDistribution[4].count).toBe(1); // 21-25
    expect(r.marginDistribution[5].count).toBe(1); // 26-30
    expect(r.marginDistribution[6].count).toBe(1); // 31+
  });

  it("calculates percentages correctly", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 28 }), // 0-5
      makeGame({ homeScore: 30, awayScore: 28 }), // 0-5
      makeGame({ homeScore: 30, awayScore: 20 }), // 6-10
      makeGame({ homeScore: 30, awayScore: 20 }), // 6-10
    ];
    const r = computeScoringMargins(games);
    expect(r.marginDistribution[0].pct).toBe(50); // 2/4
    expect(r.marginDistribution[1].pct).toBe(50); // 2/4
  });
});

describe("computeScoringMargins — team margins", () => {
  it("calculates average margin for wins", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }), // Chiefs win by 10
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 35, awayScore: 28 }), // Chiefs win by 7
    ];
    const r = computeScoringMargins(games);
    const chiefs = r.teamMargins.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgMarginWin).toBe(8.5);
  });

  it("calculates average margin for losses", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }), // Ravens lose by 10
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 15 }), // Ravens lose by 10
    ];
    const r = computeScoringMargins(games);
    const ravens = r.teamMargins.find((t) => t.team === "Ravens");
    expect(ravens?.avgMarginLoss).toBe(10);
  });

  it("counts blowout wins (margin >= 21)", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 50, awayScore: 20 }), // 30
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 45, awayScore: 22 }), // 23
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 40, awayScore: 25 }), // 15
    ];
    const r = computeScoringMargins(games);
    const chiefs = r.teamMargins.find((t) => t.team === "Chiefs");
    expect(chiefs?.blowoutWins).toBe(2);
  });

  it("counts close wins (margin <= 3)", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 27 }), // 3
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 28, awayScore: 26 }), // 2
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 40, awayScore: 20 }), // 20
    ];
    const r = computeScoringMargins(games);
    const chiefs = r.teamMargins.find((t) => t.team === "Chiefs");
    expect(chiefs?.closeWins).toBe(2);
  });

  it("handles team with no wins", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 50, awayScore: 10 }),
    ];
    const r = computeScoringMargins(games);
    const ravens = r.teamMargins.find((t) => t.team === "Ravens");
    expect(ravens?.avgMarginWin).toBe(0);
    expect(ravens?.avgMarginLoss).toBe(40);
  });

  it("handles team with no losses", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 50, awayScore: 10 }),
    ];
    const r = computeScoringMargins(games);
    const chiefs = r.teamMargins.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgMarginWin).toBe(40);
    expect(chiefs?.avgMarginLoss).toBe(0);
  });
});

describe("computeScoringMargins — season trends", () => {
  it("groups games by season", () => {
    const games = [
      makeGame({ season: 2023 }),
      makeGame({ season: 2023 }),
      makeGame({ season: 2024 }),
    ];
    const r = computeScoringMargins(games);
    expect(r.seasonTrends).toHaveLength(2);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[1].season).toBe(2024);
  });

  it("calculates average margin per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 30, awayScore: 20 }), // 10
      makeGame({ season: 2024, homeScore: 35, awayScore: 30 }), // 5
    ];
    const r = computeScoringMargins(games);
    const season = r.seasonTrends.find((s) => s.season === 2024);
    expect(season?.avgMargin).toBe(7.5);
  });

  it("calculates close game percentage per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 30, awayScore: 27 }), // 3 close
      makeGame({ season: 2024, homeScore: 30, awayScore: 26 }), // 4 not close
      makeGame({ season: 2024, homeScore: 30, awayScore: 29 }), // 1 close
    ];
    const r = computeScoringMargins(games);
    const season = r.seasonTrends.find((s) => s.season === 2024);
    expect(season?.closeGamePct).toBe(66.7);
  });

  it("sorts by season ascending", () => {
    const games = [
      makeGame({ season: 2024 }),
      makeGame({ season: 2020 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeScoringMargins(games);
    expect(r.seasonTrends[0].season).toBe(2020);
    expect(r.seasonTrends[1].season).toBe(2022);
    expect(r.seasonTrends[2].season).toBe(2024);
  });
});

describe("computeScoringMargins — away team wins", () => {
  it("correctly attributes away team wins", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 20, awayScore: 30 }), // Ravens win by 10
    ];
    const r = computeScoringMargins(games);
    const ravens = r.teamMargins.find((t) => t.team === "Ravens");
    expect(ravens?.avgMarginWin).toBe(10);
  });
});
