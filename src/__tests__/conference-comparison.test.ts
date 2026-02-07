import { describe, it, expect } from "vitest";
import { computeConferenceComparison, type ConferenceGame } from "@/lib/conference-comparison";

function makeGame(overrides: Partial<ConferenceGame> = {}): ConferenceGame {
  return {
    season: 2024,
    homeTeam: { conference: "AFC" },
    awayTeam: { conference: "NFC" },
    homeScore: 27,
    awayScore: 20,
    isSuperBowl: false,
    spreadResult: "COVERED",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeConferenceComparison — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeConferenceComparison([]);
    expect(r.afcStats.totalWins).toBe(0);
    expect(r.nflStats.totalWins).toBe(0);
    expect(r.crossConferenceGames).toBe(0);
  });
});

// ─── Cross-Conference Filter ────────────────────────────

describe("computeConferenceComparison — cross-conference filter", () => {
  it("counts only cross-conference games", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" } }),
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" } }),
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "AFC" } }), // same conf, ignored
    ];
    const r = computeConferenceComparison(games);
    expect(r.crossConferenceGames).toBe(2);
  });

  it("ignores same-conference games in records", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "AFC" } }),
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.totalWins).toBe(0);
    expect(r.crossConferenceGames).toBe(0);
  });
});

// ─── AFC vs NFC Head-to-Head ─────────────────────────────

describe("computeConferenceComparison — AFC vs NFC head-to-head", () => {
  it("counts AFC wins", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 27, awayScore: 20 }), // AFC wins
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 27, awayScore: 20 }), // NFC wins
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 25, awayScore: 22 }), // AFC wins
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.totalWins).toBe(2);
    expect(r.nflStats.totalWins).toBe(1);
  });

  it("counts NFC wins", () => {
    const games = [
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 30, awayScore: 10 }), // NFC wins
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 28, awayScore: 24 }), // NFC wins
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 27, awayScore: 20 }), // AFC wins
    ];
    const r = computeConferenceComparison(games);
    expect(r.nflStats.totalWins).toBe(2);
    expect(r.afcStats.totalWins).toBe(1);
  });

  it("computes AFC win pct", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 27, awayScore: 20 }), // AFC +1
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 25, awayScore: 22 }), // AFC +1
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 27, awayScore: 20 }), // AFC -1
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.winPct).toBe("0.667");
  });
});

// ─── Home/Away Records ──────────────────────────────────

describe("computeConferenceComparison — home/away records", () => {
  it("computes AFC home wins when at home", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 27, awayScore: 20 }), // AFC home
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 20, awayScore: 24 }), // AFC home loss
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 27, awayScore: 20 }), // AFC away
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.homeWins).toBe(1);
    expect(r.afcStats.homeLosses).toBe(1);
  });

  it("computes AFC away wins when on road", () => {
    const games = [
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 20, awayScore: 24 }), // AFC away
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 27, awayScore: 20 }), // AFC away loss
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.awayWins).toBe(1);
    expect(r.afcStats.awayLosses).toBe(1);
  });
});

// ─── Betting Against the Spread ─────────────────────────

describe("computeConferenceComparison — ATS records", () => {
  it("counts AFC ATS wins", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, spreadResult: "COVERED" }),
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, spreadResult: "COVERED" }),
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, spreadResult: "LOST" }),
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.atsWins).toBe(2);
    expect(r.afcStats.atsTotal).toBe(3);
    expect(r.afcStats.atsPct).toBe("0.667");
  });

  it("counts NFC ATS wins", () => {
    const games = [
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, spreadResult: "COVERED" }),
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, spreadResult: "LOST" }),
    ];
    const r = computeConferenceComparison(games);
    expect(r.nflStats.atsWins).toBe(1);
    expect(r.nflStats.atsTotal).toBe(2);
    expect(r.nflStats.atsPct).toBe("0.500");
  });
});

// ─── Scoring ────────────────────────────────────────────

describe("computeConferenceComparison — scoring", () => {
  it("computes AFC avg scores", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 20, awayScore: 28 }),
    ];
    const r = computeConferenceComparison(games);
    // AFC scores: 30 (home) + 28 (away) = 58 / 2 = 29.0
    expect(r.afcStats.avgHomeScore).toBe("29.0");
  });

  it("computes NFC avg scores", () => {
    const games = [
      makeGame({ homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 20, awayScore: 28 }),
    ];
    const r = computeConferenceComparison(games);
    // NFC scores: 20 (away) + 20 (home) = 40 / 2 = 20.0
    expect(r.nflStats.avgHomeScore).toBe("20.0");
  });
});

// ─── Super Bowl ──────────────────────────────────────────

describe("computeConferenceComparison — Super Bowl history", () => {
  it("counts AFC Super Bowl wins", () => {
    const games = [
      makeGame({ isSuperBowl: true, homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 35, awayScore: 10 }), // AFC wins
      makeGame({ isSuperBowl: true, homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 24, awayScore: 20 }), // AFC wins
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.superBowlWins).toBe(2);
    expect(r.superBowlStats.afcWins).toBe(2);
  });

  it("counts NFC Super Bowl wins", () => {
    const games = [
      makeGame({ isSuperBowl: true, homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 31, awayScore: 20 }), // NFC wins
    ];
    const r = computeConferenceComparison(games);
    expect(r.nflStats.superBowlWins).toBe(1);
    expect(r.superBowlStats.nflWins).toBe(1);
  });

  it("counts Super Bowl appearances", () => {
    const games = [
      makeGame({ isSuperBowl: true, homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 35, awayScore: 10 }), // AFC wins
      makeGame({ isSuperBowl: true, homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 31, awayScore: 20 }), // NFC wins
    ];
    const r = computeConferenceComparison(games);
    expect(r.afcStats.superBowlAppearances).toBe(1);
    expect(r.nflStats.superBowlAppearances).toBe(1);
  });
});

// ─── Season Comparison ──────────────────────────────────

describe("computeConferenceComparison — season comparison", () => {
  it("groups by season descending", () => {
    const games = [
      makeGame({ season: 2023 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeConferenceComparison(games);
    expect(r.seasonComparisons[0].season).toBe(2024);
    expect(r.seasonComparisons[1].season).toBe(2023);
    expect(r.seasonComparisons[2].season).toBe(2022);
  });

  it("counts AFC/NFC wins per season", () => {
    const games = [
      makeGame({ season: 2024, homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 27, awayScore: 20 }), // AFC
      makeGame({ season: 2024, homeTeam: { conference: "AFC" }, awayTeam: { conference: "NFC" }, homeScore: 25, awayScore: 22 }), // AFC
      makeGame({ season: 2024, homeTeam: { conference: "NFC" }, awayTeam: { conference: "AFC" }, homeScore: 27, awayScore: 20 }), // NFC
    ];
    const r = computeConferenceComparison(games);
    const season2024 = r.seasonComparisons.find((s) => s.season === 2024);
    expect(season2024?.afcWins).toBe(2);
    expect(season2024?.nflWins).toBe(1);
  });
});
