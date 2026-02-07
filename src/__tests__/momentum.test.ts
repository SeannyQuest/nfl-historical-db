import { describe, it, expect } from "vitest";
import { computeMomentumTracker, type MomentumGame } from "@/lib/momentum";

function makeGame(overrides: Partial<MomentumGame> = {}): MomentumGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 19,
    ...overrides,
  };
}

describe("computeMomentumTracker — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeMomentumTracker([]);
    expect(r.teamStreaks).toHaveLength(0);
    expect(r.hotTeams).toHaveLength(0);
    expect(r.coldTeams).toHaveLength(0);
    expect(r.biggestSwings).toHaveLength(0);
    expect(r.seasonMomentum).toHaveLength(0);
  });
});

describe("computeMomentumTracker — basic streaks", () => {
  it("identifies win streak", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 30, awayScore: 15 }),
      makeGame({ week: 3, homeScore: 28, awayScore: 18 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.longestWinStreak).toBe(3);
  });

  it("identifies loss streak", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 15, awayScore: 30 }),
      makeGame({ week: 3, homeScore: 12, awayScore: 28 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.longestLossStreak).toBe(3);
  });

  it("tracks current streak", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 30, awayScore: 15 }),
      makeGame({ week: 3, homeScore: 28, awayScore: 18 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.currentStreak).toBe(3);
  });

  it("tracks current loss streak", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 15, awayScore: 30 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.currentStreak).toBe(-2);
  });

  it("counts games played", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 30, awayScore: 15 }),
      makeGame({ week: 3, homeScore: 10, awayScore: 25 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.gamesPlayed).toBe(3);
  });
});

describe("computeMomentumTracker — multiple streaks", () => {
  it("tracks longest win streak across multiple streaks", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 30, awayScore: 15 }),
      makeGame({ week: 3, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 4, homeScore: 35, awayScore: 10 }),
      makeGame({ week: 5, homeScore: 32, awayScore: 12 }),
      makeGame({ week: 6, homeScore: 28, awayScore: 14 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.longestWinStreak).toBe(3);
  });

  it("handles alternating wins and losses", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 20 }), // W
      makeGame({ week: 2, homeScore: 10, awayScore: 25 }), // L
      makeGame({ week: 3, homeScore: 28, awayScore: 18 }), // W
      makeGame({ week: 4, homeScore: 12, awayScore: 30 }), // L
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.longestWinStreak).toBe(1);
    expect(chiefs?.longestLossStreak).toBe(1);
  });
});

describe("computeMomentumTracker — hot and cold teams", () => {
  it("identifies hot teams by longest win streak", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", week: 2, homeScore: 30, awayScore: 15 }),
      makeGame({ homeTeamName: "Chiefs", week: 3, homeScore: 28, awayScore: 18 }),
      makeGame({ homeTeamName: "Ravens", week: 1, homeScore: 20, awayScore: 19 }),
    ];
    const r = computeMomentumTracker(games);
    expect(r.hotTeams.length).toBeGreaterThan(0);
    const chiefs = r.hotTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.winStreak).toBe(3);
  });

  it("identifies cold teams by longest loss streak", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ homeTeamName: "Chiefs", week: 2, homeScore: 15, awayScore: 30 }),
      makeGame({ homeTeamName: "Chiefs", week: 3, homeScore: 12, awayScore: 28 }),
      makeGame({ homeTeamName: "Ravens", week: 1, homeScore: 20, awayScore: 19 }),
    ];
    const r = computeMomentumTracker(games);
    expect(r.coldTeams.length).toBeGreaterThan(0);
    const chiefs = r.coldTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.lossStreak).toBe(3);
  });

  it("limits hot teams to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const team = `Team${i % 15}`;
      return makeGame({ homeTeamName: team, week: i + 1, homeScore: 25, awayScore: 20 });
    });
    const r = computeMomentumTracker(games);
    expect(r.hotTeams.length).toBeLessThanOrEqual(10);
  });
});

describe("computeMomentumTracker — biggest swings", () => {
  it("computes delta from loss streak to win streak", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ homeTeamName: "Chiefs", week: 2, homeScore: 15, awayScore: 30 }),
      makeGame({ homeTeamName: "Chiefs", week: 3, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", week: 4, homeScore: 30, awayScore: 15 }),
      makeGame({ homeTeamName: "Chiefs", week: 5, homeScore: 28, awayScore: 18 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.biggestSwings.find((s) => s.team === "Chiefs");
    expect(chiefs?.fromLossStreak).toBe(2);
    expect(chiefs?.toLongestWinStreak).toBe(3);
    expect(chiefs?.delta).toBe(5);
  });

  it("limits biggest swings to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const team = `Team${i % 15}`;
      return makeGame({ homeTeamName: team, week: i + 1, homeScore: 25, awayScore: 20 });
    });
    const r = computeMomentumTracker(games);
    expect(r.biggestSwings.length).toBeLessThanOrEqual(10);
  });
});

describe("computeMomentumTracker — season momentum", () => {
  it("tracks weekly records for teams", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 2, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 3, homeScore: 28, awayScore: 18 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefsMomentum = r.seasonMomentum.find((s) => s.team === "Chiefs" && s.season === 2024);
    expect(chiefsMomentum?.weeklyRecord).toHaveLength(3);
  });

  it("tracks cumulative wins and losses", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 1, homeScore: 25, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 2, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 3, homeScore: 28, awayScore: 18 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefsMomentum = r.seasonMomentum.find((s) => s.team === "Chiefs" && s.season === 2024);
    expect(chiefsMomentum?.weeklyRecord[2].cumulativeWins).toBe(2);
    expect(chiefsMomentum?.weeklyRecord[2].cumulativeLosses).toBe(1);
  });

  it("includes week numbers in records", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Chiefs", week: 5, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefsMomentum = r.seasonMomentum.find((s) => s.team === "Chiefs");
    expect(chiefsMomentum?.weeklyRecord[0].week).toBe(5);
  });
});

describe("computeMomentumTracker — away teams", () => {
  it("tracks away team streaks", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ awayTeamName: "Ravens", week: 2, homeScore: 15, awayScore: 30 }),
    ];
    const r = computeMomentumTracker(games);
    const ravens = r.teamStreaks.find((t) => t.team === "Ravens");
    expect(ravens?.longestWinStreak).toBe(2);
  });

  it("includes away teams in hot teams", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ awayTeamName: "Ravens", week: 2, homeScore: 15, awayScore: 30 }),
      makeGame({ awayTeamName: "Ravens", week: 3, homeScore: 12, awayScore: 28 }),
    ];
    const r = computeMomentumTracker(games);
    const ravens = r.hotTeams.find((t) => t.team === "Ravens");
    expect(ravens?.winStreak).toBe(3);
  });
});

describe("computeMomentumTracker — ties", () => {
  it("skips tied games", () => {
    const games = [
      makeGame({ week: 1, homeScore: 20, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeMomentumTracker(games);
    const chiefs = r.teamStreaks.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.gamesPlayed).toBe(1);
  });
});
