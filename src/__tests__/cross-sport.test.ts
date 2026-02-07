import { describe, it, expect } from "vitest";
import { computeCrossSportComparison } from "@/lib/cross-sport";

describe("Cross-Sport Comparison", () => {
  it("should return empty array with no games", () => {
    const results = computeCrossSportComparison([], [], []);

    expect(results).toHaveLength(0);
  });

  it("should compute NFL statistics", () => {
    const nflGames = [
      { homeScore: 28, awayScore: 21 },
      { homeScore: 35, awayScore: 14 },
      { homeScore: 21, awayScore: 21 },
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    expect(results).toHaveLength(1);
    expect(results[0].sport).toBe("NFL");
    expect(results[0].homeWinPct).toBe("66.67"); // 2 home wins out of 3
  });

  it("should compute average points per game for NFL", () => {
    const nflGames = [
      { homeScore: 28, awayScore: 21 }, // Total: 49
      { homeScore: 35, awayScore: 14 }, // Total: 49
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    expect(results[0].sport).toBe("NFL");
    const avgPoints = parseFloat(results[0].avgPointsPerGame);
    expect(avgPoints).toBe(49); // (49 + 49) / 2 = 49
  });

  it("should calculate margin of victory correctly", () => {
    const nflGames = [
      { homeScore: 28, awayScore: 20 }, // Margin: 8
      { homeScore: 30, awayScore: 10 }, // Margin: 20
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    expect(results[0].sport).toBe("NFL");
    const avgMargin = parseFloat(results[0].avgMarginOfVictory);
    expect(avgMargin).toBe(14); // (8 + 20) / 2 = 14
  });

  it("should identify blowout percentage (20+ point margin)", () => {
    const nflGames = [
      { homeScore: 35, awayScore: 10 }, // Blowout: 25 point margin
      { homeScore: 28, awayScore: 21 }, // Not a blowout: 7 point margin
      { homeScore: 40, awayScore: 15 }, // Blowout: 25 point margin
      { homeScore: 24, awayScore: 23 }, // Not a blowout: 1 point margin
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    expect(results[0].sport).toBe("NFL");
    const blowoutPct = parseFloat(results[0].blowoutPct);
    expect(blowoutPct).toBe(50); // 2 out of 4 games
  });

  it("should compute CFB statistics", () => {
    const cfbGames = [
      { homeScore: 35, awayScore: 31 },
      { homeScore: 42, awayScore: 39 },
    ];

    const results = computeCrossSportComparison([], cfbGames, []);

    expect(results).toHaveLength(1);
    expect(results[0].sport).toBe("CFB");
  });

  it("should compute CBB statistics", () => {
    const cbbGames = [
      { homeScore: 75, awayScore: 68 },
      { homeScore: 82, awayScore: 79 },
    ];

    const results = computeCrossSportComparison([], [], cbbGames);

    expect(results).toHaveLength(1);
    expect(results[0].sport).toBe("CBB");
  });

  it("should compute all three sports together", () => {
    const nflGames = [{ homeScore: 28, awayScore: 21 }];
    const cfbGames = [{ homeScore: 35, awayScore: 31 }];
    const cbbGames = [{ homeScore: 75, awayScore: 68 }];

    const results = computeCrossSportComparison(nflGames, cfbGames, cbbGames);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.sport)).toEqual(["NFL", "CFB", "CBB"]);
  });

  it("should format percentages with 2 decimal places", () => {
    const nflGames = [
      { homeScore: 28, awayScore: 21 },
      { homeScore: 35, awayScore: 14 },
      { homeScore: 21, awayScore: 17 },
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    const homeWinPct = results[0].homeWinPct;
    expect(homeWinPct).toMatch(/^\d+\.\d{2}$/);
  });

  it("should handle edge case where all games are blowouts", () => {
    const nflGames = [
      { homeScore: 50, awayScore: 10 },
      { homeScore: 48, awayScore: 20 },
      { homeScore: 55, awayScore: 15 },
    ];

    const results = computeCrossSportComparison(nflGames, [], []);

    expect(results[0].sport).toBe("NFL");
    const blowoutPct = parseFloat(results[0].blowoutPct);
    expect(blowoutPct).toBe(100);
  });
});
