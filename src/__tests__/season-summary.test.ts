import { describe, it, expect } from "vitest";
import {
  computeSeasonSummary,
  type SummaryGame,
} from "@/lib/season-summary";

function makeGame(overrides: Partial<SummaryGame> = {}): SummaryGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    isPlayoff: false,
    homeConference: "NFC",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeSeasonSummary — empty", () => {
  it("returns defaults for no games", () => {
    const r = computeSeasonSummary([], 2024);
    expect(r.champion).toBe("Unknown");
    expect(r.totalGames).toBe(0);
    expect(r.playoffTeams).toHaveLength(0);
  });

  it("returns defaults for missing season", () => {
    const games = [makeGame({ season: 2023 })];
    const r = computeSeasonSummary(games, 2024);
    expect(r.totalGames).toBe(0);
    expect(r.champion).toBe("Unknown");
  });
});

// ─── Champion Detection ──────────────────────────────────

describe("computeSeasonSummary — champion", () => {
  it("identifies Super Bowl winner as champion", () => {
    const games = [
      // Regular season game
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Denver Broncos",
        homeScore: 24,
        awayScore: 20,
        isPlayoff: false,
      }),
      // Playoff game (championship)
      makeGame({
        season: 2024,
        week: "21",
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "San Francisco 49ers",
        homeScore: 25,
        awayScore: 22,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.champion).toBe("Kansas City Chiefs");
  });

  it("handles away team as champion", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "21",
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "San Francisco 49ers",
        homeScore: 19,
        awayScore: 25,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.champion).toBe("San Francisco 49ers");
  });

  it("uses last playoff game as championship", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "19",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 30,
        awayScore: 20,
        isPlayoff: true,
      }),
      makeGame({
        season: 2024,
        week: "20",
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeScore: 35,
        awayScore: 24,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.champion).toBe("Team C");
  });
});

// ─── Best and Worst Records ─────────────────────────────

describe("computeSeasonSummary — records", () => {
  it("identifies best regular season record", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Denver Broncos",
        homeScore: 24,
        awayScore: 20,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Detroit Lions",
        homeScore: 28,
        awayScore: 21,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "3",
        homeTeamName: "Denver Broncos",
        awayTeamName: "Las Vegas Raiders",
        homeScore: 17,
        awayScore: 10,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.bestRecord.team).toBe("Kansas City Chiefs");
    expect(r.bestRecord.wins).toBe(2);
  });

  it("identifies worst regular season record", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Cleveland Browns",
        awayTeamName: "Pittsburgh Steelers",
        homeScore: 10,
        awayScore: 20,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeTeamName: "Cleveland Browns",
        awayTeamName: "Baltimore Ravens",
        homeScore: 15,
        awayScore: 28,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "3",
        homeTeamName: "Dallas Cowboys",
        awayTeamName: "Philadelphia Eagles",
        homeScore: 28,
        awayScore: 23,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.worstRecord.team).toBe("Cleveland Browns");
    expect(r.worstRecord.wins).toBe(0);
  });

  it("includes losses in record", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Team X",
        awayTeamName: "Team Y",
        homeScore: 20,
        awayScore: 17,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeTeamName: "Team X",
        awayTeamName: "Team Z",
        homeScore: 15,
        awayScore: 18,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.bestRecord.losses).toBe(1);
  });
});

// ─── Highest Scoring Game ───────────────────────────────

describe("computeSeasonSummary — highest scoring", () => {
  it("finds highest scoring game", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeScore: 20,
        awayScore: 17,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeTeamName: "High Scoring Home",
        awayTeamName: "High Scoring Away",
        homeScore: 52,
        awayScore: 48,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.highestScoringGame.total).toBe(100);
    expect(r.highestScoringGame.homeTeam).toBe("High Scoring Home");
  });

  it("includes both regular season and playoff in search", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeScore: 28,
        awayScore: 24,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "21",
        homeTeamName: "Super Bowl Home",
        awayTeamName: "Super Bowl Away",
        homeScore: 35,
        awayScore: 33,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.highestScoringGame.total).toBe(68);
  });

  it("returns unknown for no games", () => {
    const r = computeSeasonSummary([], 2024);
    expect(r.highestScoringGame.homeTeam).toBe("Unknown");
  });
});

// ─── Average Points Per Game ─────────────────────────────

describe("computeSeasonSummary — avg points", () => {
  it("computes average points per team per game", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeScore: 28,
        awayScore: 24,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeScore: 32,
        awayScore: 28,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    // Total points: 28+24+32+28 = 112, games played: 4, avg: 28.0
    expect(r.avgPointsPerGame).toBe("28.0");
  });

  it("includes playoff games in average", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeScore: 30,
        awayScore: 20,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "21",
        homeScore: 40,
        awayScore: 35,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    // Total: 30+20+40+35 = 125, teams: 4, avg: 31.25
    expect(parseFloat(r.avgPointsPerGame)).toBeCloseTo(31.25, 0);
  });
});

// ─── Playoff Teams ───────────────────────────────────────

describe("computeSeasonSummary — playoff teams", () => {
  it("identifies all teams in playoff games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "19",
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        isPlayoff: true,
      }),
      makeGame({
        season: 2024,
        week: "20",
        homeTeamName: "Team D",
        awayTeamName: "Team A",
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.playoffTeams.length).toBe(3);
    expect(r.playoffTeams).toContain("Team A");
    expect(r.playoffTeams).toContain("Team D");
  });

  it("returns empty array for no playoff games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.playoffTeams).toHaveLength(0);
  });
});

// ─── Total Games ─────────────────────────────────────────

describe("computeSeasonSummary — total games", () => {
  it("counts all games including playoffs", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "19",
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.totalGames).toBe(3);
  });

  it("counts only specific season", () => {
    const games = [
      makeGame({ season: 2024, week: "1", isPlayoff: false }),
      makeGame({ season: 2024, week: "2", isPlayoff: false }),
      makeGame({ season: 2023, week: "1", isPlayoff: false }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.totalGames).toBe(2);
  });
});

// ─── Overtime Games ─────────────────────────────────────

describe("computeSeasonSummary — overtime", () => {
  it("returns zero for overtime games (not detectable)", () => {
    const games = [makeGame({ season: 2024, week: "1", isPlayoff: false })];
    const r = computeSeasonSummary(games, 2024);
    expect(r.overtimeGames).toBe(0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeSeasonSummary — edge cases", () => {
  it("handles single game season", () => {
    const games = [makeGame({ season: 2024, week: "1", isPlayoff: false })];
    const r = computeSeasonSummary(games, 2024);
    expect(r.totalGames).toBe(1);
    expect(r.bestRecord.wins).toBe(1);
  });

  it("handles ties in record selection", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "1",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 20,
        awayScore: 17,
        isPlayoff: false,
      }),
      makeGame({
        season: 2024,
        week: "2",
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeScore: 24,
        awayScore: 20,
        isPlayoff: false,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.bestRecord.wins).toBe(1);
  });

  it("handles only playoff games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: "19",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 30,
        awayScore: 20,
        isPlayoff: true,
      }),
      makeGame({
        season: 2024,
        week: "20",
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        homeScore: 35,
        awayScore: 24,
        isPlayoff: true,
      }),
    ];
    const r = computeSeasonSummary(games, 2024);
    expect(r.playoffTeams.length).toBe(3);
    expect(r.totalGames).toBe(2);
  });
});
