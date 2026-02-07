import { describe, it, expect } from "vitest";
import { computeCombacks, type ComebackGame } from "@/lib/comebacks";

function makeGame(overrides: Partial<ComebackGame> = {}): ComebackGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 19,
    homeTeamAbbr: "KC",
    awayTeamAbbr: "HOU",
    ...overrides,
  };
}

describe("computeCombacks — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeCombacks([]);
    expect(r.stats.totalComebacks).toBe(0);
    expect(r.stats.biggestComebacks).toHaveLength(0);
    expect(r.stats.bestComebackTeams).toHaveLength(0);
  });
});

describe("computeCombacks — filtering comebacks", () => {
  it("identifies close wins as comebacks", () => {
    const games = [
      makeGame({ homeScore: 25, awayScore: 22 }), // 3-point home win
      makeGame({ homeScore: 20, awayScore: 15 }), // 5-point home win
      makeGame({ homeScore: 30, awayScore: 10 }), // 20-point blowout (not a comeback)
    ];
    const r = computeCombacks(games);
    expect(r.stats.totalComebacks).toBe(2);
  });

  it("filters ties out", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 20 }),
      makeGame({ homeScore: 25, awayScore: 22 }),
    ];
    const r = computeCombacks(games);
    expect(r.stats.totalComebacks).toBe(1);
  });

  it("ignores large margins (>7)", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 20 }), // 10-point win
      makeGame({ homeScore: 25, awayScore: 24 }), // 1-point win
    ];
    const r = computeCombacks(games);
    expect(r.stats.totalComebacks).toBe(1);
  });
});

describe("computeCombacks — biggest comebacks", () => {
  it("ranks by deficit", () => {
    const games = [
      makeGame({ homeScore: 25, awayScore: 20 }), // 5-point
      makeGame({ homeScore: 27, awayScore: 21 }), // 6-point
      makeGame({ homeScore: 23, awayScore: 22 }), // 1-point
    ];
    const r = computeCombacks(games);
    expect(r.stats.biggestComebacks[0].deficit).toBe(6);
    expect(r.stats.biggestComebacks[1].deficit).toBe(5);
    expect(r.stats.biggestComebacks[2].deficit).toBe(1);
  });

  it("limits to top 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({ season: 2000 + i, homeScore: 25 - (i % 5), awayScore: 20 })
    );
    const r = computeCombacks(games);
    expect(r.stats.biggestComebacks.length).toBeLessThanOrEqual(10);
  });

  it("includes team and opponent names", () => {
    const games = [makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens" })];
    const r = computeCombacks(games);
    expect(r.stats.biggestComebacks[0].team).toBe("Chiefs");
    expect(r.stats.biggestComebacks[0].opponent).toBe("Ravens");
  });
});

describe("computeCombacks — comeback win rate", () => {
  it("calculates win rate correctly", () => {
    const games = [
      makeGame({ homeScore: 25, awayScore: 22 }), // comeback
      makeGame({ homeScore: 25, awayScore: 22 }), // comeback
      makeGame({ homeScore: 20, awayScore: 19 }), // comeback
      makeGame({ homeScore: 30, awayScore: 10 }), // not counted (margin >7)
    ];
    const r = computeCombacks(games);
    // 3 comebacks / 3 close games = 1.000
    expect(r.stats.comebackWinRate).toBe("1.000");
  });

  it("returns .000 for no close games", () => {
    const games = [
      makeGame({ homeScore: 45, awayScore: 10 }),
      makeGame({ homeScore: 40, awayScore: 15 }),
    ];
    const r = computeCombacks(games);
    expect(r.stats.comebackWinRate).toBe(".000");
  });
});

describe("computeCombacks — comebacks by era", () => {
  it("groups by era", () => {
    const games = [
      makeGame({ season: 1998, homeScore: 25, awayScore: 22 }),
      makeGame({ season: 2005, homeScore: 25, awayScore: 22 }),
      makeGame({ season: 2015, homeScore: 25, awayScore: 22 }),
      makeGame({ season: 2024, homeScore: 25, awayScore: 22 }),
    ];
    const r = computeCombacks(games);
    expect(r.stats.comebacksByEra.length).toBe(4);
    const eras = r.stats.comebacksByEra.map((e) => e.era);
    expect(eras).toContain("Pre-2000");
    expect(eras).toContain("2000-2009");
    expect(eras).toContain("2010-2019");
    expect(eras).toContain("2020+");
  });

  it("calculates average deficit per era", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 25, awayScore: 22 }), // 3-point
      makeGame({ season: 2024, homeScore: 26, awayScore: 21 }), // 5-point
    ];
    const r = computeCombacks(games);
    const era2024 = r.stats.comebacksByEra.find((e) => e.era === "2020+");
    // (3 + 5) / 2 = 4.0
    expect(era2024?.averageDeficit).toBe("4.0");
  });
});

describe("computeCombacks — best comeback teams", () => {
  it("counts comebacks by team", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 22 }),
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 26, awayScore: 21 }),
      makeGame({ homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 24, awayScore: 23 }),
    ];
    const r = computeCombacks(games);
    const chiefs = r.stats.bestComebackTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.comebacks).toBe(2);
  });

  it("limits to top 10 teams", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2000 + Math.floor(i / 2),
        homeTeamName: `Team${i % 15}`,
        awayTeamName: "Other",
        homeScore: 25 - (i % 5),
        awayScore: 20,
      })
    );
    const r = computeCombacks(games);
    expect(r.stats.bestComebackTeams.length).toBeLessThanOrEqual(10);
  });

  it("calculates win rate for teams", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 25, awayScore: 22 }), // win
      makeGame({ homeTeamName: "Chiefs", homeScore: 24, awayScore: 23 }), // win
    ];
    const r = computeCombacks(games);
    const chiefs = r.stats.bestComebackTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.winRate).toBe("1.000");
  });

  it("sorts by comeback count descending", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 25, awayScore: 22 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 26, awayScore: 21 }),
      makeGame({ homeTeamName: "Ravens", homeScore: 24, awayScore: 23 }),
    ];
    const r = computeCombacks(games);
    expect(r.stats.bestComebackTeams[0].team).toBe("Chiefs");
    expect(r.stats.bestComebackTeams[0].comebacks).toBe(2);
  });
});

describe("computeCombacks — integration", () => {
  it("handles away team comebacks", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 25, awayTeamName: "Ravens" }),
    ];
    const r = computeCombacks(games);
    expect(r.stats.totalComebacks).toBe(1);
    expect(r.stats.biggestComebacks[0].team).toBe("Ravens");
  });

  it("includes week information", () => {
    const games = [makeGame({ week: "5" })];
    const r = computeCombacks(games);
    expect(r.stats.biggestComebacks[0].week).toBe("5");
  });
});
