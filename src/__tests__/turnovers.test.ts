import { describe, it, expect } from "vitest";
import { computeTurnoverAnalysis, type TurnoverGame } from "@/lib/turnovers";

function makeGame(overrides: Partial<TurnoverGame> = {}): TurnoverGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 24,
    awayScore: 20,
    homeTurnovers: 1,
    awayTurnovers: 2,
    homeInterceptions: 0,
    awayInterceptions: 1,
    homeFumbles: 1,
    awayFumbles: 1,
    ...overrides,
  };
}

describe("computeTurnoverAnalysis — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeTurnoverAnalysis([]);
    expect(r.teamStats).toHaveLength(0);
    expect(r.leagueAvgTurnoversPerGame).toBe(0);
    expect(r.bestTurnoverDiff).toHaveLength(0);
    expect(r.worstTurnoverDiff).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeTurnoverAnalysis — single game", () => {
  it("tracks turnovers by team", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 2,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(chiefs?.totalTurnovers).toBe(1);
    expect(ravens?.totalTurnovers).toBe(2);
  });

  it("computes turnovers per game", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 3,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(chiefs?.turnoversPerGame).toBe(1);
    expect(ravens?.turnoversPerGame).toBe(3);
  });

  it("tracks interceptions and fumbles separately", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeInterceptions: 2,
        homeFumbles: 1,
        awayTeamName: "Ravens",
        awayInterceptions: 0,
        awayFumbles: 2,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(chiefs?.interceptions).toBe(2);
    expect(chiefs?.fumbles).toBe(1);
    expect(ravens?.interceptions).toBe(0);
    expect(ravens?.fumbles).toBe(2);
  });
});

describe("computeTurnoverAnalysis — turnover differential", () => {
  it("calculates turnover differential correctly", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 3,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.turnoverDifferential).toBe(2); // 3 - 1
  });

  it("accumulates differential across multiple games", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 2,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 2,
        awayTeamName: "Ravens",
        awayTurnovers: 1,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.turnoverDifferential).toBe(0); // (2-1) + (1-2) = 0
  });

  it("limits best teams to 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 2),
        homeTeamName: `Team${i}`,
        awayTeamName: "Other",
        homeTurnovers: i,
        awayTurnovers: 20 - i,
      })
    );
    const r = computeTurnoverAnalysis(games);
    expect(r.bestTurnoverDiff.length).toBeLessThanOrEqual(10);
  });

  it("limits worst teams to 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 2),
        homeTeamName: `Team${i}`,
        awayTeamName: "Other",
        homeTurnovers: 20 - i,
        awayTurnovers: i,
      })
    );
    const r = computeTurnoverAnalysis(games);
    expect(r.worstTurnoverDiff.length).toBeLessThanOrEqual(10);
  });
});

describe("computeTurnoverAnalysis — turnover battle win pct", () => {
  it("tracks wins when winning turnover battle", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 3,
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenWinningTurnoverBattle).toBe(1.0);
  });

  it("tracks losses when winning turnover battle", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 3,
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenWinningTurnoverBattle).toBe(0);
  });

  it("computes win pct when losing turnover battle", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 3,
        awayTeamName: "Ravens",
        awayTurnovers: 1,
        homeScore: 24,
        awayScore: 20,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenLosingTurnoverBattle).toBe(1.0);
  });

  it("handles multiple games for win pct", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 1,
        awayTeamName: "Ravens",
        awayTurnovers: 2,
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 0,
        awayTeamName: "Ravens",
        awayTurnovers: 2,
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.winPctWhenWinningTurnoverBattle).toBeCloseTo(0.5, 2);
  });
});

describe("computeTurnoverAnalysis — league averages", () => {
  it("computes league average turnovers per game", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTurnovers: 2,
        awayTurnovers: 4,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    // Chiefs: 2/1 = 2.0, Ravens: 4/1 = 4.0, avg = (2.0 + 4.0) / 2 = 3.0
    expect(r.leagueAvgTurnoversPerGame).toBe(3);
  });

  it("handles multiple teams correctly", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTurnovers: 1,
        awayTurnovers: 3,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Lions",
        homeTurnovers: 2,
        awayTurnovers: 2,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    expect(r.teamStats.length).toBe(3);
  });
});

describe("computeTurnoverAnalysis — season trends", () => {
  it("tracks trends by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTurnovers: 1,
        awayTurnovers: 1,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTurnovers: 2,
        awayTurnovers: 2,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    expect(r.seasonTrends).toHaveLength(2);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[1].season).toBe(2024);
  });

  it("computes average turnovers per game per season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTurnovers: 1,
        awayTurnovers: 3,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const trend = r.seasonTrends.find((t) => t.season === 2024);
    // (1 + 3) / 2 = 2.0
    expect(trend?.avgTurnoversPerGame).toBe(2);
  });
});

describe("computeTurnoverAnalysis — edge cases", () => {
  it("handles zero turnovers", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTurnovers: 0,
        awayTeamName: "Ravens",
        awayTurnovers: 0,
      }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.totalTurnovers).toBe(0);
    expect(chiefs?.turnoversPerGame).toBe(0);
  });

  it("counts games played correctly", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens" }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Lions" }),
      makeGame({ homeTeamName: "Ravens", awayTeamName: "Lions" }),
    ];
    const r = computeTurnoverAnalysis(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.gamesPlayed).toBe(2);
  });
});
