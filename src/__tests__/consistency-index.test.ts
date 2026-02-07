import { describe, it, expect } from "vitest";
import { computeConsistencyIndex, type ConsistencyGame } from "@/lib/consistency-index";

function makeGame(overrides: Partial<ConsistencyGame> = {}): ConsistencyGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 28,
    awayScore: 20,
    ...overrides,
  };
}

describe("computeConsistencyIndex — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeConsistencyIndex([]);
    expect(r.teamConsistency).toHaveLength(0);
    expect(r.mostConsistent).toHaveLength(0);
    expect(r.leastConsistent).toHaveLength(0);
    expect(r.seasonComparison).toHaveLength(0);
  });
});

describe("computeConsistencyIndex — basic statistics", () => {
  it("calculates average points scored", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 32, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs?.avgPointsScored).toBe(30);
  });

  it("calculates average points allowed", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 28, awayScore: 22 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 32, awayScore: 24 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs?.avgPointsAllowed).toBe(22);
  });
});

describe("computeConsistencyIndex — standard deviation", () => {
  it("calculates stdDev for consistent scoring", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs?.stdDevScored).toBe(0);
  });

  it("calculates higher stdDev for variable scoring", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 10, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 50, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs?.stdDevScored).toBeGreaterThan(15);
  });

  it("calculates stdDev for points allowed", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs?.stdDevAllowed).toBe(0);
  });
});

describe("computeConsistencyIndex — consistency score", () => {
  it("calculates consistency score (1 / (1 + stdDev))", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    // stdDev = 0, so score = 1 / (1 + 0) = 1
    expect(chiefs?.consistencyScore).toBe(1);
  });

  it("assigns lower scores for inconsistent teams", () => {
    const consistent = [
      makeGame({ homeTeamName: "Team1", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Team1", homeScore: 28, awayScore: 20 }),
    ];
    const inconsistent = [
      makeGame({ homeTeamName: "Team2", homeScore: 10, awayScore: 20 }),
      makeGame({ homeTeamName: "Team2", homeScore: 50, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex([...consistent, ...inconsistent]);
    const team1 = r.teamConsistency.find((t) => t.team === "Team1");
    const team2 = r.teamConsistency.find((t) => t.team === "Team2");
    expect(team1!.consistencyScore).toBeGreaterThan(team2!.consistencyScore);
  });
});

describe("computeConsistencyIndex — most/least consistent", () => {
  it("returns top 10 most consistent teams", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({ homeTeamName: `Team${i}`, homeScore: 28, awayScore: 20 })
    );
    const r = computeConsistencyIndex(games);
    expect(r.mostConsistent.length).toBeLessThanOrEqual(10);
  });

  it("sorts most consistent in descending order", () => {
    const games = [
      makeGame({ homeTeamName: "Consistent", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Consistent", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Inconsistent", homeScore: 10, awayScore: 20 }),
      makeGame({ homeTeamName: "Inconsistent", homeScore: 50, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    expect(r.mostConsistent[0].team).toBe("Consistent");
  });

  it("returns bottom 10 least consistent teams", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({ homeTeamName: `Team${i}`, homeScore: 10 + i * 5, awayScore: 20 })
    );
    const r = computeConsistencyIndex(games);
    expect(r.leastConsistent.length).toBeLessThanOrEqual(10);
  });

  it("sorts least consistent in ascending order", () => {
    const games = [
      makeGame({ homeTeamName: "Consistent", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "Inconsistent", homeScore: 10, awayScore: 20 }),
      makeGame({ homeTeamName: "Inconsistent", homeScore: 50, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    expect(r.leastConsistent[0].team).toBe("Inconsistent");
  });
});

describe("computeConsistencyIndex — season comparison", () => {
  it("groups consistency by season", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Team1", homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team2", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    expect(r.seasonComparison).toHaveLength(2);
  });

  it("calculates league average consistency per season", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team1", homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team2", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const season = r.seasonComparison.find((s) => s.season === 2024);
    expect(season?.leagueAvgConsistency).toBeGreaterThan(0);
    expect(season?.leagueAvgConsistency).toBeLessThanOrEqual(1);
  });

  it("sorts seasons in ascending order", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team1", homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2020, homeTeamName: "Team2", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2022, homeTeamName: "Team3", homeScore: 25, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    expect(r.seasonComparison[0].season).toBe(2020);
    expect(r.seasonComparison[1].season).toBe(2022);
    expect(r.seasonComparison[2].season).toBe(2024);
  });
});

describe("computeConsistencyIndex — away team handling", () => {
  it("correctly attributes away team scores", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 24 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 24 }),
    ];
    const r = computeConsistencyIndex(games);
    const ravens = r.teamConsistency.find((t) => t.team === "Ravens" && t.season === 2024);
    expect(ravens?.avgPointsScored).toBe(24);
    expect(ravens?.avgPointsAllowed).toBe(30);
  });
});

describe("computeConsistencyIndex — multi-season tracking", () => {
  it("separates consistency by season", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Chiefs", homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", homeScore: 35, awayScore: 20 }),
    ];
    const r = computeConsistencyIndex(games);
    const chiefs2023 = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2023);
    const chiefs2024 = r.teamConsistency.find((t) => t.team === "Chiefs" && t.season === 2024);
    expect(chiefs2023).toBeDefined();
    expect(chiefs2024).toBeDefined();
    expect(chiefs2023?.avgPointsScored).not.toBe(chiefs2024?.avgPointsScored);
  });
});
