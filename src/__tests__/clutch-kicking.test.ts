import { describe, it, expect } from "vitest";
import {
  computeClutchKicking,
  type ClutchGame,
} from "@/lib/clutch-kicking";

function makeGame(overrides: Partial<ClutchGame> = {}): ClutchGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 24,
    awayScore: 17,
    ...overrides,
  };
}

// ─── Empty ───────────────────────────────────────────────

describe("computeClutchKicking — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeClutchKicking([]);
    expect(r.fieldGoalRangeGames.count).toBe(0);
    expect(r.fieldGoalRangeGames.pctOfAll).toBe(0);
    expect(r.fieldGoalRangeGames.homeWinPct).toBe(0);
    expect(r.teamClutchRecords).toHaveLength(0);
    expect(r.bestClutchTeams).toHaveLength(0);
    expect(r.worstClutchTeams).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

// ─── Field Goal Range Detection ──────────────────────────

describe("computeClutchKicking — field goal range detection", () => {
  it("identifies games within 3 points", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }), // +3, in range
      makeGame({ homeScore: 24, awayScore: 22 }), // +2, in range
      makeGame({ homeScore: 24, awayScore: 23 }), // +1, in range
      makeGame({ homeScore: 24, awayScore: 24 }), // 0, in range
      makeGame({ homeScore: 27, awayScore: 24 }), // +3, in range
      makeGame({ homeScore: 28, awayScore: 24 }), // +4, out of range
      makeGame({ homeScore: 20, awayScore: 24 }), // -4, out of range
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(5);
  });

  it("computes percentage of all games", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }),
      makeGame({ homeScore: 24, awayScore: 21 }),
      makeGame({ homeScore: 28, awayScore: 20 }),
      makeGame({ homeScore: 28, awayScore: 20 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(2);
    expect(r.fieldGoalRangeGames.pctOfAll).toBe(0.5);
  });

  it("handles all close games", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }),
      makeGame({ homeScore: 27, awayScore: 24 }),
      makeGame({ homeScore: 20, awayScore: 20 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.pctOfAll).toBe(1);
  });

  it("handles no close games", () => {
    const games = [
      makeGame({ homeScore: 35, awayScore: 10 }),
      makeGame({ homeScore: 30, awayScore: 10 }),
      makeGame({ homeScore: 42, awayScore: 14 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(0);
    expect(r.fieldGoalRangeGamesPct).toBeUndefined();
  });
});

// ─── Home Win % in Close Games ──────────────────────────

describe("computeClutchKicking — home win % in close games", () => {
  it("computes home win percentage in FG range games", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }), // home wins (3pt)
      makeGame({ homeScore: 27, awayScore: 24 }), // home wins (3pt)
      makeGame({ homeScore: 21, awayScore: 24 }), // away wins (3pt)
      makeGame({ homeScore: 22, awayScore: 24 }), // away wins (2pt)
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(4);
    expect(r.fieldGoalRangeGames.homeWinPct).toBe(0.5);
  });

  it("counts all home wins", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }),
      makeGame({ homeScore: 27, awayScore: 24 }),
      makeGame({ homeScore: 28, awayScore: 25 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.homeWinPct).toBe(1);
  });

  it("counts no home wins", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 24 }),
      makeGame({ homeScore: 24, awayScore: 27 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.homeWinPct).toBe(0);
  });
});

// ─── Team Clutch Records ────────────────────────────────

describe("computeClutchKicking — team clutch records", () => {
  it("counts team close game wins and losses", () => {
    const games = [
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 21,
      }), // Packers win, 3pt
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 21,
        awayScore: 24,
      }), // Packers loss, 3pt
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Packers",
        homeScore: 28,
        awayScore: 31,
      }), // Packers win, 3pt
    ];
    const r = computeClutchKicking(games);
    const packers = r.teamClutchRecords.find((t) => t.team === "Packers");
    expect(packers?.fgRangeWins).toBe(2);
    expect(packers?.fgRangeLosses).toBe(1);
  });

  it("computes close game win percentage", () => {
    const games = [
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Packers",
        homeScore: 28,
        awayScore: 25,
      }),
    ];
    const r = computeClutchKicking(games);
    const packers = r.teamClutchRecords.find((t) => t.team === "Packers");
    expect(packers?.fgRangeWinPct).toBe(Math.round((2 / 3) * 10000) / 10000);
  });

  it("counts total close games", () => {
    const games = [
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 21,
      }),
    ];
    const r = computeClutchKicking(games);
    const packers = r.teamClutchRecords.find((t) => t.team === "Packers");
    expect(packers?.totalCloseGames).toBe(2);
  });

  it("sorts by win percentage descending", () => {
    const games = [
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Packers",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        homeTeamName: "Bears",
        awayTeamName: "Lions",
        homeScore: 23,
        awayScore: 20,
      }),
    ];
    const r = computeClutchKicking(games);
    for (let i = 0; i < r.teamClutchRecords.length - 1; i++) {
      expect(r.teamClutchRecords[i].fgRangeWinPct).toBeGreaterThanOrEqual(
        r.teamClutchRecords[i + 1].fgRangeWinPct
      );
    }
  });
});

// ─── Best/Worst Clutch Teams ────────────────────────────

describe("computeClutchKicking — best clutch teams", () => {
  it("returns teams with min 3 close games", () => {
    const games = [
      // Packers: 3 close games, perfect record
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Lions",
        awayTeamName: "Packers",
        homeScore: 28,
        awayScore: 31,
      }),
      // Bears: 2 close games (filtered out)
      makeGame({
        homeTeamName: "Bears",
        awayTeamName: "Lions",
        homeScore: 23,
        awayScore: 20,
      }),
    ];
    const r = computeClutchKicking(games);
    expect(r.bestClutchTeams.length).toBeGreaterThan(0);
    for (const team of r.bestClutchTeams) {
      expect(team.totalCloseGames).toBeGreaterThanOrEqual(3);
    }
  });

  it("returns max 10 best teams", () => {
    const games: ClutchGame[] = [];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 3; j++) {
        games.push(
          makeGame({
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 12}`,
            homeScore: 24,
            awayScore: 21,
          })
        );
      }
    }
    const r = computeClutchKicking(games);
    expect(r.bestClutchTeams.length).toBeLessThanOrEqual(10);
  });

  it("sorts by win percentage descending", () => {
    const games: ClutchGame[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        games.push(
          makeGame({
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 5}`,
            homeScore: 24,
            awayScore: 21,
          })
        );
      }
    }
    const r = computeClutchKicking(games);
    for (let i = 0; i < r.bestClutchTeams.length - 1; i++) {
      expect(r.bestClutchTeams[i].fgRangeWinPct).toBeGreaterThanOrEqual(
        r.bestClutchTeams[i + 1].fgRangeWinPct
      );
    }
  });
});

describe("computeClutchKicking — worst clutch teams", () => {
  it("returns teams with min 3 close games", () => {
    const games: ClutchGame[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        games.push(
          makeGame({
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 5}`,
            homeScore: 24,
            awayScore: 21,
          })
        );
      }
    }
    const r = computeClutchKicking(games);
    for (const team of r.worstClutchTeams) {
      expect(team.totalCloseGames).toBeGreaterThanOrEqual(3);
    }
  });

  it("returns max 10 worst teams", () => {
    const games: ClutchGame[] = [];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 3; j++) {
        games.push(
          makeGame({
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 12}`,
            homeScore: 24,
            awayScore: 21,
          })
        );
      }
    }
    const r = computeClutchKicking(games);
    expect(r.worstClutchTeams.length).toBeLessThanOrEqual(10);
  });

  it("sorts by win percentage ascending (worst first)", () => {
    const games: ClutchGame[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        games.push(
          makeGame({
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 5}`,
            homeScore: 24,
            awayScore: 21,
          })
        );
      }
    }
    const r = computeClutchKicking(games);
    for (let i = 0; i < r.worstClutchTeams.length - 1; i++) {
      expect(r.worstClutchTeams[i].fgRangeWinPct).toBeLessThanOrEqual(
        r.worstClutchTeams[i + 1].fgRangeWinPct
      );
    }
  });
});

// ─── Season Trends ──────────────────────────────────────

describe("computeClutchKicking — season trends", () => {
  it("groups close games by season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2023, homeScore: 24, awayScore: 21 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.seasonTrends).toHaveLength(2);
  });

  it("computes close game percentage per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, homeScore: 28, awayScore: 20 }),
      makeGame({ season: 2024, homeScore: 28, awayScore: 20 }),
    ];
    const r = computeClutchKicking(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.fgRangeGamePct).toBe(0.5);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ season: 2020, homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, homeScore: 24, awayScore: 21 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.seasonTrends[0].season).toBe(2024);
    expect(r.seasonTrends[1].season).toBe(2020);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeClutchKicking — edge cases", () => {
  it("handles single close game", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 21 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(1);
  });

  it("handles ties in close games", () => {
    const games = [
      makeGame({ homeScore: 24, awayScore: 24 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(1);
  });

  it("handles exactly 3-point margins", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 24 }),
      makeGame({ homeScore: 24, awayScore: 27 }),
    ];
    const r = computeClutchKicking(games);
    expect(r.fieldGoalRangeGames.count).toBe(2);
  });
});
