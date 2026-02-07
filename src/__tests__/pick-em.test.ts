import { describe, it, expect } from "vitest";
import { computePickEmTracker, type PickEmGame } from "@/lib/pick-em";

function makeGame(overrides: Partial<PickEmGame> = {}): PickEmGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 20,
    spread: 5,
    ...overrides,
  };
}

describe("computePickEmTracker — empty and no spread data", () => {
  it("returns zeroes for no games", () => {
    const r = computePickEmTracker([]);
    expect(r.pickEmGames.count).toBe(0);
    expect(r.closeSpreadGames.count).toBe(0);
    expect(r.bigSpreadGames.count).toBe(0);
  });

  it("ignores games with no spread", () => {
    const games = [
      makeGame({ spread: null }),
      makeGame({ spread: null }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(0);
    expect(r.closeSpreadGames.count).toBe(0);
  });
});

describe("computePickEmTracker — pick-em identification", () => {
  it("identifies spread of 0 as pick-em", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 30, awayScore: 20 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(1);
  });

  it("identifies spread of +1 as pick-em", () => {
    const games = [
      makeGame({ spread: 1, homeScore: 28, awayScore: 22 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(1);
  });

  it("identifies spread of -1 as pick-em", () => {
    const games = [
      makeGame({ spread: -1, homeScore: 25, awayScore: 24 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(1);
  });

  it("excludes spread > 1 from pick-em", () => {
    const games = [
      makeGame({ spread: 1.5, homeScore: 30, awayScore: 20 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(0);
  });

  it("excludes spread < -1 from pick-em", () => {
    const games = [
      makeGame({ spread: -1.5, homeScore: 30, awayScore: 20 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(0);
  });
});

describe("computePickEmTracker — pick-em home win pct", () => {
  it("calculates home win pct when all home wins", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 1, homeScore: 28, awayScore: 18 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.homeWinPct).toBe(100);
  });

  it("calculates home win pct when all away wins", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 20, awayScore: 30 }),
      makeGame({ spread: 0.5, homeScore: 18, awayScore: 28 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.homeWinPct).toBe(0);
  });

  it("calculates home win pct for mixed results", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 1, homeScore: 20, awayScore: 30 }),
      makeGame({ spread: 0.5, homeScore: 25, awayScore: 25 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.homeWinPct).toBe((1 / 3) * 100);
  });
});

describe("computePickEmTracker — close spread games", () => {
  it("includes pick-em games in close spread category", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 1, homeScore: 28, awayScore: 22 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.count).toBe(2);
  });

  it("includes spread ±3 as close spread", () => {
    const games = [
      makeGame({ spread: 3, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: -3, homeScore: 25, awayScore: 24 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.count).toBe(2);
  });

  it("excludes spread > 3 from close spread", () => {
    const games = [
      makeGame({ spread: 3.5, homeScore: 30, awayScore: 20 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.count).toBe(0);
  });

  it("calculates close spread home win pct", () => {
    const games = [
      makeGame({ spread: 2, homeScore: 30, awayScore: 20 }),
      makeGame({ spread: 1.5, homeScore: 20, awayScore: 30 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.homeWinPct).toBe(50);
  });

  it("calculates close spread avg margin", () => {
    const games = [
      makeGame({ spread: 1, homeScore: 30, awayScore: 20 }), // margin 10
      makeGame({ spread: 2, homeScore: 28, awayScore: 20 }), // margin 8
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.avgMargin).toBe(9);
  });
});

describe("computePickEmTracker — big spread games", () => {
  it("identifies spread >= 10 as big spread", () => {
    const games = [
      makeGame({ spread: 10, homeScore: 40, awayScore: 20 }),
      makeGame({ spread: 14, homeScore: 38, awayScore: 18 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.count).toBe(2);
  });

  it("excludes spread < 10 from big spread", () => {
    const games = [
      makeGame({ spread: 9.5, homeScore: 35, awayScore: 20 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.count).toBe(0);
  });

  it("calculates favorite win pct when home is favorite", () => {
    const games = [
      makeGame({ spread: 10, homeScore: 40, awayScore: 20 }),
      makeGame({ spread: 12, homeScore: 35, awayScore: 25 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.favoriteWinPct).toBe(100);
  });

  it("calculates favorite win pct when away is favorite", () => {
    const games = [
      makeGame({ spread: -10, homeScore: 20, awayScore: 40 }),
      makeGame({ spread: -12, homeScore: 25, awayScore: 35 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.favoriteWinPct).toBe(100);
  });

  it("calculates favorite win pct for mixed results", () => {
    const games = [
      makeGame({ spread: 10, homeScore: 40, awayScore: 20 }), // favorite wins
      makeGame({ spread: 10, homeScore: 20, awayScore: 40 }), // favorite loses
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.favoriteWinPct).toBe(50);
  });

  it("calculates big spread avg margin", () => {
    const games = [
      makeGame({ spread: 10, homeScore: 40, awayScore: 20 }), // margin 20
      makeGame({ spread: 12, homeScore: 38, awayScore: 24 }), // margin 14
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.avgMargin).toBe(17);
  });
});

describe("computePickEmTracker — spread distribution", () => {
  it("categorizes pick-em spread range", () => {
    const games = [
      makeGame({ spread: 0 }),
      makeGame({ spread: 0.5 }),
    ];
    const r = computePickEmTracker(games);
    const pickEm = r.spreadDistribution.find((d) => d.range === "Pick-em (±0-1)");
    expect(pickEm?.count).toBe(2);
  });

  it("categorizes close spread range", () => {
    const games = [
      makeGame({ spread: 1.5 }),
      makeGame({ spread: 2 }),
    ];
    const r = computePickEmTracker(games);
    const close = r.spreadDistribution.find((d) => d.range === "Close (±1.5-3)");
    expect(close?.count).toBe(2);
  });

  it("categorizes medium spread range", () => {
    const games = [
      makeGame({ spread: 4 }),
      makeGame({ spread: 6 }),
    ];
    const r = computePickEmTracker(games);
    const medium = r.spreadDistribution.find((d) => d.range === "Medium (±3.5-7)");
    expect(medium?.count).toBe(2);
  });

  it("categorizes large spread range", () => {
    const games = [
      makeGame({ spread: 8 }),
      makeGame({ spread: 12 }),
    ];
    const r = computePickEmTracker(games);
    const large = r.spreadDistribution.find((d) => d.range === "Large (±7.5-14)");
    expect(large?.count).toBe(2);
  });

  it("categorizes huge spread range", () => {
    const games = [
      makeGame({ spread: 15 }),
      makeGame({ spread: 25 }),
    ];
    const r = computePickEmTracker(games);
    const huge = r.spreadDistribution.find((d) => d.range === "Huge (±14+)");
    expect(huge?.count).toBe(2);
  });

  it("calculates percentage for each range", () => {
    const games = [
      makeGame({ spread: 0 }),
      makeGame({ spread: 0 }),
      makeGame({ spread: 5 }),
      makeGame({ spread: 5 }),
    ];
    const r = computePickEmTracker(games);
    const pickEm = r.spreadDistribution.find((d) => d.range === "Pick-em (±0-1)");
    expect(pickEm?.pct).toBe(50);
  });

  it("excludes ranges with zero games", () => {
    const games = [
      makeGame({ spread: 0 }),
      makeGame({ spread: 0 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.spreadDistribution).toHaveLength(1);
    expect(r.spreadDistribution[0].range).toBe("Pick-em (±0-1)");
  });
});

describe("computePickEmTracker — multiple seasons", () => {
  it("treats games from all seasons together", () => {
    const games = [
      makeGame({ season: 2023, spread: 0, homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, spread: 1, homeScore: 28, awayScore: 22 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.count).toBe(2);
  });
});

describe("computePickEmTracker — edge cases", () => {
  it("handles negative spreads correctly", () => {
    const games = [
      makeGame({ spread: -5, homeScore: 20, awayScore: 30 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.closeSpreadGames.count).toBe(0);
  });

  it("handles very large spread margins", () => {
    const games = [
      makeGame({ spread: 40, homeScore: 55, awayScore: 10 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.bigSpreadGames.count).toBe(1);
    expect(r.bigSpreadGames.favoriteWinPct).toBe(100);
  });

  it("handles tie games in spread calculation", () => {
    const games = [
      makeGame({ spread: 0, homeScore: 25, awayScore: 25 }),
    ];
    const r = computePickEmTracker(games);
    expect(r.pickEmGames.homeWinPct).toBe(0);
  });

  it("all games with no spreads", () => {
    const games = [
      makeGame({ spread: null }),
      makeGame({ spread: null }),
    ];
    const r = computePickEmTracker(games);
    expect(r.spreadDistribution).toHaveLength(0);
  });
});
