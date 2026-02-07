import { describe, it, expect } from "vitest";
import { computeGameScript, type GameScriptGame } from "@/lib/game-script";

function makeGame(overrides: Partial<GameScriptGame> = {}): GameScriptGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    spread: 3,
    overUnder: 45,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeGameScript — empty", () => {
  it("returns empty for no games", () => {
    const r = computeGameScript([]);
    expect(r.favoriteRecords).toHaveLength(0);
    expect(r.underdogUpsets).toHaveLength(0);
  });
});

// ─── Favorite Records ────────────────────────────────────

describe("computeGameScript — favorite records", () => {
  it("groups by spread range", () => {
    const games = [
      makeGame({ spread: 2, homeScore: 30, awayScore: 20 }), // 1-3
      makeGame({ spread: 5, homeScore: 30, awayScore: 20 }), // 3.5-7
      makeGame({ spread: 10, homeScore: 30, awayScore: 20 }), // 7.5-14
      makeGame({ spread: 20, homeScore: 30, awayScore: 20 }), // 14+
    ];
    const r = computeGameScript(games);
    expect(r.favoriteRecords).toHaveLength(4);
  });

  it("computes favorite wins in 1-3 range", () => {
    const games = [
      makeGame({ spread: 3, homeScore: 30, awayScore: 20 }), // home favored by 3, wins by 10 ✓
      makeGame({ spread: 2, homeScore: 20, awayScore: 25 }), // home favored by 2, loses by 5 ✗
    ];
    const r = computeGameScript(games);
    const range = r.favoriteRecords.find(x => x.favoredByRange === "1-3");
    expect(range?.wins).toBe(1);
    expect(range?.losses).toBe(1);
  });

  it("computes ATS records", () => {
    const games = [
      makeGame({ spread: 5, homeScore: 30, awayScore: 20 }), // home +5, wins by 10, covers
      makeGame({ spread: 5, homeScore: 24, awayScore: 20 }), // home +5, wins by 4, doesn't cover
    ];
    const r = computeGameScript(games);
    const range = r.favoriteRecords.find(x => x.favoredByRange === "3.5-7");
    expect(range?.atsRecord).toBe("1-1");
  });

  it("computes win percentage", () => {
    const games = [
      makeGame({ spread: 2, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 2, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 2, homeScore: 20, awayScore: 30 }),
    ];
    const r = computeGameScript(games);
    const range = r.favoriteRecords.find(x => x.favoredByRange === "1-3");
    expect(range?.winPct).toBe("0.667");
  });

  it("sorts ranges in order", () => {
    const games = [
      makeGame({ spread: 20 }),
      makeGame({ spread: 10 }),
      makeGame({ spread: 5 }),
      makeGame({ spread: 2 }),
    ];
    const r = computeGameScript(games);
    expect(r.favoriteRecords[0].favoredByRange).toBe("1-3");
    expect(r.favoriteRecords[1].favoredByRange).toBe("3.5-7");
    expect(r.favoriteRecords[2].favoredByRange).toBe("7.5-14");
    expect(r.favoriteRecords[3].favoredByRange).toBe("14+");
  });
});

// ─── Underdog Upsets ─────────────────────────────────────

describe("computeGameScript — underdog upsets", () => {
  it("identifies underdog upsets", () => {
    const games = [
      makeGame({ spread: 7, homeScore: 20, awayScore: 30 }), // away favored by 7, away wins by 10 ✓
      makeGame({ spread: -7, homeScore: 30, awayScore: 20 }), // away favored by 7, home wins by 10 ✓
    ];
    const r = computeGameScript(games);
    expect(r.underdogUpsets.length).toBeGreaterThan(0);
  });

  it("includes upset details", () => {
    const games = [makeGame({ spread: 10, homeScore: 20, awayScore: 35 })]; // away +10, away wins 35-20
    const r = computeGameScript(games);
    const upset = r.underdogUpsets[0];
    expect(upset.homeTeam).toBe("Green Bay Packers");
    expect(upset.awayTeam).toBe("Chicago Bears");
    expect(upset.spread).toBe(10);
  });

  it("caps at 20 upsets", () => {
    const games = [];
    for (let i = 0; i < 30; i++) {
      games.push(makeGame({ spread: 10, homeScore: 20, awayScore: 35 }));
    }
    const r = computeGameScript(games);
    expect(r.underdogUpsets).toHaveLength(20);
  });

  it("sorts by spread magnitude", () => {
    const games = [
      makeGame({ spread: 5, homeScore: 20, awayScore: 30 }),
      makeGame({ spread: 15, homeScore: 20, awayScore: 40 }),
    ];
    const r = computeGameScript(games);
    expect(Math.abs(r.underdogUpsets[0].spread)).toBeGreaterThanOrEqual(
      Math.abs(r.underdogUpsets[1]?.spread || 0)
    );
  });
});

// ─── Over/Under Trends ───────────────────────────────────

describe("computeGameScript — over/under trends", () => {
  it("groups by OU range", () => {
    const games = [
      makeGame({ overUnder: 38 }), // 35-40
      makeGame({ overUnder: 42 }), // 40-45
      makeGame({ overUnder: 48 }), // 45-50
      makeGame({ overUnder: 52 }), // 50+
    ];
    const r = computeGameScript(games);
    expect(r.overUnderTrends).toHaveLength(4);
  });

  it("computes over percentage", () => {
    const games = [
      makeGame({ overUnder: 45, homeScore: 30, awayScore: 20 }), // 50, over
      makeGame({ overUnder: 45, homeScore: 25, awayScore: 15 }), // 40, under
    ];
    const r = computeGameScript(games);
    const range = r.overUnderTrends.find(x => x.ouRange === "45-50");
    expect(range?.overPct).toBe("0.500");
  });

  it("counts games in range", () => {
    const games = [
      makeGame({ overUnder: 48, homeScore: 30, awayScore: 20 }),
      makeGame({ overUnder: 47, homeScore: 25, awayScore: 20 }),
      makeGame({ overUnder: 38, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeGameScript(games);
    const range45 = r.overUnderTrends.find(x => x.ouRange === "45-50");
    const range35 = r.overUnderTrends.find(x => x.ouRange === "35-40");
    expect(range45?.games).toBe(2);
    expect(range35?.games).toBe(1);
  });

  it("sorts ranges in order", () => {
    const games = [
      makeGame({ overUnder: 52 }),
      makeGame({ overUnder: 48 }),
      makeGame({ overUnder: 42 }),
      makeGame({ overUnder: 38 }),
    ];
    const r = computeGameScript(games);
    expect(r.overUnderTrends[0].ouRange).toBe("35-40");
    expect(r.overUnderTrends[1].ouRange).toBe("40-45");
    expect(r.overUnderTrends[2].ouRange).toBe("45-50");
    expect(r.overUnderTrends[3].ouRange).toBe("50+");
  });
});

// ─── Line Accuracy ──────────────────────────────────────

describe("computeGameScript — line accuracy", () => {
  it("computes average spread error", () => {
    const games = [
      makeGame({ spread: 5, homeScore: 30, awayScore: 20 }), // margin 10, error = |10-5| = 5
      makeGame({ spread: 5, homeScore: 28, awayScore: 20 }), // margin 8, error = |8-5| = 3
    ];
    const r = computeGameScript(games);
    // (5 + 3) / 2 = 4
    expect(r.lineAccuracy.avgSpreadError).toBe("4.00");
  });

  it("computes average OU error", () => {
    const games = [
      makeGame({ overUnder: 45, homeScore: 30, awayScore: 20 }), // total 50, error = |50-45| = 5
      makeGame({ overUnder: 45, homeScore: 25, awayScore: 15 }), // total 40, error = |40-45| = 5
    ];
    const r = computeGameScript(games);
    // (5 + 5) / 2 = 5
    expect(r.lineAccuracy.avgOUError).toBe("5.00");
  });

  it("handles null spreads", () => {
    const games = [
      makeGame({ spread: null, overUnder: 45, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 5, overUnder: 45, homeScore: 28, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    expect(r.lineAccuracy.avgSpreadError).not.toBe("0.00");
  });

  it("handles null OU", () => {
    const games = [
      makeGame({ spread: 5, overUnder: null, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 5, overUnder: 45, homeScore: 28, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    expect(r.lineAccuracy.avgOUError).not.toBe("0.00");
  });
});

// ─── Null/Zero Handling ──────────────────────────────────

describe("computeGameScript — null/zero handling", () => {
  it("ignores games with null spread", () => {
    const games = [
      makeGame({ spread: null, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 5, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    const totalGames = r.favoriteRecords.reduce((sum, f) => sum + (parseInt(f.atsRecord.split("-")[0]) + parseInt(f.atsRecord.split("-")[1])), 0);
    expect(totalGames).toBe(1);
  });

  it("ignores games with zero spread", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 5, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    const hasZeroSpread = r.favoriteRecords.some(f => f.favoredByRange.includes("0"));
    expect(hasZeroSpread).toBe(false);
  });

  it("ignores games with null OU", () => {
    const games = [
      makeGame({ overUnder: null, homeScore: 30, awayScore: 20 }),
      makeGame({ overUnder: 45, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    const totalGames = r.overUnderTrends.reduce((sum, ou) => sum + ou.games, 0);
    expect(totalGames).toBe(1);
  });

  it("ignores games with zero OU", () => {
    const games = [
      makeGame({ overUnder: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ overUnder: 45, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeGameScript(games);
    const totalGames = r.overUnderTrends.reduce((sum, ou) => sum + ou.games, 0);
    expect(totalGames).toBe(1);
  });
});
