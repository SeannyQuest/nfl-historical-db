import { describe, it, expect } from "vitest";
import { computePenaltyImpact, type PenaltyGame } from "@/lib/penalty-impact";

function makeGame(overrides: Partial<PenaltyGame> = {}): PenaltyGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 19,
    homePenalties: 5,
    awayPenalties: 3,
    homePenaltyYards: 45,
    awayPenaltyYards: 25,
    ...overrides,
  };
}

describe("computePenaltyImpact — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computePenaltyImpact([]);
    expect(r.teamStats).toHaveLength(0);
    expect(r.mostPenalized).toHaveLength(0);
    expect(r.leastPenalized).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computePenaltyImpact — team penalty stats", () => {
  it("tracks total penalties and yards by team", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 5, homePenaltyYards: 45 }),
      makeGame({ homeTeamName: "Chiefs", homePenalties: 3, homePenaltyYards: 20 }),
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.totalPenalties).toBe(8);
    expect(chiefs?.totalPenaltyYards).toBe(65);
  });

  it("calculates penalties and yards per game", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 4, homePenaltyYards: 40 }),
      makeGame({ homeTeamName: "Chiefs", homePenalties: 6, homePenaltyYards: 60 }),
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.penaltiesPerGame).toBe(5);
    expect(chiefs?.yardsPerGame).toBe(50);
  });

  it("counts games played", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs" }),
      makeGame({ homeTeamName: "Chiefs" }),
      makeGame({ homeTeamName: "Chiefs" }),
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.gamesPlayed).toBe(3);
  });

  it("includes away team penalties", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", awayPenalties: 7, awayPenaltyYards: 63 }),
    ];
    const r = computePenaltyImpact(games);
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(ravens?.totalPenalties).toBe(7);
    expect(ravens?.totalPenaltyYards).toBe(63);
  });
});

describe("computePenaltyImpact — win rates with penalties", () => {
  it("calculates win pct when team has fewer penalties", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 2, awayPenalties: 5, homeScore: 25, awayScore: 20 }), // win with fewer penalties
      makeGame({ homeTeamName: "Chiefs", homePenalties: 2, awayPenalties: 5, homeScore: 20, awayScore: 25 }), // loss with fewer penalties
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenFewerPenalties).toBe("0.500");
  });

  it("calculates win pct when team has more penalties", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 8, awayPenalties: 4, homeScore: 25, awayScore: 20 }), // win with more penalties
      makeGame({ homeTeamName: "Chiefs", homePenalties: 8, awayPenalties: 4, homeScore: 20, awayScore: 25 }), // loss with more penalties
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenMorePenalties).toBe("0.500");
  });

  it("returns .000 for no games with fewer penalties", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 8, awayPenalties: 4 }),
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenFewerPenalties).toBe(".000");
  });
});

describe("computePenaltyImpact — most and least penalized", () => {
  it("identifies most penalized teams", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 10, homePenaltyYards: 90 }),
      makeGame({ homeTeamName: "Chiefs", homePenalties: 8, homePenaltyYards: 72 }),
      makeGame({ homeTeamName: "Ravens", homePenalties: 2, homePenaltyYards: 18 }),
    ];
    const r = computePenaltyImpact(games);
    expect(r.mostPenalized[0].team).toBe("Chiefs");
    expect(r.mostPenalized[0].penaltiesPerGame).toBe(9);
  });

  it("identifies least penalized teams", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homePenalties: 10 }),
      makeGame({ homeTeamName: "Ravens", homePenalties: 2 }),
      makeGame({ homeTeamName: "Ravens", homePenalties: 3 }),
    ];
    const r = computePenaltyImpact(games);
    expect(r.leastPenalized[0].team).toBe("Ravens");
  });

  it("limits most penalized to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const team = `Team${i % 15}`;
      return makeGame({
        homeTeamName: team,
        homePenalties: 15 - (i % 15),
      });
    });
    const r = computePenaltyImpact(games);
    expect(r.mostPenalized.length).toBeLessThanOrEqual(10);
    expect(r.leastPenalized.length).toBeLessThanOrEqual(10);
  });
});

describe("computePenaltyImpact — discipline win correlation", () => {
  it("calculates win pct for fewer penalties league-wide", () => {
    const games = [
      makeGame({ homePenalties: 2, awayPenalties: 5, homeScore: 25, awayScore: 20 }), // fewer penalties win
      makeGame({ homePenalties: 2, awayPenalties: 5, homeScore: 20, awayScore: 25 }), // fewer penalties loss
    ];
    const r = computePenaltyImpact(games);
    expect(r.disciplineWinCorrelation.fewerPenaltiesWinPct).toBe("0.500");
  });

  it("calculates win pct for more penalties league-wide", () => {
    const games = [
      makeGame({ homePenalties: 8, awayPenalties: 3, homeScore: 25, awayScore: 20 }), // more penalties win
      makeGame({ homePenalties: 8, awayPenalties: 3, homeScore: 20, awayScore: 25 }), // more penalties loss
      makeGame({ homePenalties: 8, awayPenalties: 3, homeScore: 22, awayScore: 21 }), // more penalties win
    ];
    const r = computePenaltyImpact(games);
    expect(r.disciplineWinCorrelation.morePenaltiesWinPct).toBe("0.667");
  });

  it("calculates home win pct for equal penalties", () => {
    const games = [
      makeGame({ homePenalties: 5, awayPenalties: 5, homeScore: 25, awayScore: 20 }), // home win
      makeGame({ homePenalties: 5, awayPenalties: 5, homeScore: 20, awayScore: 25 }), // away win
    ];
    const r = computePenaltyImpact(games);
    expect(r.disciplineWinCorrelation.equalPenaltiesHomePct).toBe("0.500");
  });
});

describe("computePenaltyImpact — season trends", () => {
  it("calculates league avg penalties per game by season", () => {
    const games = [
      makeGame({ season: 2024, homePenalties: 4, awayPenalties: 6 }),
      makeGame({ season: 2024, homePenalties: 6, awayPenalties: 4 }),
    ];
    const r = computePenaltyImpact(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.avgPenaltiesPerGame).toBe("5.00");
  });

  it("calculates league avg penalty yards by season", () => {
    const games = [
      makeGame({ season: 2024, homePenaltyYards: 40, awayPenaltyYards: 60 }),
      makeGame({ season: 2024, homePenaltyYards: 60, awayPenaltyYards: 40 }),
    ];
    const r = computePenaltyImpact(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.avgYardsPerGame).toBe("50.00");
  });

  it("sorts seasons in ascending order", () => {
    const games = [
      makeGame({ season: 2023, homePenalties: 5 }),
      makeGame({ season: 2024, homePenalties: 5 }),
      makeGame({ season: 2022, homePenalties: 5 }),
    ];
    const r = computePenaltyImpact(games);
    expect(r.seasonTrends[0].season).toBe(2022);
    expect(r.seasonTrends[1].season).toBe(2023);
    expect(r.seasonTrends[2].season).toBe(2024);
  });
});

describe("computePenaltyImpact — ties", () => {
  it("skips tied games", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 20 }),
      makeGame({ homeScore: 25, awayScore: 20 }),
    ];
    const r = computePenaltyImpact(games);
    const chiefs = r.teamStats.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.gamesPlayed).toBe(1);
  });
});

describe("computePenaltyImpact — integration", () => {
  it("handles multiple teams across multiple seasons", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Chiefs", awayTeamName: "Texans", homePenalties: 5, awayPenalties: 3 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", awayTeamName: "Ravens", homePenalties: 3, awayPenalties: 2 }),
    ];
    const r = computePenaltyImpact(games);
    expect(r.teamStats.length).toBeGreaterThanOrEqual(2);
    expect(r.seasonTrends.length).toBe(2);
  });
});
