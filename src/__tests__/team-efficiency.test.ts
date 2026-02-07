import { describe, it, expect } from "vitest";
import { computeTeamEfficiency, type EfficiencyGame } from "@/lib/team-efficiency";

function makeGame(overrides: Partial<EfficiencyGame> = {}): EfficiencyGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 19,
    homeTotalYards: 350,
    awayTotalYards: 320,
    homeFirstDowns: 20,
    awayFirstDowns: 18,
    homePlays: 70,
    awayPlays: 65,
    homeTimeOfPossession: 30,
    awayTimeOfPossession: 30,
    ...overrides,
  };
}

describe("computeTeamEfficiency — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeTeamEfficiency([]);
    expect(r.teamStats).toHaveLength(0);
    expect(r.mostEfficient).toHaveLength(0);
    expect(r.leastEfficient).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeTeamEfficiency — team efficiency stats", () => {
  it("calculates points per game", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 30 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.pointsPerGame).toBe("25.00");
  });

  it("calculates yards per game", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeTotalYards: 400 }),
      makeGame({ homeTeamName: "Chiefs", homeTotalYards: 300 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.yardsPerGame).toBe("350.00");
  });

  it("calculates yards per play", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeTotalYards: 350, homePlays: 70 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const yardPerPlay = parseFloat(chiefs?.yardsPerPlay || "0");
    expect(yardPerPlay).toBeCloseTo(5, 0);
  });

  it("calculates first downs per game", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeFirstDowns: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeFirstDowns: 22 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.firstDownsPerGame).toBe("21.00");
  });

  it("calculates plays per game", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePlays: 70 }),
      makeGame({ homeTeamName: "Chiefs", homePlays: 80 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.playsPerGame).toBe("75.00");
  });

  it("calculates average time of possession", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeTimeOfPossession: 28 }),
      makeGame({ homeTeamName: "Chiefs", homeTimeOfPossession: 32 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgTimeOfPossession).toBe("30.00");
  });

  it("calculates points per yard", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 20, homeTotalYards: 400 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.pointsPerYard).toBe("0.050");
  });

  it("counts games played", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs" }),
      makeGame({ homeTeamName: "Chiefs" }),
      makeGame({ homeTeamName: "Chiefs" }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.gamesPlayed).toBe(3);
  });

  it("includes away team stats", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", awayScore: 25, awayTotalYards: 380 }),
    ];
    const r = computeTeamEfficiency(games);
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(ravens?.pointsPerGame).toBe("25.00");
  });
});

describe("computeTeamEfficiency — most and least efficient", () => {
  it("identifies most efficient teams by pointsPerYard", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 30, homeTotalYards: 300 }), // 0.1 pts/yd
      makeGame({ homeTeamName: "Ravens", homeScore: 10, homeTotalYards: 400 }), // 0.025 pts/yd
    ];
    const r = computeTeamEfficiency(games);
    expect(r.mostEfficient[0].team).toBe("Chiefs");
  });

  it("identifies least efficient teams", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 30, homeTotalYards: 300 }),
      makeGame({ homeTeamName: "Ravens", homeScore: 10, homeTotalYards: 400 }),
    ];
    const r = computeTeamEfficiency(games);
    expect(r.leastEfficient[0].team).toBe("Ravens");
  });

  it("limits most efficient to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const team = `Team${i}`;
      return makeGame({
        homeTeamName: team,
        homeScore: 30 - (i % 10),
        homeTotalYards: 300,
      });
    });
    const r = computeTeamEfficiency(games);
    expect(r.mostEfficient.length).toBeLessThanOrEqual(10);
    expect(r.leastEfficient.length).toBeLessThanOrEqual(10);
  });
});

describe("computeTeamEfficiency — possession correlation", () => {
  it("calculates win pct when team has more possession", () => {
    const games = [
      makeGame({ homeTimeOfPossession: 35, awayTimeOfPossession: 25, homeScore: 25, awayScore: 20 }), // win with more time
      makeGame({ homeTimeOfPossession: 35, awayTimeOfPossession: 25, homeScore: 20, awayScore: 25 }), // loss with more time
    ];
    const r = computeTeamEfficiency(games);
    expect(r.possessionCorrelation.morePossessionWinPct).toBe("0.500");
  });

  it("calculates win pct when team has less possession", () => {
    const games = [
      makeGame({ awayTimeOfPossession: 35, homeTimeOfPossession: 25, awayScore: 25, homeScore: 20 }), // away win with less time
      makeGame({ awayTimeOfPossession: 35, homeTimeOfPossession: 25, awayScore: 20, homeScore: 25 }), // away loss with less time
    ];
    const r = computeTeamEfficiency(games);
    expect(r.possessionCorrelation.lessPossessionWinPct).toBe("0.500");
  });

  it("returns .000 for no games with more possession", () => {
    const games = [makeGame({ homeTimeOfPossession: 25, awayTimeOfPossession: 35 })];
    const r = computeTeamEfficiency(games);
    expect(r.possessionCorrelation.morePossessionWinPct).toBe(".000");
  });
});

describe("computeTeamEfficiency — season trends", () => {
  it("calculates league average yards per play by season", () => {
    const games = [
      makeGame({ season: 2024, homeTotalYards: 350, homePlays: 70, awayTotalYards: 300, awayPlays: 60 }),
    ];
    const r = computeTeamEfficiency(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.leagueAvgYardsPerPlay).toBeDefined();
  });

  it("calculates league average points per game by season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 20, awayScore: 16 }),
      makeGame({ season: 2024, homeScore: 24, awayScore: 18 }),
    ];
    const r = computeTeamEfficiency(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.leagueAvgPtsPerGame).toBe("19.50");
  });

  it("sorts seasons in ascending order", () => {
    const games = [
      makeGame({ season: 2023 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeTeamEfficiency(games);
    expect(r.seasonTrends[0].season).toBe(2022);
    expect(r.seasonTrends[1].season).toBe(2023);
    expect(r.seasonTrends[2].season).toBe(2024);
  });
});

describe("computeTeamEfficiency — ties", () => {
  it("skips tied games", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 20 }),
      makeGame({ homeScore: 25, awayScore: 20 }),
    ];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.gamesPlayed).toBe(1);
  });
});

describe("computeTeamEfficiency — edge cases", () => {
  it("handles zero plays gracefully", () => {
    const games = [makeGame({ homeTeamName: "Chiefs", homePlays: 0 })];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.yardsPerPlay).toBe("0.00");
  });

  it("handles zero yards gracefully", () => {
    const games = [makeGame({ homeTeamName: "Chiefs", homeTotalYards: 0 })];
    const r = computeTeamEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.pointsPerYard).toBe("0.000");
  });
});

describe("computeTeamEfficiency — integration", () => {
  it("handles multiple teams across multiple seasons", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 20, awayScore: 19 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 22 }),
    ];
    const r = computeTeamEfficiency(games);
    expect(r.teamStats.length).toBeGreaterThanOrEqual(2);
    expect(r.seasonTrends.length).toBe(2);
  });
});
