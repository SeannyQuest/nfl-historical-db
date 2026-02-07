import { describe, it, expect } from "vitest";
import { computeHomeRoadSplits, type HomeRoadGame } from "@/lib/home-road-splits";

function makeGame(overrides: Partial<HomeRoadGame> = {}): HomeRoadGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 24,
    awayScore: 20,
    isPlayoff: false,
    primetime: false,
    ...overrides,
  };
}

describe("computeHomeRoadSplits — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeHomeRoadSplits([]);
    expect(r.teamSplits).toHaveLength(0);
    expect(r.biggestHomeSplits).toHaveLength(0);
    expect(r.bestRoadTeams).toHaveLength(0);
    expect(r.worstRoadTeams).toHaveLength(0);
    expect(r.primetimeSplits.homeWinPct).toBe(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeHomeRoadSplits — team splits", () => {
  it("tracks home wins and losses", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWins).toBe(1);
    expect(chiefs?.homeLosses).toBe(1);
  });

  it("tracks away wins and losses", () => {
    const games = [
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.awayWins).toBe(1);
    expect(chiefs?.awayLosses).toBe(1);
  });

  it("computes home win percentage", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWinPct).toBe(1.0);
  });

  it("computes away win percentage", () => {
    const games = [
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.awayWinPct).toBeCloseTo(0.5, 2);
  });

  it("calculates split differential", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Bears",
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    // homeWinPct = 2/2 = 1.0, awayWinPct = 2/3 = 0.667, diff = 0.333
    expect(chiefs?.splitDifferential).toBeCloseTo(0.333, 2);
  });
});

describe("computeHomeRoadSplits — points per game", () => {
  it("calculates home points per game", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 28,
        awayScore: 10,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.homePtsPerGame).toBe(26);
  });

  it("calculates away points per game", () => {
    const games = [
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
      }),
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 28,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.awayPtsPerGame).toBe(26);
  });
});

describe("computeHomeRoadSplits — biggest home splits", () => {
  it("limits biggest home splits to 10", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 10),
        homeTeamName: `Team${i}`,
        awayTeamName: "Other",
        homeScore: 30 - i,
        awayScore: 10,
      })
    );
    const r = computeHomeRoadSplits(games);
    expect(r.biggestHomeSplits.length).toBeLessThanOrEqual(10);
  });

  it("sorts by split differential descending", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 30, awayScore: 10 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 20, awayScore: 10 }),
      makeGame({ awayTeamName: "Chiefs", homeScore: 10, awayScore: 20 }),
    ];
    const r = computeHomeRoadSplits(games);
    expect(r.biggestHomeSplits[0].team).toBe("Chiefs");
  });
});

describe("computeHomeRoadSplits — best and worst road teams", () => {
  it("identifies best road teams by away win pct", () => {
    const games = [
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 30,
      }),
      makeGame({
        homeTeamName: "Ravens",
        awayTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 30,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.bestRoadTeams.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
  });

  it("limits best road teams to 10", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 10),
        homeTeamName: "Other",
        awayTeamName: `Team${i}`,
        homeScore: 10,
        awayScore: 30 - i,
      })
    );
    const r = computeHomeRoadSplits(games);
    expect(r.bestRoadTeams.length).toBeLessThanOrEqual(10);
  });

  it("limits worst road teams to 10", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 10),
        homeTeamName: "Other",
        awayTeamName: `Team${i}`,
        homeScore: 30 - i,
        awayScore: 10,
      })
    );
    const r = computeHomeRoadSplits(games);
    expect(r.worstRoadTeams.length).toBeLessThanOrEqual(10);
  });
});

describe("computeHomeRoadSplits — primetime splits", () => {
  it("calculates home team win pct in primetime", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
        primetime: true,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
        primetime: true,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 10,
        primetime: false,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    // 1 home win out of 2 primetime home games = 0.5
    expect(r.primetimeSplits.homeWinPct).toBe(0.5);
  });

  it("calculates away team win pct in primetime", () => {
    const games = [
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 24,
        primetime: true,
      }),
      makeGame({
        awayTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 10,
        primetime: true,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    // 1 away win out of 2 primetime away games = 0.5
    expect(r.primetimeSplits.awayWinPct).toBe(0.5);
  });

  it("ignores non-primetime games", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 10,
        primetime: false,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    expect(r.primetimeSplits.homeWinPct).toBe(0);
  });

  it("handles zero primetime games", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
        primetime: false,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    expect(r.primetimeSplits.homeWinPct).toBe(0);
    expect(r.primetimeSplits.awayWinPct).toBe(0);
  });
});

describe("computeHomeRoadSplits — season trends", () => {
  it("tracks league home win pct by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    expect(r.seasonTrends).toHaveLength(2);
    const trend2023 = r.seasonTrends.find((t) => t.season === 2023);
    expect(trend2023?.leagueHomeWinPct).toBe(1.0);
  });

  it("tracks league away win pct by season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const trend = r.seasonTrends.find((t) => t.season === 2024);
    expect(trend?.leagueAwayWinPct).toBe(1.0);
  });

  it("sorts seasons chronologically", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[1].season).toBe(2024);
  });
});

describe("computeHomeRoadSplits — edge cases", () => {
  it("handles teams with no home games", () => {
    const games = [
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWins).toBe(0);
    expect(chiefs?.homeLosses).toBe(0);
  });

  it("handles teams with no away games", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.awayWins).toBe(0);
    expect(chiefs?.awayLosses).toBe(0);
  });

  it("ignores playoff flag for splits calculation", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeScore: 24,
        awayScore: 20,
        isPlayoff: true,
      }),
    ];
    const r = computeHomeRoadSplits(games);
    const chiefs = r.teamSplits.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWins).toBe(1);
  });
});
