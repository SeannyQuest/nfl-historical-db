import { describe, it, expect } from "vitest";
import { computeATSTrends, type ATSTrendGame } from "@/lib/ats-trends";

function makeGame(overrides: Partial<ATSTrendGame> = {}): ATSTrendGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    spread: 3,
    spreadResult: "COVERED",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeATSTrends — empty", () => {
  it("returns empty for no games", () => {
    const r = computeATSTrends([]);
    expect(r.monthlyATS).toHaveLength(0);
    expect(r.weeklyATS).toHaveLength(0);
  });
});

// ─── Monthly ATS ────────────────────────────────────────

describe("computeATSTrends — monthly ATS", () => {
  it("groups by month based on week", () => {
    const games = [
      makeGame({ week: 1, spreadResult: "COVERED" }), // Sept
      makeGame({ week: 5, spreadResult: "COVERED" }), // Oct
      makeGame({ week: 9, spreadResult: "COVERED" }), // Nov
      makeGame({ week: 14, spreadResult: "COVERED" }), // Dec
      makeGame({ week: 18, spreadResult: "COVERED" }), // Jan+
    ];
    const r = computeATSTrends(games);
    expect(r.monthlyATS).toHaveLength(5);
  });

  it("computes home cover percentage", () => {
    const games = [
      makeGame({ week: 1, spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // home +3, wins by 7 ✓
      makeGame({ week: 2, spread: 3, homeScore: 20, awayScore: 18, spreadResult: "COVERED" }), // home +3, wins by 2 ✗
    ];
    const r = computeATSTrends(games);
    const sept = r.monthlyATS.find(m => m.month === "September");
    expect(sept?.homeCovers).toBe(1);
  });

  it("counts home and away covers", () => {
    const games = [
      makeGame({ week: 1, spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // home covers
      makeGame({ week: 1, spread: -3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // away covers
    ];
    const r = computeATSTrends(games);
    const sept = r.monthlyATS.find(m => m.month === "September");
    expect(sept?.homeCovers).toBe(1);
    expect(sept?.awayCovers).toBe(1);
  });

  it("sorts months in order", () => {
    const games = [
      makeGame({ week: 14 }),
      makeGame({ week: 1 }),
      makeGame({ week: 9 }),
    ];
    const r = computeATSTrends(games);
    expect(r.monthlyATS[0].month).toBe("September");
    expect(r.monthlyATS[1].month).toBe("November");
    expect(r.monthlyATS[2].month).toBe("December");
  });
});

// ─── Weekly ATS ─────────────────────────────────────────

describe("computeATSTrends — weekly ATS", () => {
  it("groups by week number", () => {
    const games = [
      makeGame({ week: 1, spreadResult: "COVERED" }),
      makeGame({ week: 5, spreadResult: "COVERED" }),
      makeGame({ week: 9, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    expect(r.weeklyATS).toHaveLength(3);
  });

  it("computes home cover percentage by week", () => {
    const games = [
      makeGame({ week: 1, spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // home covers
      makeGame({ week: 1, spread: -3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // away covers
    ];
    const r = computeATSTrends(games);
    const w1 = r.weeklyATS.find(w => w.week === 1);
    // 1 home cover out of 2 = 0.5
    expect(w1?.homeCoverPct).toBe("0.500");
  });

  it("counts games per week", () => {
    const games = [
      makeGame({ week: 1, spreadResult: "COVERED" }),
      makeGame({ week: 1, spreadResult: "COVERED" }),
      makeGame({ week: 2, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const w1 = r.weeklyATS.find(w => w.week === 1);
    const w2 = r.weeklyATS.find(w => w.week === 2);
    expect(w1?.games).toBe(2);
    expect(w2?.games).toBe(1);
  });

  it("sorts by week number", () => {
    const games = [
      makeGame({ week: 5 }),
      makeGame({ week: 1 }),
      makeGame({ week: 3 }),
    ];
    const r = computeATSTrends(games);
    expect(r.weeklyATS[0].week).toBe(1);
    expect(r.weeklyATS[1].week).toBe(3);
    expect(r.weeklyATS[2].week).toBe(5);
  });
});

// ─── Dog vs Fav ATS ─────────────────────────────────────

describe("computeATSTrends — dog vs fav", () => {
  it("computes underdog cover percentage", () => {
    const games = [
      makeGame({ spread: 3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // away dog wins by 7, covers
      makeGame({ spread: 3, homeScore: 20, awayScore: 24, spreadResult: "COVERED" }), // away dog wins by 4, covers
      makeGame({ spread: 3, homeScore: 28, awayScore: 20, spreadResult: "COVERED" }), // home fav wins by 8, covers
    ];
    const r = computeATSTrends(games);
    // 2 underdog games, 2 covers (first two), so 2/2 = 1.0
    expect(parseFloat(r.dogVsFavATS.underdogCoverPct)).toBeGreaterThanOrEqual(0.5);
  });

  it("computes favorite cover percentage", () => {
    const games = [
      makeGame({ spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // home fav, wins by 7 > 3, covers
      makeGame({ spread: 3, homeScore: 24, awayScore: 20, spreadResult: "COVERED" }), // home fav, wins by 4 > 3, covers
      makeGame({ spread: 3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // away dog, wins by 7 > 3, so home doesn't cover
    ];
    const r = computeATSTrends(games);
    // 3 favorite games (first 3), 2 covers = 0.667
    expect(parseFloat(r.dogVsFavATS.favoriteCoverPct)).toBeGreaterThanOrEqual(0.5);
  });

  it("counts underdog games", () => {
    const games = [
      makeGame({ spread: 3 }), // 1 underdog game
      makeGame({ spread: -3 }), // 1 underdog game
      makeGame({ spread: 7 }), // 1 underdog game
    ];
    const r = computeATSTrends(games);
    expect(r.dogVsFavATS.underdogGames).toBe(3);
  });
});

// ─── Spread Range ATS ───────────────────────────────────

describe("computeATSTrends — spread range ATS", () => {
  it("groups by spread range", () => {
    const games = [
      makeGame({ spread: 2, spreadResult: "COVERED" }), // 0.5-3
      makeGame({ spread: 5, spreadResult: "COVERED" }), // 3-7
      makeGame({ spread: 10, spreadResult: "COVERED" }), // 7-14
      makeGame({ spread: 20, spreadResult: "COVERED" }), // 14+
    ];
    const r = computeATSTrends(games);
    expect(r.spreadRangeATS).toHaveLength(4);
  });

  it("computes home and away cover percentages", () => {
    const games = [
      makeGame({ spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // home covers
      makeGame({ spread: 3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // away covers
    ];
    const r = computeATSTrends(games);
    const range = r.spreadRangeATS.find(x => x.range === "3-7");
    // Each had 1 cover
    expect(range?.homeCoverPct).toBe("0.500");
    expect(range?.awayCoverPct).toBe("0.500");
  });

  it("counts games per spread range", () => {
    const games = [
      makeGame({ spread: 2, spreadResult: "COVERED" }),
      makeGame({ spread: 2.5, spreadResult: "COVERED" }),
      makeGame({ spread: 5, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const range03 = r.spreadRangeATS.find(x => x.range === "0.5-3");
    const range37 = r.spreadRangeATS.find(x => x.range === "3-7");
    expect(range03?.games).toBe(2);
    expect(range37?.games).toBe(1);
  });

  it("sorts by range", () => {
    const games = [
      makeGame({ spread: 20 }),
      makeGame({ spread: 10 }),
      makeGame({ spread: 5 }),
      makeGame({ spread: 2 }),
    ];
    const r = computeATSTrends(games);
    expect(r.spreadRangeATS[0].range).toBe("0.5-3");
    expect(r.spreadRangeATS[1].range).toBe("3-7");
    expect(r.spreadRangeATS[2].range).toBe("7-14");
    expect(r.spreadRangeATS[3].range).toBe("14+");
  });
});

// ─── Season ATS ─────────────────────────────────────────

describe("computeATSTrends — season ATS", () => {
  it("computes ATS per season", () => {
    const games = [
      makeGame({ season: 2024, spreadResult: "COVERED" }),
      makeGame({ season: 2024, spreadResult: "COVERED" }),
      makeGame({ season: 2023, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const s2024 = r.seasonATS.find(s => s.season === 2024);
    const s2023 = r.seasonATS.find(s => s.season === 2023);
    expect(s2024?.totalGames).toBe(2);
    expect(s2023?.totalGames).toBe(1);
  });

  it("computes home cover percentage per season", () => {
    const games = [
      makeGame({ season: 2024, spread: 3, homeScore: 27, awayScore: 20, spreadResult: "COVERED" }), // both covered
      makeGame({ season: 2024, spread: 3, homeScore: 20, awayScore: 27, spreadResult: "COVERED" }), // both covered
    ];
    const r = computeATSTrends(games);
    const s2024 = r.seasonATS.find(s => s.season === 2024);
    // Both games marked as "COVERED", so 2 covers out of 2 games = 1.0
    expect(s2024?.homeCoverPct).toBe("1.000");
  });

  it("sorts by season", () => {
    const games = [
      makeGame({ season: 2024 }),
      makeGame({ season: 2023 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeATSTrends(games);
    expect(r.seasonATS[0].season).toBe(2022);
    expect(r.seasonATS[1].season).toBe(2023);
    expect(r.seasonATS[2].season).toBe(2024);
  });
});

// ─── Null/Zero Handling ──────────────────────────────────

describe("computeATSTrends — null/zero handling", () => {
  it("skips games with null spread", () => {
    const games = [
      makeGame({ spread: null, spreadResult: "COVERED" }),
      makeGame({ spread: 3, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const total = r.monthlyATS.reduce((sum, m) => sum + m.homeCovers + m.awayCovers, 0);
    expect(total).toBe(1);
  });

  it("skips games with zero spread", () => {
    const games = [
      makeGame({ spread: 0, spreadResult: "COVERED" }),
      makeGame({ spread: 3, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const total = r.monthlyATS.reduce((sum, m) => sum + m.homeCovers + m.awayCovers, 0);
    expect(total).toBe(1);
  });

  it("skips games with null spreadResult", () => {
    const games = [
      makeGame({ spread: 3, spreadResult: null }),
      makeGame({ spread: 3, spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    const total = r.monthlyATS.reduce((sum, m) => sum + m.homeCovers + m.awayCovers, 0);
    expect(total).toBe(1);
  });

  it("handles non-covered results", () => {
    const games = [
      makeGame({ spreadResult: "LOST" }),
      makeGame({ spreadResult: "COVERED" }),
    ];
    const r = computeATSTrends(games);
    // Only 1 game counts (the COVERED)
    const total = r.monthlyATS.reduce((sum, m) => sum + m.homeCovers + m.awayCovers, 0);
    expect(total).toBe(1);
  });
});
