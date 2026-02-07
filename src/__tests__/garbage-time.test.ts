import { describe, it, expect } from "vitest";
import { computeGarbageTimeAnalysis, type GarbageTimeGame } from "@/lib/garbage-time";

function makeGame(overrides: Partial<GarbageTimeGame> = {}): GarbageTimeGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 38,
    awayScore: 21,
    fourthQuarterHomePts: 10,
    fourthQuarterAwayPts: 14,
    halftimeHomeScore: 28,
    halftimeAwayScore: 7,
    spread: 7,
    spreadResult: "COVERED",
    ...overrides,
  };
}

describe("computeGarbageTimeAnalysis — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeGarbageTimeAnalysis([]);
    expect(r.garbageTimeGames).toBe(0);
    expect(r.garbageTimePercentage).toBe(0);
    expect(r.teamStats).toHaveLength(0);
    expect(r.impactOnATS.coverRate).toBe(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeGarbageTimeAnalysis — detection", () => {
  it("identifies garbage time with 21+ halftime margin and losing team scoring more in Q4", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 10,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(1);
  });

  it("does not flag games with close halftime margin", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 17,
        halftimeAwayScore: 14,
        fourthQuarterHomePts: 10,
        fourthQuarterAwayPts: 7,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(0);
  });

  it("does not flag if winning team scored more in Q4", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 14,
        fourthQuarterAwayPts: 10,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(0);
  });

  it("flags away team garbage time", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 7,
        halftimeAwayScore: 28,
        fourthQuarterHomePts: 14,
        fourthQuarterAwayPts: 10,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(1);
  });
});

describe("computeGarbageTimeAnalysis — percentage calculation", () => {
  it("calculates garbage time percentage", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
      makeGame({
        halftimeHomeScore: 17,
        halftimeAwayScore: 14,
        fourthQuarterAwayPts: 3,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    // 1 out of 2 = 50%
    expect(r.garbageTimePercentage).toBe(50);
  });

  it("handles all games being garbage time", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
      makeGame({
        halftimeHomeScore: 35,
        halftimeAwayScore: 10,
        fourthQuarterAwayPts: 11,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimePercentage).toBe(100);
  });

  it("rounds percentage to 1 decimal", () => {
    const games = Array.from({ length: 3 }, (_, i) =>
      makeGame({
        season: 2024,
        halftimeHomeScore: i === 0 ? 28 : 17,
        halftimeAwayScore: i === 0 ? 7 : 14,
        fourthQuarterAwayPts: i === 0 ? 14 : 7,
      })
    );
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimePercentage.toString().split(".")[1].length).toBeLessThanOrEqual(1);
  });
});

describe("computeGarbageTimeAnalysis — team stats", () => {
  it("tracks games with garbage time by team", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.teamStats).toHaveLength(2);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(chiefs?.gamesWithGarbageTime).toBe(1);
    expect(ravens?.gamesWithGarbageTime).toBe(1);
  });

  it("tracks points scored in garbage time", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 10,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(ravens?.garbageTimePtsScored).toBe(14);
  });

  it("tracks points allowed in garbage time", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 10,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(ravens?.garbageTimePtsAllowed).toBe(10);
  });

  it("sorts teams by garbage time points scored", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 7,
        fourthQuarterAwayPts: 21,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.teamStats[0].team).toBe("Ravens");
  });
});

describe("computeGarbageTimeAnalysis — ATS impact", () => {
  it("counts garbage time covers", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.impactOnATS.garbageTimeCovers).toBe(1);
  });

  it("counts garbage time non-covers", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
        spreadResult: "LOST",
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.impactOnATS.garbageTimeNonCovers).toBe(1);
  });

  it("calculates garbage time cover rate", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
        spreadResult: "COVERED",
      }),
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
        spreadResult: "LOST",
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    // 1 cover out of 2 = 0.5
    expect(r.impactOnATS.coverRate).toBe(0.5);
  });

  it("handles null spread data", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
        spread: null,
        spreadResult: null,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.impactOnATS.garbageTimeCovers).toBe(0);
    expect(r.impactOnATS.garbageTimeNonCovers).toBe(0);
  });

  it("ignores non-garbage-time games for ATS", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 17,
        halftimeAwayScore: 14,
        fourthQuarterAwayPts: 7,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.impactOnATS.garbageTimeCovers).toBe(0);
    expect(r.impactOnATS.garbageTimeNonCovers).toBe(0);
  });
});

describe("computeGarbageTimeAnalysis — season trends", () => {
  it("tracks garbage time percentage by season", () => {
    const games = [
      makeGame({
        season: 2023,
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
      makeGame({
        season: 2024,
        halftimeHomeScore: 17,
        halftimeAwayScore: 14,
        fourthQuarterAwayPts: 7,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.seasonTrends).toHaveLength(2);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[0].garbageTimePct).toBe(100);
  });

  it("sorts seasons chronologically", () => {
    const games = [
      makeGame({
        season: 2024,
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
      makeGame({
        season: 2023,
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[1].season).toBe(2024);
  });
});

describe("computeGarbageTimeAnalysis — edge cases", () => {
  it("handles exactly 21-point halftime margin", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(1);
  });

  it("handles equal Q4 scoring", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 28,
        halftimeAwayScore: 7,
        fourthQuarterHomePts: 7,
        fourthQuarterAwayPts: 7,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(0);
  });

  it("handles very large margins", () => {
    const games = [
      makeGame({
        halftimeHomeScore: 50,
        halftimeAwayScore: 0,
        fourthQuarterAwayPts: 14,
      }),
    ];
    const r = computeGarbageTimeAnalysis(games);
    expect(r.garbageTimeGames).toBe(1);
  });
});
