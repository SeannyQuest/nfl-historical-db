import { describe, it, expect } from "vitest";
import {
  computeOvertimeAnalysis,
  type OTGame,
} from "@/lib/overtime-analysis";

function makeGame(overrides: Partial<OTGame> = {}): OTGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 24,
    isOvertime: false,
    isPlayoff: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeOvertimeAnalysis — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeOvertimeAnalysis([]);
    expect(r.totalOTGames).toBe(0);
    expect(r.otPct).toBe(0);
    expect(r.homeWinPctInOT).toBe(0);
    expect(r.avgOTScore).toBe(0);
    expect(r.teamOTRecords).toHaveLength(0);
    expect(r.seasonOTTrends).toHaveLength(0);
    expect(r.playoffOT.games).toBe(0);
  });

  it("ignores non-OT games", () => {
    const games = [
      makeGame({ isOvertime: false }),
      makeGame({ isOvertime: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.totalOTGames).toBe(0);
  });
});

// ─── OT Count and Percentage ────────────────────────────

describe("computeOvertimeAnalysis — OT count and percentage", () => {
  it("counts total OT games", () => {
    const games = [
      makeGame({ isOvertime: true }),
      makeGame({ isOvertime: true }),
      makeGame({ isOvertime: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.totalOTGames).toBe(2);
  });

  it("computes OT percentage", () => {
    const games = [
      makeGame({ isOvertime: true }),
      makeGame({ isOvertime: false }),
      makeGame({ isOvertime: false }),
      makeGame({ isOvertime: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.otPct).toBe(0.25);
  });

  it("handles all OT games", () => {
    const games = [
      makeGame({ isOvertime: true }),
      makeGame({ isOvertime: true }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.otPct).toBe(1);
  });
});

// ─── Home Win % in OT ────────────────────────────────────

describe("computeOvertimeAnalysis — home win % in OT", () => {
  it("computes home OT win percentage", () => {
    const games = [
      makeGame({ isOvertime: true, homeScore: 27, awayScore: 24 }), // home win
      makeGame({ isOvertime: true, homeScore: 20, awayScore: 24 }), // away win
      makeGame({ isOvertime: true, homeScore: 30, awayScore: 28 }), // home win
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.homeWinPctInOT).toBe(Math.round((2 / 3) * 10000) / 10000); // 0.6667
  });

  it("counts zero home wins", () => {
    const games = [
      makeGame({ isOvertime: true, homeScore: 20, awayScore: 24 }),
      makeGame({ isOvertime: true, homeScore: 18, awayScore: 28 }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.homeWinPctInOT).toBe(0);
  });
});

// ─── Average OT Score ───────────────────────────────────

describe("computeOvertimeAnalysis — average OT score", () => {
  it("computes avg combined OT score", () => {
    const games = [
      makeGame({ isOvertime: true, homeScore: 27, awayScore: 24 }), // 51
      makeGame({ isOvertime: true, homeScore: 30, awayScore: 28 }), // 58
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.avgOTScore).toBe(54.5); // (51 + 58) / 2
  });

  it("ignores non-OT games in score calculation", () => {
    const games = [
      makeGame({ isOvertime: true, homeScore: 27, awayScore: 24 }), // 51
      makeGame({ isOvertime: false, homeScore: 100, awayScore: 100 }), // ignore
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.avgOTScore).toBe(51);
  });
});

// ─── Team OT Records ────────────────────────────────────

describe("computeOvertimeAnalysis — team OT records", () => {
  it("counts home team OT wins and losses", () => {
    const games = [
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 24,
      }), // Packers win
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Vikings",
        homeScore: 20,
        awayScore: 24,
      }), // Packers loss
    ];
    const r = computeOvertimeAnalysis(games);
    const packers = r.teamOTRecords.find((x) => x.team === "Packers");
    expect(packers?.otWins).toBe(1);
    expect(packers?.otLosses).toBe(1);
  });

  it("counts away team OT wins and losses", () => {
    const games = [
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 27,
      }), // Bears win
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 24,
      }), // Bears loss
    ];
    const r = computeOvertimeAnalysis(games);
    const bears = r.teamOTRecords.find((x) => x.team === "Bears");
    expect(bears?.otWins).toBe(1);
    expect(bears?.otLosses).toBe(1);
  });

  it("computes OT win percentage", () => {
    const games = [
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 24,
      }), // Packers win
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 24,
      }), // Packers win
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 20,
        awayScore: 24,
      }), // Packers loss
    ];
    const r = computeOvertimeAnalysis(games);
    const packers = r.teamOTRecords.find((x) => x.team === "Packers");
    expect(packers?.otWinPct).toBe(Math.round((2 / 3) * 10000) / 10000); // 0.6667
  });

  it("sorts by OT win pct descending", () => {
    const games = [
      makeGame({
        isOvertime: true,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 24,
      }),
      makeGame({
        isOvertime: true,
        homeTeamName: "Bears",
        awayTeamName: "Lions",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.teamOTRecords[0].otWinPct).toBeGreaterThanOrEqual(
      r.teamOTRecords[1].otWinPct
    );
  });
});

// ─── Season OT Trends ────────────────────────────────────

describe("computeOvertimeAnalysis — season OT trends", () => {
  it("groups OT games by season", () => {
    const games = [
      makeGame({ season: 2024, isOvertime: true }),
      makeGame({ season: 2024, isOvertime: false }),
      makeGame({ season: 2023, isOvertime: true }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.seasonOTTrends).toHaveLength(2);
  });

  it("counts OT games per season", () => {
    const games = [
      makeGame({ season: 2024, isOvertime: true }),
      makeGame({ season: 2024, isOvertime: true }),
      makeGame({ season: 2024, isOvertime: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    const s2024 = r.seasonOTTrends.find((x) => x.season === 2024);
    expect(s2024?.otGames).toBe(2);
  });

  it("computes OT % per season", () => {
    const games = [
      makeGame({ season: 2024, isOvertime: true }),
      makeGame({ season: 2024, isOvertime: false }),
      makeGame({ season: 2024, isOvertime: false }),
      makeGame({ season: 2024, isOvertime: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    const s2024 = r.seasonOTTrends.find((x) => x.season === 2024);
    expect(s2024?.otPct).toBe(0.25);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ season: 2020, isOvertime: true }),
      makeGame({ season: 2024, isOvertime: true }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.seasonOTTrends[0].season).toBe(2024);
    expect(r.seasonOTTrends[1].season).toBe(2020);
  });
});

// ─── Playoff OT ──────────────────────────────────────────

describe("computeOvertimeAnalysis — playoff OT", () => {
  it("counts playoff OT games", () => {
    const games = [
      makeGame({ isOvertime: true, isPlayoff: true }),
      makeGame({ isOvertime: true, isPlayoff: true }),
      makeGame({ isOvertime: true, isPlayoff: false }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.playoffOT.games).toBe(2);
  });

  it("computes home win % in playoff OT", () => {
    const games = [
      makeGame({
        isOvertime: true,
        isPlayoff: true,
        homeScore: 27,
        awayScore: 24,
      }), // home win
      makeGame({
        isOvertime: true,
        isPlayoff: true,
        homeScore: 20,
        awayScore: 24,
      }), // away win
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.playoffOT.homeWinPct).toBe(0.5);
  });

  it("ignores regular season OT in playoff stats", () => {
    const games = [
      makeGame({
        isOvertime: true,
        isPlayoff: true,
        homeScore: 27,
        awayScore: 24,
      }),
      makeGame({
        isOvertime: true,
        isPlayoff: false,
        homeScore: 20,
        awayScore: 27,
      }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.playoffOT.games).toBe(1);
    expect(r.playoffOT.homeWinPct).toBe(1);
  });
});

// ─── Comprehensive ──────────────────────────────────────

describe("computeOvertimeAnalysis — comprehensive", () => {
  it("handles mixed regular and playoff OT games", () => {
    const games = [
      makeGame({
        season: 2024,
        isOvertime: true,
        isPlayoff: false,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 24,
      }),
      makeGame({
        season: 2024,
        isOvertime: true,
        isPlayoff: true,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 27,
      }),
      makeGame({
        season: 2023,
        isOvertime: true,
        isPlayoff: false,
        homeTeamName: "Bears",
        homeScore: 30,
        awayScore: 28,
      }),
    ];
    const r = computeOvertimeAnalysis(games);
    expect(r.totalOTGames).toBe(3);
    expect(r.playoffOT.games).toBe(1);
    expect(r.seasonOTTrends).toHaveLength(2);
    expect(r.teamOTRecords.length).toBeGreaterThan(0);
  });
});
