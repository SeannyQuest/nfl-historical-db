import { describe, it, expect } from "vitest";
import { computeByeWeekImpact, type ByeWeekGame } from "@/lib/bye-week";

function makeGame(overrides: Partial<ByeWeekGame> = {}): ByeWeekGame {
  return {
    season: 2024,
    week: 5,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    homeOnBye: false,
    awayOnBye: false,
    spreadResult: "COVERED",
    ouResult: "OVER",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeByeWeekImpact — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeByeWeekImpact([]);
    expect(r.stats.totalGames).toBe(0);
    expect(r.stats.recordOnBye.wins).toBe(0);
    expect(r.stats.recordNotOnBye.wins).toBe(0);
  });
});

// ─── Record on Bye ──────────────────────────────────────

describe("computeByeWeekImpact — record on bye", () => {
  it("counts wins coming off bye", () => {
    const games = [
      makeGame({ homeOnBye: true, homeScore: 27, awayScore: 20 }), // bye win
      makeGame({ homeOnBye: true, homeScore: 25, awayScore: 28 }), // bye loss
      makeGame({ homeOnBye: false, homeScore: 24, awayScore: 20 }), // no bye win
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.recordOnBye.wins).toBe(1);
  });

  it("counts losses coming off bye", () => {
    const games = [
      makeGame({ awayOnBye: true, homeScore: 27, awayScore: 20 }), // bye loss
      makeGame({ awayOnBye: true, homeScore: 20, awayScore: 24 }), // bye win
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.recordOnBye.wins).toBe(1);
    expect(r.stats.recordOnBye.losses).toBe(1);
  });

  it("computes bye win pct", () => {
    const games = [
      makeGame({ homeOnBye: true, homeScore: 27, awayScore: 20 }), // bye win
      makeGame({ homeOnBye: true, homeScore: 25, awayScore: 22 }), // bye win
      makeGame({ homeOnBye: true, homeScore: 10, awayScore: 24 }), // bye loss
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.recordOnBye.winPct).toBe("0.667");
  });
});

// ─── Record Not on Bye ──────────────────────────────────

describe("computeByeWeekImpact — record not on bye", () => {
  it("counts wins when not on bye", () => {
    const games = [
      makeGame({ homeOnBye: false, awayOnBye: true, homeScore: 27, awayScore: 20 }), // home no bye win
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 25, awayScore: 28 }), // away no bye win
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.recordNotOnBye.wins).toBe(2);
    expect(r.stats.recordNotOnBye.losses).toBe(0);
  });

  it("computes not bye win pct", () => {
    const games = [
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 20, awayScore: 27 }), // away win
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 22, awayScore: 25 }), // away win
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 24, awayScore: 10 }), // away loss
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.recordNotOnBye.winPct).toBe("0.667");
  });
});

// ─── Covering Spreads ───────────────────────────────────

describe("computeByeWeekImpact — covering spreads", () => {
  it("computes cover rate on bye", () => {
    const games = [
      makeGame({ homeOnBye: true, spreadResult: "COVERED" }),
      makeGame({ homeOnBye: true, spreadResult: "COVERED" }),
      makeGame({ homeOnBye: true, spreadResult: "LOST" }),
      makeGame({ homeOnBye: false, spreadResult: "COVERED" }),
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.coverRateOnBye).toBe("0.667");
  });

  it("computes cover rate not on bye", () => {
    const games = [
      makeGame({ homeOnBye: false, spreadResult: "COVERED" }),
      makeGame({ homeOnBye: false, spreadResult: "COVERED" }),
      makeGame({ homeOnBye: false, spreadResult: "LOST" }),
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.coverRateNotOnBye).toBe("0.667");
  });
});

// ─── Scoring Differential ───────────────────────────────

describe("computeByeWeekImpact — scoring differential", () => {
  it("computes scoring differential on bye", () => {
    const games = [
      makeGame({ homeOnBye: true, homeScore: 35, awayScore: 20 }), // +15
      makeGame({ homeOnBye: true, homeScore: 25, awayScore: 20 }), // +5
    ];
    const r = computeByeWeekImpact(games);
    // (60 - 40) / 2 = 10.0
    expect(r.stats.scoringDifferentialOnBye).toBe("10.0");
  });

  it("computes scoring differential not on bye", () => {
    const games = [
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 20, awayScore: 28 }), // away +8
      makeGame({ homeOnBye: true, awayOnBye: false, homeScore: 20, awayScore: 26 }), // away +6
    ];
    const r = computeByeWeekImpact(games);
    // (54 - 40) / 2 = 7.0
    expect(r.stats.scoringDifferentialNotOnBye).toBe("7.0");
  });
});

// ─── Bye Week Trends ────────────────────────────────────

describe("computeByeWeekImpact — bye week trends", () => {
  it("groups trends by season", () => {
    const games = [
      makeGame({ season: 2024, homeOnBye: true, homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, homeOnBye: false, homeScore: 25, awayScore: 22 }),
      makeGame({ season: 2023, homeOnBye: true, homeScore: 30, awayScore: 10 }),
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.byeWeekTrends).toHaveLength(2);
    expect(r.stats.byeWeekTrends[0].season).toBe(2024);
    expect(r.stats.byeWeekTrends[1].season).toBe(2023);
  });

  it("counts bye and not bye games per season", () => {
    const games = [
      makeGame({ season: 2024, homeOnBye: true, awayOnBye: true }),
      makeGame({ season: 2024, homeOnBye: false, awayOnBye: false }),
    ];
    const r = computeByeWeekImpact(games);
    const trend = r.stats.byeWeekTrends[0];
    expect(trend.gamesOnBye).toBe(2);
    expect(trend.gamesNotOnBye).toBe(2);
  });
});

// ─── Opponent on Bye ────────────────────────────────────

describe("computeByeWeekImpact — opponent on bye", () => {
  it("counts wins against bye teams", () => {
    const games = [
      makeGame({ homeOnBye: true, homeScore: 20, awayScore: 27 }), // away beats bye team
      makeGame({ awayOnBye: true, homeScore: 30, awayScore: 20 }), // home beats bye team
      makeGame({ homeOnBye: true, homeScore: 27, awayScore: 20 }), // bye team wins
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.opponentOnByeStats.wins).toBe(2);
  });

  it("computes win pct when opponent on bye", () => {
    const games = [
      makeGame({ homeOnBye: true, homeScore: 20, awayScore: 27 }), // away wins
      makeGame({ homeOnBye: true, homeScore: 20, awayScore: 27 }), // away wins
      makeGame({ homeOnBye: true, homeScore: 27, awayScore: 20 }), // home wins
    ];
    const r = computeByeWeekImpact(games);
    // 2 wins / 3 decisions = 0.667
    expect(r.stats.opponentOnByeStats.winPct).toBe("0.667");
  });
});

// ─── Total Games Count ──────────────────────────────────

describe("computeByeWeekImpact — total games", () => {
  it("counts total games", () => {
    const games = [
      makeGame(),
      makeGame(),
      makeGame(),
      makeGame(),
    ];
    const r = computeByeWeekImpact(games);
    expect(r.stats.totalGames).toBe(4);
  });
});
