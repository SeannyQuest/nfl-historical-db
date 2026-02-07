import { describe, it, expect } from "vitest";
import { computeBlowouts, type BlowoutGame } from "@/lib/blowouts";

function makeGame(overrides: Partial<BlowoutGame> = {}): BlowoutGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 50,
    awayScore: 20,
    homeTeamAbbr: "KC",
    awayTeamAbbr: "HOU",
    ...overrides,
  };
}

describe("computeBlowouts — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeBlowouts([]);
    expect(r.stats.totalBlowouts).toBe(0);
    expect(r.stats.biggestBlowouts).toHaveLength(0);
  });
});

describe("computeBlowouts — threshold filtering", () => {
  it("filters by default threshold of 21", () => {
    const games = [
      makeGame({ homeScore: 50, awayScore: 20 }), // 30-point (blowout)
      makeGame({ homeScore: 40, awayScore: 22 }), // 18-point (not blowout)
      makeGame({ homeScore: 45, awayScore: 24 }), // 21-point (blowout)
    ];
    const r = computeBlowouts(games);
    expect(r.stats.totalBlowouts).toBe(2);
  });

  it("respects custom threshold", () => {
    const games = [
      makeGame({ homeScore: 35, awayScore: 10 }), // 25-point margin (blowout at 10+)
      makeGame({ homeScore: 28, awayScore: 20 }), // 8-point margin (not blowout at 10+)
    ];
    const r = computeBlowouts(games, 10);
    expect(r.stats.totalBlowouts).toBe(1);
  });
});

describe("computeBlowouts — biggest blowouts", () => {
  it("ranks by margin", () => {
    const games = [
      makeGame({ homeScore: 50, awayScore: 20 }), // 30
      makeGame({ homeScore: 40, awayScore: 15 }), // 25
      makeGame({ homeScore: 35, awayScore: 10 }), // 25
    ];
    const r = computeBlowouts(games);
    expect(r.stats.biggestBlowouts[0].margin).toBe(30);
  });

  it("limits to top 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({ season: 2000 + i, homeScore: 50 - i, awayScore: 10 })
    );
    const r = computeBlowouts(games);
    expect(r.stats.biggestBlowouts.length).toBeLessThanOrEqual(10);
  });

  it("includes winner and loser", () => {
    const games = [makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens" })];
    const r = computeBlowouts(games);
    expect(r.stats.biggestBlowouts[0].winner).toBe("Chiefs");
    expect(r.stats.biggestBlowouts[0].loser).toBe("Ravens");
  });
});

describe("computeBlowouts — blowouts by era", () => {
  it("groups by era", () => {
    const games = [
      makeGame({ season: 1995 }),
      makeGame({ season: 2005 }),
      makeGame({ season: 2015 }),
      makeGame({ season: 2024 }),
    ];
    const r = computeBlowouts(games);
    expect(r.stats.blowoutsByEra.length).toBe(4);
  });

  it("calculates average margin per era", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 50, awayScore: 20 }), // 30
      makeGame({ season: 2024, homeScore: 45, awayScore: 20 }), // 25
    ];
    const r = computeBlowouts(games);
    const era = r.stats.blowoutsByEra.find((e) => e.era === "2020+");
    expect(era?.averageMargin).toBe("27.5");
  });

  it("calculates percentage of total blowouts", () => {
    const games = [
      makeGame({ season: 2024 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2015 }),
    ];
    const r = computeBlowouts(games);
    const era2024 = r.stats.blowoutsByEra.find((e) => e.era === "2020+");
    expect(era2024?.percentage).toBe("66.7");
  });
});

describe("computeBlowouts — team blowout stats", () => {
  it("counts blowout wins by team", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 50, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 45, awayScore: 15 }),
      makeGame({ homeTeamName: "Ravens", homeScore: 55, awayScore: 10 }),
    ];
    const r = computeBlowouts(games);
    const chiefs = r.stats.mostBlowoutWins.find((t) => t.team === "Chiefs");
    expect(chiefs?.blowoutWins).toBe(2);
  });

  it("counts blowout losses by team", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", homeScore: 50, awayScore: 20 }),
      makeGame({ awayTeamName: "Ravens", homeScore: 45, awayScore: 15 }),
    ];
    const r = computeBlowouts(games);
    const ravens = r.stats.mostBlowoutLosses.find((t) => t.team === "Ravens");
    expect(ravens?.blowoutLosses).toBe(2);
  });

  it("limits wins to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2000 + Math.floor(i / 2),
        homeTeamName: `Team${i % 15}`,
        awayTeamName: "Other",
      })
    );
    const r = computeBlowouts(games);
    expect(r.stats.mostBlowoutWins.length).toBeLessThanOrEqual(10);
  });

  it("limits losses to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      makeGame({
        season: 2000 + Math.floor(i / 2),
        homeTeamName: "Other",
        awayTeamName: `Team${i % 15}`,
      })
    );
    const r = computeBlowouts(games);
    expect(r.stats.mostBlowoutLosses.length).toBeLessThanOrEqual(10);
  });

  it("sorts wins by count descending", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeScore: 50, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeScore: 45, awayScore: 15 }),
      makeGame({ homeTeamName: "Ravens", homeScore: 55, awayScore: 10 }),
    ];
    const r = computeBlowouts(games);
    expect(r.stats.mostBlowoutWins[0].team).toBe("Chiefs");
    expect(r.stats.mostBlowoutWins[0].blowoutWins).toBe(2);
  });

  it("sorts losses by count descending", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", homeScore: 50, awayScore: 20 }),
      makeGame({ awayTeamName: "Ravens", homeScore: 45, awayScore: 15 }),
      makeGame({ awayTeamName: "Chiefs", homeScore: 55, awayScore: 10 }),
    ];
    const r = computeBlowouts(games);
    expect(r.stats.mostBlowoutLosses[0].team).toBe("Ravens");
    expect(r.stats.mostBlowoutLosses[0].blowoutLosses).toBe(2);
  });
});

describe("computeBlowouts — away team wins", () => {
  it("handles away team blowout wins", () => {
    const games = [makeGame({ homeScore: 10, awayScore: 40, awayTeamName: "Ravens" })];
    const r = computeBlowouts(games);
    expect(r.stats.biggestBlowouts[0].winner).toBe("Ravens");
    expect(r.stats.biggestBlowouts[0].loser).toBe("Kansas City Chiefs");
  });
});

describe("computeBlowouts — tie handling", () => {
  it("ignores tie games", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 30 }),
      makeGame({ homeScore: 50, awayScore: 20 }),
    ];
    const r = computeBlowouts(games);
    expect(r.stats.totalBlowouts).toBe(1);
  });
});
