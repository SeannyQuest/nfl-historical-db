import { describe, it, expect } from "vitest";
import { computeTrends, type TrendGame } from "@/lib/trends";

function makeGame(overrides: Partial<TrendGame> = {}): TrendGame {
  return {
    season: 2024,
    homeScore: 27,
    awayScore: 20,
    isPlayoff: false,
    primetime: null,
    spreadResult: "COVERED",
    ouResult: "OVER",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeTrends — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeTrends([]);
    expect(r.totalGames).toBe(0);
    expect(r.totalSeasons).toBe(0);
    expect(r.overallAvgTotal).toBe("0.0");
    expect(r.overallHomeWinPct).toBe(".000");
    expect(r.overallOverPct).toBe(".000");
    expect(r.seasons).toHaveLength(0);
    expect(r.primetime).toHaveLength(0);
  });
});

// ─── Overall Stats ──────────────────────────────────────

describe("computeTrends — overall stats", () => {
  it("computes avg total", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 10 }), // 40
      makeGame({ homeScore: 20, awayScore: 24 }), // 44
    ];
    const r = computeTrends(games);
    expect(r.overallAvgTotal).toBe("42.0");
  });

  it("computes home win pct (excludes ties)", () => {
    const games = [
      makeGame({ homeScore: 27, awayScore: 20 }), // home win
      makeGame({ homeScore: 10, awayScore: 24 }), // away win
      makeGame({ homeScore: 20, awayScore: 20 }), // tie
    ];
    const r = computeTrends(games);
    // 1 home win / 2 decisions = 0.500
    expect(r.overallHomeWinPct).toBe("0.500");
  });

  it("computes over pct", () => {
    const games = [
      makeGame({ ouResult: "OVER" }),
      makeGame({ ouResult: "OVER" }),
      makeGame({ ouResult: "UNDER" }),
      makeGame({ ouResult: null }),
    ];
    const r = computeTrends(games);
    // 2 overs / 3 total (excludes null) = 0.667
    expect(r.overallOverPct).toBe("0.667");
  });

  it("tracks highest and lowest scoring games", () => {
    const games = [
      makeGame({ season: 2023, homeScore: 50, awayScore: 48 }), // 98
      makeGame({ season: 2024, homeScore: 3, awayScore: 0 }),   // 3
      makeGame({ season: 2022, homeScore: 20, awayScore: 17 }), // 37
    ];
    const r = computeTrends(games);
    expect(r.highestScoringGame).toEqual({ season: 2023, total: 98 });
    expect(r.lowestScoringGame).toEqual({ season: 2024, total: 3 });
  });

  it("counts total games and seasons", () => {
    const games = [
      makeGame({ season: 2024 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2023 }),
    ];
    const r = computeTrends(games);
    expect(r.totalGames).toBe(3);
    expect(r.totalSeasons).toBe(2);
  });
});

// ─── Season Breakdown ───────────────────────────────────

describe("computeTrends — season breakdown", () => {
  it("groups by season descending", () => {
    const games = [
      makeGame({ season: 2020 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeTrends(games);
    expect(r.seasons.map((s) => s.season)).toEqual([2024, 2022, 2020]);
  });

  it("computes per-season stats", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 28, awayScore: 14 }),
      makeGame({ season: 2024, homeScore: 10, awayScore: 24 }),
    ];
    const r = computeTrends(games);
    const s = r.seasons[0];
    expect(s.totalGames).toBe(2);
    expect(s.avgTotal).toBe("38.0"); // (42+34)/2
    expect(s.avgHomeScore).toBe("19.0");
    expect(s.avgAwayScore).toBe("19.0");
    expect(s.homeWins).toBe(1);
    expect(s.awayWins).toBe(1);
    expect(s.homeWinPct).toBe("0.500");
  });

  it("computes per-season O/U stats", () => {
    const games = [
      makeGame({ season: 2024, ouResult: "OVER" }),
      makeGame({ season: 2024, ouResult: "UNDER" }),
      makeGame({ season: 2024, ouResult: "PUSH" }),
    ];
    const r = computeTrends(games);
    const s = r.seasons[0];
    expect(s.overs).toBe(1);
    expect(s.unders).toBe(1);
    expect(s.ouPushes).toBe(1);
    expect(s.overPct).toBe("0.333");
  });

  it("computes per-season spread stats", () => {
    const games = [
      makeGame({ season: 2024, spreadResult: "COVERED" }),
      makeGame({ season: 2024, spreadResult: "COVERED" }),
      makeGame({ season: 2024, spreadResult: "LOST" }),
      makeGame({ season: 2024, spreadResult: null }),
    ];
    const r = computeTrends(games);
    const s = r.seasons[0];
    expect(s.homeCovered).toBe(2);
    expect(s.homeSpreadLost).toBe(1);
    expect(s.homeCoverPct).toBe("0.667");
  });
});

// ─── Primetime ──────────────────────────────────────────

describe("computeTrends — primetime", () => {
  it("groups by primetime slot", () => {
    const games = [
      makeGame({ primetime: "SNF" }),
      makeGame({ primetime: "MNF" }),
      makeGame({ primetime: "SNF" }),
      makeGame({ primetime: null }), // non-primetime
    ];
    const r = computeTrends(games);
    expect(r.primetime).toHaveLength(2);
    // SNF first (2 games), MNF second (1 game)
    expect(r.primetime[0].slot).toBe("SNF");
    expect(r.primetime[0].totalGames).toBe(2);
    expect(r.primetime[1].slot).toBe("MNF");
    expect(r.primetime[1].totalGames).toBe(1);
  });

  it("computes primetime avg total", () => {
    const games = [
      makeGame({ primetime: "SNF", homeScore: 30, awayScore: 20 }),
      makeGame({ primetime: "SNF", homeScore: 24, awayScore: 17 }),
    ];
    const r = computeTrends(games);
    expect(r.primetime[0].avgTotal).toBe("45.5");
  });

  it("computes primetime home win pct", () => {
    const games = [
      makeGame({ primetime: "MNF", homeScore: 28, awayScore: 14 }),
      makeGame({ primetime: "MNF", homeScore: 10, awayScore: 24 }),
      makeGame({ primetime: "MNF", homeScore: 31, awayScore: 17 }),
    ];
    const r = computeTrends(games);
    expect(r.primetime[0].homeWinPct).toBe("0.667");
  });

  it("computes primetime over pct", () => {
    const games = [
      makeGame({ primetime: "TNF", ouResult: "OVER" }),
      makeGame({ primetime: "TNF", ouResult: "UNDER" }),
    ];
    const r = computeTrends(games);
    expect(r.primetime[0].overPct).toBe("0.500");
  });

  it("excludes non-primetime games", () => {
    const games = [
      makeGame({ primetime: null }),
      makeGame({ primetime: null }),
    ];
    const r = computeTrends(games);
    expect(r.primetime).toHaveLength(0);
  });
});

// ─── Playoff vs Regular ─────────────────────────────────

describe("computeTrends — playoff vs regular", () => {
  it("splits stats by playoff and regular season", () => {
    const games = [
      makeGame({ isPlayoff: false, homeScore: 24, awayScore: 20 }), // regular, 44
      makeGame({ isPlayoff: false, homeScore: 10, awayScore: 30 }), // regular, 40
      makeGame({ isPlayoff: true, homeScore: 17, awayScore: 10 }),  // playoff, 27
    ];
    const r = computeTrends(games);
    expect(r.playoffVsRegular.regular.avgTotal).toBe("42.0");
    expect(r.playoffVsRegular.playoff.avgTotal).toBe("27.0");
  });

  it("computes regular home win pct", () => {
    const games = [
      makeGame({ isPlayoff: false, homeScore: 28, awayScore: 14 }), // home win
      makeGame({ isPlayoff: false, homeScore: 10, awayScore: 24 }), // away win
    ];
    const r = computeTrends(games);
    expect(r.playoffVsRegular.regular.homeWinPct).toBe("0.500");
  });

  it("computes playoff home win pct", () => {
    const games = [
      makeGame({ isPlayoff: true, homeScore: 31, awayScore: 17 }), // home win
      makeGame({ isPlayoff: true, homeScore: 28, awayScore: 14 }), // home win
      makeGame({ isPlayoff: true, homeScore: 10, awayScore: 24 }), // away win
    ];
    const r = computeTrends(games);
    expect(r.playoffVsRegular.playoff.homeWinPct).toBe("0.667");
  });

  it("handles no playoff games", () => {
    const games = [makeGame({ isPlayoff: false })];
    const r = computeTrends(games);
    expect(r.playoffVsRegular.playoff.avgTotal).toBe("0.0");
    expect(r.playoffVsRegular.playoff.homeWinPct).toBe(".000");
  });
});

// ─── Integration ────────────────────────────────────────

describe("computeTrends — integration", () => {
  it("handles a multi-season dataset", () => {
    const games: TrendGame[] = [
      // 2024 regular
      makeGame({ season: 2024, homeScore: 27, awayScore: 20, primetime: "SNF", spreadResult: "COVERED", ouResult: "OVER" }),
      makeGame({ season: 2024, homeScore: 10, awayScore: 24, primetime: null, spreadResult: "LOST", ouResult: "UNDER" }),
      // 2024 playoff
      makeGame({ season: 2024, homeScore: 31, awayScore: 17, isPlayoff: true, primetime: null, spreadResult: "COVERED", ouResult: "OVER" }),
      // 2023 regular
      makeGame({ season: 2023, homeScore: 14, awayScore: 28, primetime: "MNF", spreadResult: null, ouResult: null }),
      makeGame({ season: 2023, homeScore: 20, awayScore: 20, primetime: null, spreadResult: null, ouResult: null }),
    ];

    const r = computeTrends(games);

    expect(r.totalGames).toBe(5);
    expect(r.totalSeasons).toBe(2);
    expect(r.seasons).toHaveLength(2);
    expect(r.seasons[0].season).toBe(2024);
    expect(r.seasons[1].season).toBe(2023);

    // Home wins: games 1 (27>20), 3 (31>17) = 2
    // Away wins: games 2 (10<24), 4 (14<28) = 2
    // Ties: game 5 = 1
    // Home win pct: 2/4 = 0.500
    expect(r.overallHomeWinPct).toBe("0.500");

    // Primetime: SNF=1, MNF=1
    expect(r.primetime).toHaveLength(2);

    // Playoff: 1 game, home won → 1.000
    expect(r.playoffVsRegular.playoff.homeWinPct).toBe("1.000");
  });
});
