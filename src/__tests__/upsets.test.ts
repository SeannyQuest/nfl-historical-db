import { describe, it, expect } from "vitest";
import { computeUpsets, type UpsetGame } from "@/lib/upsets";

function makeGame(overrides: Partial<UpsetGame> = {}): UpsetGame {
  return {
    season: 2024,
    date: "2024-01-01T12:00:00.000Z",
    week: "1",
    isPlayoff: false,
    primetime: null,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Buffalo Bills",
    homeScore: 27,
    awayScore: 20,
    spread: -3.5, // Home favored
    playoffRound: null,
    ...overrides,
  };
}

describe("computeUpsets — empty", () => {
  it("returns empty data for no games", () => {
    const result = computeUpsets([]);
    expect(result.biggestUpsets).toHaveLength(0);
    expect(result.overallUpsetRate).toBe(".000");
    expect(result.upsetRateBySeasonTrend).toHaveLength(0);
  });
});

describe("computeUpsets — upset detection", () => {
  it("detects away underdog upset", () => {
    const game = makeGame({
      spread: 3.5, // Home favored, away underdog
      homeScore: 20,
      awayScore: 24,
    });
    const result = computeUpsets([game]);
    expect(result.biggestUpsets).toHaveLength(1);
    expect(result.overallUpsetRate).toBe("1.000");
  });

  it("detects home underdog upset", () => {
    const game = makeGame({
      spread: -7.5, // Away favored, home underdog
      homeScore: 28,
      awayScore: 24,
    });
    const result = computeUpsets([game]);
    expect(result.biggestUpsets).toHaveLength(1);
    expect(result.overallUpsetRate).toBe("1.000");
  });

  it("does not count favorite win as upset", () => {
    const game = makeGame({
      spread: 3.5, // Home favored (positive spread means home is favorite), home wins
      homeScore: 27,
      awayScore: 20,
    });
    const result = computeUpsets([game]);
    expect(result.biggestUpsets).toHaveLength(0);
    expect(result.overallUpsetRate).toBe("0.000");
  });

  it("ignores games without spread data", () => {
    const game = makeGame({ spread: null });
    const result = computeUpsets([game]);
    expect(result.biggestUpsets).toHaveLength(0);
    expect(result.overallUpsetRate).toBe(".000");
  });
});

describe("computeUpsets — upset rate by season", () => {
  it("tracks upset rate by season", () => {
    const result = computeUpsets([
      makeGame({ season: 2023, spread: 3.5, homeScore: 20, awayScore: 24 }), // away underdog wins = upset
      makeGame({ season: 2023, date: "2024-01-08T12:00:00.000Z", spread: 3.5, homeScore: 27, awayScore: 20 }), // away underdog loses = not upset
      makeGame({ season: 2024, date: "2024-01-15T12:00:00.000Z", spread: 7.0, homeScore: 20, awayScore: 28 }), // away underdog wins = upset
    ]);
    const season2023 = result.upsetRateBySeasonTrend.find((s) => s.season === 2023);
    expect(season2023?.upsetPct).toBe("0.500");
  });

  it("sorts seasons in descending order", () => {
    const result = computeUpsets([
      makeGame({ season: 2022, spread: 3.5, homeScore: 20, awayScore: 24 }),
      makeGame({ season: 2024, date: "2024-01-08T12:00:00.000Z", spread: 3.5, homeScore: 20, awayScore: 24 }),
      makeGame({ season: 2023, date: "2024-01-15T12:00:00.000Z", spread: 3.5, homeScore: 20, awayScore: 24 }),
    ]);
    expect(result.upsetRateBySeasonTrend[0].season).toBe(2024);
    expect(result.upsetRateBySeasonTrend[1].season).toBe(2023);
    expect(result.upsetRateBySeasonTrend[2].season).toBe(2022);
  });
});

describe("computeUpsets — upset rate by spread range", () => {
  it("breaks down upsets by spread range", () => {
    const result = computeUpsets([
      makeGame({ spread: 2.0, homeScore: 20, awayScore: 24 }), // PK-3pt upset
      makeGame({ date: "2024-01-08T12:00:00.000Z", spread: 5.0, homeScore: 20, awayScore: 24 }), // 3-7pt upset
      makeGame({ date: "2024-01-15T12:00:00.000Z", spread: 8.0, homeScore: 20, awayScore: 24 }), // 7-10pt upset
      makeGame({ date: "2024-01-22T12:00:00.000Z", spread: 15.0, homeScore: 20, awayScore: 24 }), // 10+pt upset
    ]);
    const ranges = result.upsetRateBySpreadRange;
    expect(ranges.find((r) => r.range === "PK-3pt")).toBeTruthy();
    expect(ranges.find((r) => r.range === "3-7pt")).toBeTruthy();
    expect(ranges.find((r) => r.range === "7-10pt")).toBeTruthy();
    expect(ranges.find((r) => r.range === "10+pt")).toBeTruthy();
  });

  it("returns only ranges with data", () => {
    const result = computeUpsets([
      makeGame({ spread: 2.0, homeScore: 20, awayScore: 24 }), // Only PK-3pt
    ]);
    expect(result.upsetRateBySpreadRange).toHaveLength(1);
    expect(result.upsetRateBySpreadRange[0].range).toBe("PK-3pt");
  });
});

describe("computeUpsets — upset rate by primetime", () => {
  it("breaks down upsets by primetime slot", () => {
    const result = computeUpsets([
      makeGame({ primetime: "SNF", spread: 3.5, homeScore: 20, awayScore: 24 }),
      makeGame({ primetime: "SNF", date: "2024-01-08T12:00:00.000Z", spread: 3.5, homeScore: 20, awayScore: 24 }),
      makeGame({ primetime: "MNF", date: "2024-01-15T12:00:00.000Z", spread: -3.5, homeScore: 27, awayScore: 20 }),
    ]);
    const snf = result.upsetRateByPrimetime.find((p) => p.slot === "SNF");
    expect(snf?.games).toBe(2);
    expect(snf?.upsets).toBe(2);
    expect(snf?.upsetPct).toBe("1.000");
  });
});

describe("computeUpsets — upset rate by playoff round", () => {
  it("breaks down upsets by playoff round", () => {
    const result = computeUpsets([
      makeGame({
        isPlayoff: true,
        playoffRound: "WildCard",
        spread: 3.5,
        homeScore: 20,
        awayScore: 24,
      }),
      makeGame({
        isPlayoff: true,
        playoffRound: "Divisional",
        date: "2024-01-08T12:00:00.000Z",
        spread: 7.0,
        homeScore: 20,
        awayScore: 28,
      }),
    ]);
    const wildcard = result.upsetRateByPlayoffRound.find((r) => r.round === "WildCard");
    expect(wildcard?.upsets).toBe(1);
  });
});

describe("computeUpsets — biggest upsets", () => {
  it("returns biggest upsets by margin vs spread", () => {
    const result = computeUpsets([
      makeGame({ spread: 3.5, homeScore: 10, awayScore: 20 }), // 10 pt win, 3.5 spread = 6.5 margin
      makeGame({ date: "2024-01-08T12:00:00.000Z", spread: 10.0, homeScore: 15, awayScore: 30 }), // 15 pt win, 10 spread = 5 margin
    ]);
    expect(result.biggestUpsets[0].spreadMarginOfVictory).toBeGreaterThanOrEqual(result.biggestUpsets[1].spreadMarginOfVictory);
  });

  it("limits biggest upsets to 15", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        spread: 5.0,
        homeScore: 10,
        awayScore: 20,
      })
    );
    const result = computeUpsets(games);
    expect(result.biggestUpsets.length).toBeLessThanOrEqual(15);
  });
});

describe("computeUpsets — most common upsetting teams", () => {
  it("tracks which teams win as underdogs", () => {
    const result = computeUpsets([
      makeGame({ awayTeamName: "Bills", spread: 3.5, homeScore: 20, awayScore: 24 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", awayTeamName: "Bills", spread: 5.0, homeScore: 18, awayScore: 25 }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", awayTeamName: "Ravens", spread: 7.0, homeScore: 15, awayScore: 28 }),
    ]);
    const bills = result.mostCommonUpsettingTeams.find((t) => t.team === "Bills");
    expect(bills?.upsetWins).toBe(2);
  });

  it("calculates upset win percentage", () => {
    const result = computeUpsets([
      makeGame({ awayTeamName: "Bills", spread: 3.5, homeScore: 20, awayScore: 24 }), // Bills (away underdog) wins = upset
      makeGame({ date: "2024-01-08T12:00:00.000Z", awayTeamName: "Bills", spread: 3.5, homeScore: 20, awayScore: 24 }), // Bills (away underdog) wins = upset
      makeGame({ date: "2024-01-15T12:00:00.000Z", awayTeamName: "Bills", spread: 3.5, homeScore: 27, awayScore: 20 }), // Bills (away underdog) loses = not upset
    ]);
    const bills = result.mostCommonUpsettingTeams.find((t) => t.team === "Bills");
    expect(bills?.upsetWins).toBe(2);
    expect(bills?.totalWins).toBe(3);
  });

  it("limits teams to 15", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        date: new Date(2024, 0, i + 1).toISOString(),
        awayTeamName: `Team${i}`,
        spread: 5.0,
        homeScore: 10,
        awayScore: 20,
      })
    );
    const result = computeUpsets(games);
    expect(result.mostCommonUpsettingTeams.length).toBeLessThanOrEqual(15);
  });
});

describe("computeUpsets — overall upset rate", () => {
  it("computes overall upset rate", () => {
    const result = computeUpsets([
      makeGame({ spread: 3.5, homeScore: 20, awayScore: 24 }), // away underdog wins = upset
      makeGame({ date: "2024-01-08T12:00:00.000Z", spread: 3.5, homeScore: 20, awayScore: 24 }), // away underdog wins = upset
      makeGame({ date: "2024-01-15T12:00:00.000Z", spread: 3.5, homeScore: 27, awayScore: 20 }), // away underdog loses = not upset
    ]);
    expect(result.overallUpsetRate).toBe("0.667");
  });
});
