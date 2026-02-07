import { describe, it, expect } from "vitest";
import {
  computeHistoricalComparison,
  type ComparisonGame,
} from "@/lib/historical-comparison";

function makeGame(overrides: Partial<ComparisonGame> = {}): ComparisonGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeHistoricalComparison — empty", () => {
  it("returns zeroes for no head-to-head games", () => {
    const games = [
      makeGame({
        homeTeamName: "Dallas Cowboys",
        awayTeamName: "Philadelphia Eagles",
      }),
    ];
    const r = computeHistoricalComparison(games, "Green Bay Packers", "Chicago Bears");
    expect(r.headToHead.totalGames).toBe(0);
    expect(r.recentForm).toHaveLength(0);
  });

  it("returns zeroes for no games at all", () => {
    const r = computeHistoricalComparison([], "Team A", "Team B");
    expect(r.headToHead.totalGames).toBe(0);
    expect(r.homeFieldAdvantage.team1HomeWins).toBe(0);
  });
});

// ─── Head to Head ───────────────────────────────────────

describe("computeHistoricalComparison — head-to-head", () => {
  it("counts team1 home wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.team1Wins).toBe(1);
    expect(r.headToHead.team2Wins).toBe(0);
  });

  it("counts team2 away wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 27,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.team1Wins).toBe(0);
    expect(r.headToHead.team2Wins).toBe(1);
  });

  it("counts ties", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 23,
        awayScore: 23,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.ties).toBe(1);
  });

  it("counts total games", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 25,
      }),
      makeGame({
        season: 2022,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 31,
        awayScore: 28,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.totalGames).toBe(3);
  });

  it("computes head-to-head record correctly", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 24,
        awayScore: 28,
      }),
      makeGame({
        season: 2022,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 31,
        awayScore: 32,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.team1Wins).toBe(2);
    expect(r.headToHead.team2Wins).toBe(1);
  });
});

// ─── Home Field Advantage ────────────────────────────────

describe("computeHistoricalComparison — home field", () => {
  it("tracks team1 home wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.homeFieldAdvantage.team1HomeWins).toBe(1);
  });

  it("tracks team1 away wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 20,
        awayScore: 27,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.homeFieldAdvantage.team1AwayWins).toBe(1);
  });

  it("tracks team2 home wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.homeFieldAdvantage.team2HomeWins).toBe(1);
  });

  it("tracks team2 away wins", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 27,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.homeFieldAdvantage.team2AwayWins).toBe(1);
  });

  it("computes home field advantage for both teams", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2022,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 24,
      }),
      makeGame({
        season: 2021,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 31,
        awayScore: 30,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.homeFieldAdvantage.team1HomeWins).toBe(1);
    expect(r.homeFieldAdvantage.team1AwayWins).toBe(0);
    expect(r.homeFieldAdvantage.team2HomeWins).toBe(2);
    expect(r.homeFieldAdvantage.team2AwayWins).toBe(1);
  });
});

// ─── Scoring Comparison ─────────────────────────────────

describe("computeHistoricalComparison — scoring", () => {
  it("computes team1 average points", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 28,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 32,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    // Team A: 28 + 32 = 60, avg: 30.0
    expect(r.scoringComparison.team1AvgPts).toBe("30.0");
  });

  it("computes team2 average points", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 28,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 32,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    // Team B: 20 + 24 = 44, avg: 22.0
    expect(r.scoringComparison.team2AvgPts).toBe("22.0");
  });

  it("computes average margin", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 28,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    // Margins: 10, 4, avg: 7.0
    expect(r.scoringComparison.avgMargin).toBe("7.0");
  });
});

// ─── Recent Form ─────────────────────────────────────────

describe("computeHistoricalComparison — recent form", () => {
  it("includes recent games in order", () => {
    const games = [
      makeGame({
        season: 2020,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 28,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.recentForm.length).toBe(2);
    expect(r.recentForm[0].season).toBe(2024);
  });

  it("limits to last 10 games", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          season: 2024 - i,
          homeTeamName: "Team A",
          awayTeamName: "Team B",
          homeScore: 28 + i,
          awayScore: 20,
        })
      );
    }
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.recentForm.length).toBeLessThanOrEqual(10);
  });

  it("identifies winner in recent games", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 28,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.recentForm[0].winner).toBe("Team A");
  });

  it("identifies away team as winner", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 28,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.recentForm[0].winner).toBe("Team B");
  });
});

// ─── Season by Season ────────────────────────────────────

describe("computeHistoricalComparison — season-by-season", () => {
  it("tracks wins by season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 28,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 31,
        awayScore: 28,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.seasonBySeasonRecord.length).toBe(2);
    const season2024 = r.seasonBySeasonRecord.find((s) => s.season === 2024);
    expect(season2024?.team1Wins).toBe(2);
    expect(season2024?.team2Wins).toBe(0);
  });

  it("sorts seasons in descending order", () => {
    const games = [
      makeGame({
        season: 2020,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 31,
        awayScore: 28,
      }),
      makeGame({
        season: 2022,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.seasonBySeasonRecord[0].season).toBe(2024);
    expect(r.seasonBySeasonRecord[1].season).toBe(2022);
    expect(r.seasonBySeasonRecord[2].season).toBe(2020);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeHistoricalComparison — edge cases", () => {
  it("handles single game", () => {
    const games = [makeGame()];
    const r = computeHistoricalComparison(
      games,
      "Green Bay Packers",
      "Chicago Bears"
    );
    expect(r.headToHead.totalGames).toBe(1);
  });

  it("handles teams with same name in different positions", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Team B",
        awayTeamName: "Team A",
        homeScore: 24,
        awayScore: 25,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.totalGames).toBe(2);
    expect(r.headToHead.team1Wins).toBe(2);
  });

  it("handles games unrelated to comparison teams", () => {
    const games = [
      makeGame({
        homeTeamName: "Other Team 1",
        awayTeamName: "Other Team 2",
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.totalGames).toBe(1);
  });

  it("handles long matchup history", () => {
    const games = [];
    for (let i = 0; i < 100; i++) {
      games.push(
        makeGame({
          season: 2024 - i,
          homeTeamName: i % 2 === 0 ? "Team A" : "Team B",
          awayTeamName: i % 2 === 0 ? "Team B" : "Team A",
          homeScore: 27,
          awayScore: 20,
        })
      );
    }
    const r = computeHistoricalComparison(games, "Team A", "Team B");
    expect(r.headToHead.totalGames).toBe(100);
    expect(r.recentForm.length).toBeLessThanOrEqual(10);
  });
});
