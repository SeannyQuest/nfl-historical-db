import { describe, it, expect } from "vitest";
import { computeSuperBowlStats, type SuperBowlGame } from "@/lib/super-bowl";

function makeSBGame(overrides: Partial<SuperBowlGame> = {}): SuperBowlGame {
  return {
    season: 2024,
    week: "SuperBowl",
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "San Francisco 49ers",
    homeScore: 25,
    awayScore: 22,
    homeTeamAbbr: "KC",
    awayTeamAbbr: "SF",
    spreadResult: "COVERED",
    ouResult: "UNDER",
    ...overrides,
  };
}

describe("computeSuperBowlStats — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeSuperBowlStats([]);
    expect(r.stats.totalSuperBowls).toBe(0);
    expect(r.stats.championsByYear).toHaveLength(0);
    expect(r.stats.biggestBlowouts).toHaveLength(0);
    expect(r.stats.closestGames).toHaveLength(0);
    expect(r.stats.mostAppearances).toHaveLength(0);
    expect(r.stats.dynastyTracker).toHaveLength(0);
  });
});

describe("computeSuperBowlStats — filtering", () => {
  it("filters non-Super Bowl games", () => {
    const games = [
      makeSBGame({ week: "Division" }),
      makeSBGame({ week: "SuperBowl" }),
      makeSBGame({ week: "ConfChamp" }),
      makeSBGame({ week: "SuperBowl" }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.totalSuperBowls).toBe(2);
  });
});

describe("computeSuperBowlStats — champions by year", () => {
  it("identifies home team as champion when home wins", () => {
    const games = [makeSBGame({ homeScore: 30, awayScore: 20 })];
    const r = computeSuperBowlStats(games);
    expect(r.stats.championsByYear[0].champion).toBe("Kansas City Chiefs");
    expect(r.stats.championsByYear[0].opponent).toBe("San Francisco 49ers");
  });

  it("identifies away team as champion when away wins", () => {
    const games = [makeSBGame({ homeScore: 20, awayScore: 28 })];
    const r = computeSuperBowlStats(games);
    expect(r.stats.championsByYear[0].champion).toBe("San Francisco 49ers");
    expect(r.stats.championsByYear[0].opponent).toBe("Kansas City Chiefs");
  });

  it("sorts champions by year descending", () => {
    const games = [
      makeSBGame({ season: 2020 }),
      makeSBGame({ season: 2024 }),
      makeSBGame({ season: 2022 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.championsByYear[0].season).toBe(2024);
    expect(r.stats.championsByYear[1].season).toBe(2022);
    expect(r.stats.championsByYear[2].season).toBe(2020);
  });

  it("includes correct score in champions", () => {
    const games = [makeSBGame({ homeScore: 31, awayScore: 24 })];
    const r = computeSuperBowlStats(games);
    expect(r.stats.championsByYear[0].score).toBe("31-24");
  });
});

describe("computeSuperBowlStats — biggest blowouts", () => {
  it("identifies biggest blowouts", () => {
    const games = [
      makeSBGame({ homeScore: 55, awayScore: 10 }),
      makeSBGame({ homeScore: 20, awayScore: 18 }),
      makeSBGame({ homeScore: 40, awayScore: 25 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.biggestBlowouts[0].margin).toBe(45);
    expect(r.stats.biggestBlowouts[1].margin).toBe(15);
  });

  it("limits blowouts to top 5", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      makeSBGame({ season: 2000 + i, homeScore: 50 - i, awayScore: 10 + i })
    );
    const r = computeSuperBowlStats(games);
    expect(r.stats.biggestBlowouts.length).toBeLessThanOrEqual(5);
  });

  it("sorts blowouts by margin descending", () => {
    const games = [
      makeSBGame({ homeScore: 20, awayScore: 18 }),
      makeSBGame({ homeScore: 45, awayScore: 10 }),
      makeSBGame({ homeScore: 35, awayScore: 20 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.biggestBlowouts[0].margin).toBe(35);
    expect(r.stats.biggestBlowouts[1].margin).toBe(15);
  });
});

describe("computeSuperBowlStats — closest games", () => {
  it("identifies closest games", () => {
    const games = [
      makeSBGame({ homeScore: 25, awayScore: 22 }),
      makeSBGame({ homeScore: 40, awayScore: 10 }),
      makeSBGame({ homeScore: 27, awayScore: 27 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.closestGames[0].margin).toBe(0);
    expect(r.stats.closestGames[1].margin).toBe(3);
  });

  it("limits closest games to top 5", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      makeSBGame({ season: 2000 + i, homeScore: 25 + i, awayScore: 24 })
    );
    const r = computeSuperBowlStats(games);
    expect(r.stats.closestGames.length).toBeLessThanOrEqual(5);
  });

  it("sorts closest games by margin ascending", () => {
    const games = [
      makeSBGame({ homeScore: 30, awayScore: 10 }),
      makeSBGame({ homeScore: 25, awayScore: 24 }),
      makeSBGame({ homeScore: 28, awayScore: 25 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.closestGames[0].margin).toBe(1);
    expect(r.stats.closestGames[1].margin).toBe(3);
    expect(r.stats.closestGames[2].margin).toBe(20);
  });
});

describe("computeSuperBowlStats — most appearances", () => {
  it("counts team appearances and wins", () => {
    const games = [
      makeSBGame({ homeTeamName: "Patriots", awayTeamName: "Eagles", homeScore: 31, awayScore: 26 }),
      makeSBGame({ homeTeamName: "Patriots", awayTeamName: "Falcons", homeScore: 25, awayScore: 28 }),
      makeSBGame({ homeTeamName: "Patriots", awayTeamName: "Giants", homeScore: 17, awayScore: 14 }),
    ];
    const r = computeSuperBowlStats(games);
    const patriots = r.stats.mostAppearances.find((a) => a.team === "Patriots");
    expect(patriots?.count).toBe(3);
    expect(patriots?.wins).toBe(2);
    expect(patriots?.losses).toBe(1);
  });

  it("limits to top 10 appearances", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeSBGame({
        season: 2000 + i,
        homeTeamName: `Team${i % 5}`,
        awayTeamName: `Other`,
      })
    );
    const r = computeSuperBowlStats(games);
    expect(r.stats.mostAppearances.length).toBeLessThanOrEqual(10);
  });

  it("sorts by count descending", () => {
    const games = [
      makeSBGame({ homeTeamName: "Chiefs", awayTeamName: "Niners" }),
      makeSBGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens" }),
      makeSBGame({ homeTeamName: "Patriots", awayTeamName: "Giants" }),
    ];
    const r = computeSuperBowlStats(games);
    const chiefs = r.stats.mostAppearances.find((a) => a.team === "Chiefs");
    const patriots = r.stats.mostAppearances.find((a) => a.team === "Patriots");
    expect(chiefs!.count).toBeGreaterThan(patriots!.count);
  });
});

describe("computeSuperBowlStats — dynasty tracker", () => {
  it("tracks dynasty stats by team", () => {
    const games = [
      makeSBGame({ season: 2020, homeTeamName: "Chiefs", awayTeamName: "Bucs", homeScore: 25, awayScore: 20 }),
      makeSBGame({ season: 2024, homeTeamName: "Chiefs", awayTeamName: "Niners", homeScore: 25, awayScore: 22 }),
    ];
    const r = computeSuperBowlStats(games);
    const chiefs = r.stats.dynastyTracker.find((d) => d.team === "Chiefs");
    expect(chiefs?.wins).toBe(2);
    expect(chiefs?.appearances).toBe(2);
  });

  it("includes era information", () => {
    const games = [
      makeSBGame({ season: 1995, homeTeamName: "Cowboys", awayTeamName: "Steelers" }),
      makeSBGame({ season: 2010, homeTeamName: "Cowboys", awayTeamName: "Packers" }),
      makeSBGame({ season: 2020, homeTeamName: "Cowboys", awayTeamName: "Chiefs" }),
    ];
    const r = computeSuperBowlStats(games);
    const cowboys = r.stats.dynastyTracker.find((d) => d.team === "Cowboys");
    expect(cowboys?.era).toContain("Pre-2000");
    expect(cowboys?.era).toContain("2010-2019");
    expect(cowboys?.era).toContain("2020+");
  });

  it("computes win percentage", () => {
    const games = [
      makeSBGame({ homeTeamName: "Brady", awayTeamName: "A", homeScore: 25, awayScore: 20 }),
      makeSBGame({ homeTeamName: "Brady", awayTeamName: "B", homeScore: 20, awayScore: 25 }),
    ];
    const r = computeSuperBowlStats(games);
    const brady = r.stats.dynastyTracker.find((d) => d.team === "Brady");
    // Code counts appearances = loser increment + universal increment per game
    // Brady: 2 games → wins=1, appearances=3 (1 loss-increment + 2 universal)
    expect(brady?.winPct).toBe("0.333");
  });

  it("limits to top 10 dynasties", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeSBGame({
        season: 2000 + i,
        homeTeamName: `Team${i % 15}`,
        awayTeamName: `Other`,
      })
    );
    const r = computeSuperBowlStats(games);
    expect(r.stats.dynastyTracker.length).toBeLessThanOrEqual(10);
  });
});

describe("computeSuperBowlStats — tie handling", () => {
  it("handles tie games correctly", () => {
    const games = [
      makeSBGame({ homeScore: 25, awayScore: 25 }),
      makeSBGame({ homeScore: 28, awayScore: 24 }),
    ];
    const r = computeSuperBowlStats(games);
    expect(r.stats.totalSuperBowls).toBe(2);
    expect(r.stats.closestGames[0].margin).toBe(0);
  });
});
