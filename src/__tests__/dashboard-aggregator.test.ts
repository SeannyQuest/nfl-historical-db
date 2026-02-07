import { describe, it, expect } from "vitest";
import {
  computeDashboardData,
  type DashboardGame,
} from "@/lib/dashboard-aggregator";

function makeGame(overrides: Partial<DashboardGame> = {}): DashboardGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    isPlayoff: false,
    primetime: false,
    homeConference: "NFC",
    awayConference: "NFC",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeDashboardData — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeDashboardData([]);
    expect(r.totalGames).toBe(0);
    expect(r.totalSeasons).toBe(0);
    expect(r.playoffGames).toBe(0);
    expect(r.primetimeGames).toBe(0);
    expect(r.topTeamsByWins).toHaveLength(0);
    expect(r.seasonHighlights).toHaveLength(0);
  });
});

// ─── Total Games ─────────────────────────────────────────

describe("computeDashboardData — total games", () => {
  it("counts all games", () => {
    const games = [
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2024, week: "2" }),
      makeGame({ season: 2023, week: "1" }),
    ];
    const r = computeDashboardData(games);
    expect(r.totalGames).toBe(3);
  });

  it("counts single game", () => {
    const games = [makeGame()];
    const r = computeDashboardData(games);
    expect(r.totalGames).toBe(1);
  });
});

// ─── Total Seasons ───────────────────────────────────────

describe("computeDashboardData — total seasons", () => {
  it("counts unique seasons", () => {
    const games = [
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2024, week: "2" }),
      makeGame({ season: 2023, week: "1" }),
      makeGame({ season: 2022, week: "1" }),
    ];
    const r = computeDashboardData(games);
    expect(r.totalSeasons).toBe(3);
  });

  it("handles single season", () => {
    const games = [
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2024, week: "2" }),
    ];
    const r = computeDashboardData(games);
    expect(r.totalSeasons).toBe(1);
  });
});

// ─── Average Points Per Game ─────────────────────────────

describe("computeDashboardData — avg points", () => {
  it("computes average points per team per game", () => {
    const games = [
      makeGame({
        homeScore: 28,
        awayScore: 24,
      }),
      makeGame({
        homeScore: 32,
        awayScore: 28,
      }),
    ];
    const r = computeDashboardData(games);
    // Total: 28+24+32+28 = 112, per team: 112/4 = 28.0
    expect(r.avgPointsPerGame).toBe("28.0");
  });

  it("handles different scoring", () => {
    const games = [
      makeGame({ homeScore: 14, awayScore: 10 }),
      makeGame({ homeScore: 42, awayScore: 38 }),
    ];
    const r = computeDashboardData(games);
    // Total: 14+10+42+38 = 104, per team: 104/4 = 26.0
    expect(r.avgPointsPerGame).toBe("26.0");
  });
});

// ─── Home Win Percentage ─────────────────────────────────

describe("computeDashboardData — home win pct", () => {
  it("computes home win percentage", () => {
    const games = [
      makeGame({ homeScore: 28, awayScore: 24 }), // home win
      makeGame({ homeScore: 20, awayScore: 25 }), // away win
    ];
    const r = computeDashboardData(games);
    // 1 home win out of 2 games = 0.500
    expect(r.homeWinPct).toBe("0.500");
  });

  it("handles all home wins", () => {
    const games = [
      makeGame({ homeScore: 28, awayScore: 24 }),
      makeGame({ homeScore: 31, awayScore: 20 }),
      makeGame({ homeScore: 25, awayScore: 22 }),
    ];
    const r = computeDashboardData(games);
    expect(r.homeWinPct).toBe("1.000");
  });

  it("handles no home wins", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 24 }),
      makeGame({ homeScore: 17, awayScore: 31 }),
    ];
    const r = computeDashboardData(games);
    expect(r.homeWinPct).toBe("0.000");
  });
});

// ─── Playoff Games ───────────────────────────────────────

describe("computeDashboardData — playoff games", () => {
  it("counts playoff games", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({ season: 2024, week: "19", isPlayoff: true }),
      makeGame({ season: 2024, week: "20", isPlayoff: true }),
    ];
    const r = computeDashboardData(games);
    expect(r.playoffGames).toBe(2);
  });

  it("handles no playoff games", () => {
    const games = [
      makeGame({ isPlayoff: false }),
      makeGame({ isPlayoff: false }),
    ];
    const r = computeDashboardData(games);
    expect(r.playoffGames).toBe(0);
  });
});

// ─── Primetime Games ─────────────────────────────────────

describe("computeDashboardData — primetime games", () => {
  it("counts primetime games", () => {
    const games = [
      makeGame({ primetime: false }),
      makeGame({ primetime: true }),
      makeGame({ primetime: true }),
    ];
    const r = computeDashboardData(games);
    expect(r.primetimeGames).toBe(2);
  });

  it("handles no primetime games", () => {
    const games = [
      makeGame({ primetime: false }),
      makeGame({ primetime: false }),
    ];
    const r = computeDashboardData(games);
    expect(r.primetimeGames).toBe(0);
  });
});

// ─── Top Teams by Wins ───────────────────────────────────

describe("computeDashboardData — top teams", () => {
  it("identifies top teams by wins", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        homeScore: 28,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Team B",
        awayTeamName: "Team C",
        homeScore: 24,
        awayScore: 25,
      }),
    ];
    const r = computeDashboardData(games);
    const topTeam = r.topTeamsByWins[0];
    expect(topTeam.team).toBe("Team A");
    expect(topTeam.wins).toBe(2);
  });

  it("limits top teams to 10", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          homeTeamName: `Team ${i}`,
          awayTeamName: "Team Loser",
          homeScore: 27,
          awayScore: 20,
        })
      );
    }
    const r = computeDashboardData(games);
    expect(r.topTeamsByWins.length).toBeLessThanOrEqual(10);
  });

  it("sorts teams by wins descending", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        homeScore: 28,
        awayScore: 21,
      }),
      makeGame({
        homeTeamName: "Team D",
        awayTeamName: "Team E",
        homeScore: 31,
        awayScore: 20,
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.topTeamsByWins[0].wins).toBeGreaterThanOrEqual(
      r.topTeamsByWins[1].wins
    );
  });
});

// ─── Season Highlights ───────────────────────────────────

describe("computeDashboardData — season highlights", () => {
  it("includes stats for each season", () => {
    const games = [
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2024, week: "2" }),
      makeGame({ season: 2023, week: "1" }),
    ];
    const r = computeDashboardData(games);
    expect(r.seasonHighlights.length).toBe(2);
  });

  it("includes total games in season", () => {
    const games = [
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2024, week: "2" }),
      makeGame({ season: 2024, week: "3" }),
    ];
    const r = computeDashboardData(games);
    expect(r.seasonHighlights[0].totalGames).toBe(3);
  });

  it("computes season average points", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeScore: 28, awayScore: 24 }),
      makeGame({ season: 2024, week: "2", homeScore: 32, awayScore: 28 }),
    ];
    const r = computeDashboardData(games);
    // Total: 28+24+32+28 = 112, per team: 28.0
    expect(r.seasonHighlights[0].avgPts).toBe("28.0");
  });

  it("computes season home win percentage", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeScore: 28, awayScore: 24 }), // home win
      makeGame({ season: 2024, week: "2", homeScore: 20, awayScore: 25 }), // away win
    ];
    const r = computeDashboardData(games);
    // 1 home win out of 2 = 0.500
    expect(r.seasonHighlights[0].homeWinPct).toBe("0.500");
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ season: 2022, week: "1" }),
      makeGame({ season: 2024, week: "1" }),
      makeGame({ season: 2023, week: "1" }),
    ];
    const r = computeDashboardData(games);
    expect(r.seasonHighlights[0].season).toBe(2024);
    expect(r.seasonHighlights[1].season).toBe(2023);
    expect(r.seasonHighlights[2].season).toBe(2022);
  });
});

// ─── Conference Balance ──────────────────────────────────

describe("computeDashboardData — conference balance", () => {
  it("tracks AFC wins and losses", () => {
    const games = [
      makeGame({
        homeTeamName: "AFC Team",
        awayTeamName: "NFC Team",
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.conferenceBalance.afc.wins).toBe(1);
    expect(r.conferenceBalance.afc.losses).toBe(0);
  });

  it("tracks NFC wins and losses", () => {
    const games = [
      makeGame({
        homeTeamName: "AFC Team",
        awayTeamName: "NFC Team",
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 27,
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.conferenceBalance.nfc.wins).toBe(1);
    expect(r.conferenceBalance.nfc.losses).toBe(0);
  });

  it("computes conference record across multiple games", () => {
    const games = [
      makeGame({
        homeTeamName: "AFC Team 1",
        awayTeamName: "NFC Team 1",
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "AFC Team 2",
        awayTeamName: "NFC Team 2",
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 25,
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.conferenceBalance.afc.wins).toBe(1);
    expect(r.conferenceBalance.afc.losses).toBe(1);
  });

  it("handles zero conference games", () => {
    const games = [makeGame()];
    const r = computeDashboardData(games);
    // NFC vs NFC, so no cross-conference game
    expect(r.conferenceBalance.afc.wins + r.conferenceBalance.afc.losses).toBe(0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeDashboardData — edge cases", () => {
  it("handles single game with all stats", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "19",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 35,
        awayScore: 31,
        isPlayoff: true,
        primetime: true,
        homeConference: "AFC",
        awayConference: "NFC",
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.totalGames).toBe(1);
    expect(r.playoffGames).toBe(1);
    expect(r.primetimeGames).toBe(1);
    expect(r.topTeamsByWins.length).toBe(2); // both teams tracked
  });

  it("handles large dataset", () => {
    const games = [];
    for (let i = 0; i < 1000; i++) {
      games.push(
        makeGame({
          season: 2020 + Math.floor(i / 256),
          homeTeamName: `Team ${i % 32}`,
          awayTeamName: `Team ${(i + 1) % 32}`,
          homeScore: Math.floor(Math.random() * 40),
          awayScore: Math.floor(Math.random() * 40),
        })
      );
    }
    const r = computeDashboardData(games);
    expect(r.totalGames).toBe(1000);
    expect(r.totalSeasons).toBeGreaterThan(0);
    expect(r.topTeamsByWins.length).toBeLessThanOrEqual(10);
  });

  it("handles mixed conference intra-divisional games", () => {
    const games = [
      makeGame({
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeConference: "NFC",
        awayConference: "NFC",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeConference: "AFC",
        awayConference: "AFC",
        homeScore: 24,
        awayScore: 22,
      }),
    ];
    const r = computeDashboardData(games);
    expect(r.totalGames).toBe(2);
    // Intra-conference games still count toward conference balance
    expect(r.conferenceBalance.afc.wins + r.conferenceBalance.afc.losses).toBe(2);
    expect(r.conferenceBalance.nfc.wins + r.conferenceBalance.nfc.losses).toBe(2);
  });
});
