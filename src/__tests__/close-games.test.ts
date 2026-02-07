import { describe, it, expect } from "vitest";
import { computeCloseGames, type CloseGame } from "@/lib/close-games";

function makeGame(overrides: Partial<CloseGame> = {}): CloseGame {
  return {
    season: 2024,
    week: "5",
    homeTeamName: "New England Patriots",
    awayTeamName: "Buffalo Bills",
    homeScore: 24,
    awayScore: 21,
    homeTeamAbbr: "NE",
    awayTeamAbbr: "BUF",
    primetime: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeCloseGames — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeCloseGames([]);
    expect(r.stats.totalGames).toBe(0);
    expect(r.stats.gamesAt3Pts).toBe(0);
    expect(r.stats.gamesAt7Pts).toBe(0);
    expect(r.stats.gamesAt10Pts).toBe(0);
  });
});

// ─── Close Game Thresholds ──────────────────────────────

describe("computeCloseGames — thresholds", () => {
  it("counts games within 3 points", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }), // 3-point
      makeGame({ homeScore: 25, awayScore: 23 }), // 2-point
      makeGame({ homeScore: 20, awayScore: 19 }), // 1-point
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt3Pts).toBe(3);
  });

  it("counts games within 7 points", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 20 }), // 4-point
      makeGame({ homeScore: 25, awayScore: 19 }), // 6-point
      makeGame({ homeScore: 27, awayScore: 20 }), // 7-point
      makeGame({ homeScore: 35, awayScore: 14 }), // 21-point (excluded)
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt7Pts).toBe(3);
  });

  it("counts games within 10 points", () => {
    const games = [
      makeGame({ homeScore: 28, awayScore: 20 }), // 8-point
      makeGame({ homeScore: 29, awayScore: 20 }), // 9-point
      makeGame({ homeScore: 30, awayScore: 20 }), // 10-point
      makeGame({ homeScore: 31, awayScore: 20 }), // 11-point (excluded)
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt10Pts).toBe(3);
  });

  it("ignores ties", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 24 }),
      makeGame({ homeScore: 20, awayScore: 19 }),
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt3Pts).toBe(1);
  });
});

// ─── Close Game Rates ────────────────────────────────────

describe("computeCloseGames — close game rates", () => {
  it("computes rate at 3 points", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }), // close
      makeGame({ homeScore: 35, awayScore: 10 }), // not close
      makeGame({ homeScore: 35, awayScore: 10 }), // not close
    ];
    const r = computeCloseGames(games);
    // 1 close game / 3 total = .333
    expect(parseFloat(r.stats.closeGameRateAt3Pts)).toBeCloseTo(0.333, 2);
  });

  it("computes rate at 7 points", () => {
    const games = [
      makeGame({ homeScore: 25, awayScore: 20 }), // close
      makeGame({ homeScore: 26, awayScore: 21 }), // close
      makeGame({ homeScore: 35, awayScore: 10 }), // not close
    ];
    const r = computeCloseGames(games);
    // 2 close games / 3 total ≈ .667
    expect(parseFloat(r.stats.closeGameRateAt7Pts)).toBeCloseTo(0.667, 2);
  });
});

// ─── Clutch Teams ───────────────────────────────────────

describe("computeCloseGames — best/worst clutch teams", () => {
  it("tracks team records in close games", () => {
    const games = [
      makeGame({ homeTeamName: "Kansas City Chiefs", homeScore: 24, awayScore: 21 }), // 3 pt, home win
      makeGame({ homeTeamName: "Kansas City Chiefs", homeScore: 25, awayScore: 23 }), // 2 pt, home win
      makeGame({ awayTeamName: "Kansas City Chiefs", homeScore: 20, awayScore: 24 }), // 4 pt, away win
    ];
    const r = computeCloseGames(games);
    const chiefs = r.stats.bestClutchTeams.find((t) => t.team === "Kansas City Chiefs");
    expect(chiefs?.gamesAt3Pts).toBe(2); // Only first 2 games are ≤3 pts
    expect(chiefs?.winsAt3Pts).toBe(2);
  });

  it("limits best clutch teams to 10", () => {
    const games = Array.from({ length: 15 }, (_, i) =>
      makeGame({
        season: 2024,
        week: String(i + 1),
        homeTeamName: `Team ${i % 12}`,
        awayTeamName: `Team ${(i + 1) % 12}`,
        homeScore: 24,
        awayScore: 21,
      })
    );
    const r = computeCloseGames(games);
    expect(r.stats.bestClutchTeams.length).toBeLessThanOrEqual(10);
  });

  it("sorts by close game win rate", () => {
    const games = [
      // Perfect team
      makeGame({ homeTeamName: "Team A", homeScore: 24, awayScore: 21 }),
      // Terrible team
      makeGame({ awayTeamName: "Team B", homeScore: 24, awayScore: 21 }),
    ];
    const r = computeCloseGames(games);
    if (r.stats.bestClutchTeams.length > 0) {
      expect(r.stats.bestClutchTeams[0].team).toBe("Team A");
    }
  });

  it("includes worst clutch teams", () => {
    const games = [
      makeGame({ homeTeamName: "Good Team", homeScore: 24, awayScore: 21 }),
      makeGame({ awayTeamName: "Bad Team", homeScore: 24, awayScore: 21 }),
    ];
    const r = computeCloseGames(games);
    expect(r.stats.worstClutchTeams.length).toBeGreaterThan(0);
  });
});

// ─── Primetime Close Games ──────────────────────────────

describe("computeCloseGames — primetime", () => {
  it("counts primetime close games", () => {
    const games = [
      makeGame({ primetime: true, homeScore: 24, awayScore: 21 }),
      makeGame({ primetime: true, homeScore: 35, awayScore: 10 }),
      makeGame({ primetime: false, homeScore: 24, awayScore: 21 }),
    ];
    const r = computeCloseGames(games);
    // 1 primetime close game (3-point)
    expect(r.stats.primetimeCloseGames).toBe(1);
  });

  it("computes primetime close game rate", () => {
    const games = [
      makeGame({ primetime: true, homeScore: 24, awayScore: 21 }),
      makeGame({ primetime: true, homeScore: 35, awayScore: 10 }),
    ];
    const r = computeCloseGames(games);
    // 1 close / 2 primetime = .500
    expect(parseFloat(r.stats.primetimeCloseGameRate)).toBe(0.5);
  });

  it("returns .000 if no primetime games", () => {
    const games = [
      makeGame({ primetime: false, homeScore: 24, awayScore: 21 }),
    ];
    const r = computeCloseGames(games);
    expect(r.stats.primetimeCloseGameRate).toBe(".000");
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeCloseGames — edge cases", () => {
  it("handles single game", () => {
    const games = [makeGame({ homeScore: 24, awayScore: 21 })];
    const r = computeCloseGames(games);
    expect(r.stats.totalGames).toBe(1);
    expect(r.stats.gamesAt3Pts).toBe(1);
  });

  it("handles boundary values", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }), // exactly 3
      makeGame({ homeScore: 27, awayScore: 20 }), // exactly 7
      makeGame({ homeScore: 30, awayScore: 20 }), // exactly 10
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt3Pts).toBe(1);
    expect(r.stats.gamesAt7Pts).toBe(2);
    expect(r.stats.gamesAt10Pts).toBe(3);
  });

  it("handles all blowouts", () => {
    const games = [
      makeGame({ homeScore: 45, awayScore: 10 }),
      makeGame({ homeScore: 38, awayScore: 7 }),
    ];
    const r = computeCloseGames(games);
    expect(r.stats.gamesAt3Pts).toBe(0);
    expect(r.stats.gamesAt7Pts).toBe(0);
    expect(r.stats.gamesAt10Pts).toBe(0);
  });

  it("tracks clutch records across all thresholds", () => {
    const games = [
      makeGame({ homeTeamName: "Team X", homeScore: 24, awayScore: 21 }),
    ];
    const r = computeCloseGames(games);
    const teamX = r.stats.bestClutchTeams.find((t) => t.team === "Team X");
    expect(teamX?.gamesAt3Pts).toBe(1);
    expect(teamX?.gamesAt7Pts).toBe(1);
    expect(teamX?.gamesAt10Pts).toBe(1);
  });
});
