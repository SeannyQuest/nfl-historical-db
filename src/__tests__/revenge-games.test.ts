import { describe, it, expect } from "vitest";
import { computeRevengeGames, type RevengeGame } from "@/lib/revenge-games";

function makeGame(overrides: Partial<RevengeGame> = {}): RevengeGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 20,
    ...overrides,
  };
}

describe("computeRevengeGames — empty and no rematches", () => {
  it("returns empty for no games", () => {
    const r = computeRevengeGames([]);
    expect(r.revengeGames).toHaveLength(0);
    expect(r.revengeWinPct).toBe(0);
  });

  it("returns empty for single game", () => {
    const games = [makeGame()];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(0);
  });

  it("returns empty for no rematches in season", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans" }),
      makeGame({ week: 2, homeTeamName: "Ravens", awayTeamName: "Steelers" }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(0);
  });
});

describe("computeRevengeGames — revenge game detection", () => {
  it("identifies revenge game when loser hosts in rematch", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 5, homeTeamName: "Texans", awayTeamName: "Chiefs", homeScore: 28, awayScore: 25 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(1);
    expect(r.revengeGames[0].homeTeam).toBe("Texans");
    expect(r.revengeGames[0].originalWinner).toBe("Chiefs");
  });

  it("tracks original week in revenge game", () => {
    const games = [
      makeGame({ week: 3, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 35, awayScore: 15 }),
      makeGame({ week: 9, homeTeamName: "Texans", awayTeamName: "Chiefs", homeScore: 22, awayScore: 20 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames[0].originalWeek).toBe(3);
  });

  it("identifies if revenge team won the rematch", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames[0].gotRevenge).toBe(true);
  });

  it("identifies when revenge team lost the rematch", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 20, awayScore: 28 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames[0].gotRevenge).toBe(false);
  });
});

describe("computeRevengeGames — revenge win percentage", () => {
  it("calculates overall revenge win pct when all succeed", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "Steelers", awayTeamName: "Texans", homeScore: 25, awayScore: 10 }),
      makeGame({ week: 9, homeTeamName: "Texans", awayTeamName: "Steelers", homeScore: 20, awayScore: 15 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeWinPct).toBe(100);
  });

  it("calculates 50% when half succeed", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "Steelers", awayTeamName: "Texans", homeScore: 25, awayScore: 10 }),
      makeGame({ week: 9, homeTeamName: "Texans", awayTeamName: "Steelers", homeScore: 18, awayScore: 20 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeWinPct).toBe(50);
  });
});

describe("computeRevengeGames — team revenge records", () => {
  it("creates record for team with revenge game", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.teamRevengeRecords).toHaveLength(1);
    expect(r.teamRevengeRecords[0].team).toBe("Ravens");
  });

  it("counts revenge games played by team", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.teamRevengeRecords[0].revengeGamesPlayed).toBe(1);
  });

  it("counts revenge wins for team", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Steelers", homeScore: 28, awayScore: 15 }),
      makeGame({ week: 9, homeTeamName: "Steelers", awayTeamName: "Chiefs", homeScore: 20, awayScore: 22 }),
    ];
    const r = computeRevengeGames(games);
    const ravens = r.teamRevengeRecords.find((t) => t.team === "Ravens");
    expect(ravens?.revengeWins).toBe(1);
  });

  it("calculates win pct for team revenge games", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.teamRevengeRecords[0].revengeWinPct).toBe(100);
  });

  it("sorts team records by win pct descending", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "Steelers", awayTeamName: "Texans", homeScore: 25, awayScore: 10 }),
      makeGame({ week: 9, homeTeamName: "Texans", awayTeamName: "Steelers", homeScore: 18, awayScore: 20 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.teamRevengeRecords[0].revengeWinPct).toBeGreaterThanOrEqual(
      r.teamRevengeRecords[1].revengeWinPct
    );
  });

  it("handles multiple revenge games for one team", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "Steelers", awayTeamName: "Ravens", homeScore: 24, awayScore: 10 }),
      makeGame({ week: 10, homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 22, awayScore: 20 }),
    ];
    const r = computeRevengeGames(games);
    const ravens = r.teamRevengeRecords.find((t) => t.team === "Ravens");
    expect(ravens?.revengeGamesPlayed).toBe(2);
  });
});

describe("computeRevengeGames — multiple seasons", () => {
  it("separates revenge games by season", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2023, week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
      makeGame({ season: 2024, week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 28, awayScore: 12 }),
      makeGame({ season: 2024, week: 9, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 31, awayScore: 29 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(2);
    expect(r.revengeGames[0].season).toBe(2023);
    expect(r.revengeGames[1].season).toBe(2024);
  });
});

describe("computeRevengeGames — edge cases", () => {
  it("handles away team win in first game and loser hosts second", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 10, awayScore: 30 }),
      makeGame({ week: 8, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(1);
    expect(r.revengeGames[0].originalWinner).toBe("Ravens");
  });

  it("ignores non-rematch games", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 5, homeTeamName: "Chiefs", awayTeamName: "Steelers", homeScore: 25, awayScore: 20 }),
      makeGame({ week: 8, homeTeamName: "Ravens", awayTeamName: "Chiefs", homeScore: 35, awayScore: 30 }),
    ];
    const r = computeRevengeGames(games);
    expect(r.revengeGames).toHaveLength(1);
  });
});
