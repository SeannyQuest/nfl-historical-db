import { describe, it, expect } from "vitest";
import { computeHalfPerformance, type HalfGame } from "@/lib/half-performance";

const mockGame = (
  season: number = 2023,
  week: number = 1,
  homeTeamName: string = "Kansas City Chiefs",
  awayTeamName: string = "Detroit Lions",
  homeScore: number = 21,
  awayScore: number = 20
): HalfGame => ({
  season,
  week,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
});

describe("half-performance.ts", () => {
  describe("computeHalfPerformance", () => {
    it("returns empty result for empty games", () => {
      const result = computeHalfPerformance([]);
      expect(result.teamHalfRecords).toEqual([]);
      expect(result.biggestImprovers).toEqual([]);
      expect(result.biggestDecliners).toEqual([]);
      expect(result.seasonTrends).toEqual([]);
    });

    it("categorizes games into first and second half", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 9, "KC", "DET", 21, 20),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 17, "KC", "DET", 24, 15),
      ];
      const result = computeHalfPerformance(games);
      const kcRecord = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(kcRecord?.firstHalfWins).toBe(2);
      expect(kcRecord?.secondHalfWins).toBe(2);
    });

    it("calculates first half win percentage", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "KC", "DET", 24, 20),
        mockGame(2023, 3, "KC", "DET", 20, 24),
      ];
      const result = computeHalfPerformance(games);
      const kcRecord = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(kcRecord?.firstHalfWinPct).toBeCloseTo(0.6667, 3);
    });

    it("calculates second half win percentage", () => {
      const games = [
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
        mockGame(2023, 12, "KC", "DET", 20, 17),
      ];
      const result = computeHalfPerformance(games);
      const kcRecord = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(kcRecord?.secondHalfWinPct).toBe(1.0);
    });

    it("tracks improvement as second half win pct minus first half win pct", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      const kcRecord = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(kcRecord?.improvement).toBeGreaterThan(0);
      expect(kcRecord?.improvement).toBeCloseTo(1.0, 2);
    });

    it("identifies biggest improvers", () => {
      const games = [
        // KC: 0-2 first half, 2-0 second half = +1.0
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      expect(result.biggestImprovers.length).toBeGreaterThan(0);
      expect(result.biggestImprovers[0].team).toBe("KC");
      expect(result.biggestImprovers[0].improvement).toBeGreaterThan(0);
    });

    it("identifies biggest decliners", () => {
      const games = [
        // KC: 2-0 first half, 0-2 second half = -1.0
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "KC", "DET", 24, 20),
        mockGame(2023, 10, "KC", "DET", 18, 28),
        mockGame(2023, 11, "KC", "DET", 20, 24),
      ];
      const result = computeHalfPerformance(games);
      expect(result.biggestDecliners.length).toBeGreaterThan(0);
      expect(result.biggestDecliners[0].team).toBe("KC");
      expect(result.biggestDecliners[0].improvement).toBeLessThan(0);
    });

    it("limits improvers to top 10", () => {
      const games: HalfGame[] = [];
      for (let i = 0; i < 15; i++) {
        games.push(
          mockGame(2023, 1, `Team${i}`, `Team${i + 1}`, 20, 24),
          mockGame(2023, 2, `Team${i}`, `Team${i + 1}`, 20, 24),
          mockGame(2023, 10, `Team${i}`, `Team${i + 1}`, 28, 18),
          mockGame(2023, 11, `Team${i}`, `Team${i + 1}`, 24, 20)
        );
      }
      const result = computeHalfPerformance(games);
      expect(result.biggestImprovers.length).toBeLessThanOrEqual(10);
    });

    it("limits decliners to bottom 10", () => {
      const games: HalfGame[] = [];
      for (let i = 0; i < 15; i++) {
        games.push(
          mockGame(2023, 1, `Team${i}`, `Team${i + 1}`, 28, 18),
          mockGame(2023, 2, `Team${i}`, `Team${i + 1}`, 24, 20),
          mockGame(2023, 10, `Team${i}`, `Team${i + 1}`, 20, 24),
          mockGame(2023, 11, `Team${i}`, `Team${i + 1}`, 20, 24)
        );
      }
      const result = computeHalfPerformance(games);
      expect(result.biggestDecliners.length).toBeLessThanOrEqual(10);
    });

    it("calculates season league trends for first half", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 1, "TB", "NO", 20, 24),
      ];
      const result = computeHalfPerformance(games);
      const seasonTrend = result.seasonTrends.find((t) => t.season === 2023);
      expect(seasonTrend?.avgFirstHalfWinPct).toBeDefined();
    });

    it("calculates season league trends for second half", () => {
      const games = [
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 10, "TB", "NO", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      const seasonTrend = result.seasonTrends.find((t) => t.season === 2023);
      expect(seasonTrend?.avgSecondHalfWinPct).toBeDefined();
    });

    it("calculates league improvement trend", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      const seasonTrend = result.seasonTrends.find((t) => t.season === 2023);
      expect(seasonTrend?.leagueImprovement).toBeDefined();
    });

    it("separates records by season", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2024, 1, "KC", "DET", 28, 18),
      ];
      const result = computeHalfPerformance(games);
      const kcRecords = result.teamHalfRecords.filter((r) => r.team === "KC");
      expect(kcRecords.length).toBe(2);
      expect(kcRecords[0].season).toBe(2023);
      expect(kcRecords[1].season).toBe(2024);
    });

    it("formats first half record string correctly", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 3, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
        mockGame(2023, 12, "KC", "DET", 21, 17),
      ];
      const result = computeHalfPerformance(games);
      const improver = result.biggestImprovers.find((i) => i.team === "KC");
      expect(improver?.firstHalfRecord).toBe("0-3");
    });

    it("formats second half record string correctly", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      const improver = result.biggestImprovers.find((i) => i.team === "KC");
      expect(improver?.secondHalfRecord).toBe("2-0");
    });

    it("handles teams with no losses", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "KC", "DET", 28, 21),
        mockGame(2023, 3, "KC", "DET", 21, 17),
      ];
      const result = computeHalfPerformance(games);
      const record = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(record?.firstHalfWinPct).toBe(1.0);
    });

    it("handles teams with no wins", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 17, 20),
        mockGame(2023, 2, "KC", "DET", 14, 24),
      ];
      const result = computeHalfPerformance(games);
      const record = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(record?.firstHalfWinPct).toBe(0);
    });

    it("handles tie games correctly", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 20, 20),
        mockGame(2023, 2, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      const record = result.teamHalfRecords.find((r) => r.team === "KC");
      expect(record?.firstHalfWins).toBe(1);
      expect(record?.firstHalfLosses).toBe(0);
    });

    it("sorts season trends by season", () => {
      const games = [
        mockGame(2024, 1, "KC", "DET", 24, 20),
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2022, 1, "KC", "DET", 24, 20),
      ];
      const result = computeHalfPerformance(games);
      expect(result.seasonTrends[0].season).toBe(2022);
      expect(result.seasonTrends[1].season).toBe(2023);
      expect(result.seasonTrends[2].season).toBe(2024);
    });

    it("sorts improvers by highest improvement first", () => {
      const games = [
        // KC: 0-3 first half, 3-0 second half = +1.0
        mockGame(2023, 1, "KC", "DET", 20, 24),
        mockGame(2023, 2, "KC", "DET", 20, 24),
        mockGame(2023, 3, "KC", "DET", 20, 24),
        mockGame(2023, 10, "KC", "DET", 28, 18),
        mockGame(2023, 11, "KC", "DET", 24, 20),
        mockGame(2023, 12, "KC", "DET", 21, 17),
        // TB: 1-2 first half, 2-1 second half = +0.3
        mockGame(2023, 1, "TB", "NO", 24, 20),
        mockGame(2023, 2, "TB", "NO", 20, 24),
        mockGame(2023, 3, "TB", "NO", 20, 24),
        mockGame(2023, 10, "TB", "NO", 28, 18),
        mockGame(2023, 11, "TB", "NO", 24, 20),
        mockGame(2023, 12, "TB", "NO", 20, 24),
      ];
      const result = computeHalfPerformance(games);
      expect(result.biggestImprovers[0].team).toBe("KC");
      expect(result.biggestImprovers[0].improvement).toBeGreaterThan(result.biggestImprovers[1].improvement);
    });
  });
});
