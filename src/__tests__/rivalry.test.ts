import { describe, it, expect } from "vitest";
import { identifyRivalries, type RivalryGame } from "@/lib/rivalry";

function makeGame(overrides: Partial<RivalryGame> = {}): RivalryGame {
  return {
    date: "2024-01-01T12:00:00.000Z",
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Buffalo Bills",
    homeScore: 27,
    awayScore: 20,
    winnerName: "Kansas City Chiefs",
    homeTeamDivision: "AFC West",
    awayTeamDivision: "AFC East",
    ...overrides,
  };
}

describe("identifyRivalries — empty", () => {
  it("returns empty data for no games", () => {
    const result = identifyRivalries([]);
    expect(result.mostPlayedMatchups).toHaveLength(0);
    expect(result.closestRivalries).toHaveLength(0);
  });
});

describe("identifyRivalries — basic matchup tracking", () => {
  it("tracks head-to-head records", () => {
    const result = identifyRivalries([
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Bills", winnerName: "Chiefs" }),
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "Bills",
        awayTeamName: "Chiefs",
        winnerName: "Bills",
      }),
    ]);
    const rivalry = result.mostPlayedMatchups[0];
    expect(rivalry.totalGames).toBe(2);
    expect(rivalry.team1Wins + rivalry.team2Wins).toBe(2);
  });

  it("normalizes team order in matchups", () => {
    const result = identifyRivalries([
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Bills", winnerName: "Chiefs" }),
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "Bills",
        awayTeamName: "Chiefs",
        winnerName: "Bills",
      }),
    ]);
    expect(result.mostPlayedMatchups).toHaveLength(1);
    expect(result.mostPlayedMatchups[0].totalGames).toBe(2);
  });

  it("counts ties", () => {
    const result = identifyRivalries([
      makeGame({ homeScore: 20, awayScore: 20, winnerName: null }),
    ]);
    const rivalry = result.mostPlayedMatchups[0];
    expect(rivalry.ties).toBe(1);
  });
});

describe("identifyRivalries — most played", () => {
  it("sorts by total games descending", () => {
    const result = identifyRivalries([
      makeGame({ homeTeamName: "A", awayTeamName: "B" }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeTeamName: "A", awayTeamName: "B" }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", homeTeamName: "A", awayTeamName: "B" }),
      makeGame({ date: "2024-01-22T12:00:00.000Z", homeTeamName: "C", awayTeamName: "D" }),
    ]);
    expect(result.mostPlayedMatchups[0].totalGames).toBe(3);
    expect(result.mostPlayedMatchups[1].totalGames).toBe(1);
  });

  it("limits to 15 matchups", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        homeTeamName: `Home${i}`,
        awayTeamName: `Away${i}`,
      })
    );
    const result = identifyRivalries(games);
    expect(result.mostPlayedMatchups.length).toBeLessThanOrEqual(15);
  });
});

describe("identifyRivalries — closest rivalries", () => {
  it("identifies closely matched rivalries", () => {
    const result = identifyRivalries([
      makeGame({ homeTeamName: "A", awayTeamName: "B", winnerName: "A" }),
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "B",
        awayTeamName: "A",
        winnerName: "B",
      }),
    ]);
    const rivalry = result.closestRivalries[0];
    expect(rivalry.team1Wins).toBe(1);
    expect(rivalry.team2Wins).toBe(1);
  });

  it("filters for at least 2 games", () => {
    const result = identifyRivalries([
      makeGame({ homeTeamName: "A", awayTeamName: "B" }),
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "A",
        awayTeamName: "B",
      }),
    ]);
    expect(result.closestRivalries.length).toBe(1);
    expect(result.closestRivalries[0].totalGames).toBe(2);
  });

  it("limits to 15 rivalries", () => {
    const games = Array.from({ length: 40 }, (_, i) => {
      const pair = Math.floor(i / 2);
      return makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        homeTeamName: `Home${pair}`,
        awayTeamName: `Away${pair}`,
        winnerName: i % 2 === 0 ? `Home${pair}` : `Away${pair}`,
      });
    });
    const result = identifyRivalries(games);
    expect(result.closestRivalries.length).toBeLessThanOrEqual(15);
  });
});

describe("identifyRivalries — highest scoring", () => {
  it("ranks rivalries by average total points", () => {
    const result = identifyRivalries([
      makeGame({ homeScore: 40, awayScore: 35 }), // 75 total
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 10,
      }), // 24 total
    ]);
    expect(parseFloat(result.highestScoringRivalries[0].avgTotal)).toBeGreaterThan(
      parseFloat(result.highestScoringRivalries[1].avgTotal)
    );
  });

  it("limits to 15 rivalries", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        homeTeamName: `Home${i}`,
        awayTeamName: `Away${i}`,
        homeScore: 30 + i,
        awayScore: 20 + i,
      })
    );
    const result = identifyRivalries(games);
    expect(result.highestScoringRivalries.length).toBeLessThanOrEqual(15);
  });
});

describe("identifyRivalries — division rivalries", () => {
  it("identifies same-division matchups", () => {
    const result = identifyRivalries([
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Broncos",
        homeTeamDivision: "AFC West",
        awayTeamDivision: "AFC West",
      }),
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeTeamName: "Bills",
        awayTeamName: "Patriots",
        homeTeamDivision: "AFC East",
        awayTeamDivision: "AFC East",
      }),
    ]);
    expect(result.divisionRivalries.length).toBe(2);
  });

  it("excludes cross-division games", () => {
    const result = identifyRivalries([
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Bills",
        homeTeamDivision: "AFC West",
        awayTeamDivision: "AFC East",
      }),
    ]);
    expect(result.divisionRivalries).toHaveLength(0);
  });

  it("limits to 15 rivalries", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        homeTeamName: `Home${i}`,
        awayTeamName: `Away${i}`,
        homeTeamDivision: "AFC West",
        awayTeamDivision: "AFC West",
      })
    );
    const result = identifyRivalries(games);
    expect(result.divisionRivalries.length).toBeLessThanOrEqual(15);
  });
});

describe("identifyRivalries — last game tracking", () => {
  it("tracks most recent game in rivalry", () => {
    const result = identifyRivalries([
      makeGame({
        date: "2024-01-01T12:00:00.000Z",
        homeTeamName: "A",
        awayTeamName: "B",
      }),
      makeGame({
        date: "2024-12-31T12:00:00.000Z",
        homeTeamName: "B",
        awayTeamName: "A",
      }),
    ]);
    const rivalry = result.mostPlayedMatchups[0];
    expect(rivalry.lastGame.date).toBe("2024-12-31T12:00:00.000Z");
  });
});

describe("identifyRivalries — average total calculation", () => {
  it("calculates average total correctly", () => {
    const result = identifyRivalries([
      makeGame({ homeScore: 20, awayScore: 10 }), // 30
      makeGame({
        date: "2024-01-08T12:00:00.000Z",
        homeScore: 24,
        awayScore: 26,
      }), // 50
    ]);
    const rivalry = result.mostPlayedMatchups[0];
    expect(rivalry.avgTotal).toBe("40.0");
  });
});
