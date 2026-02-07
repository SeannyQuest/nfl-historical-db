import { describe, it, expect } from "vitest";
import { computeOverUnderPerformers, type PerformanceGame } from "@/lib/over-under-performers";

const mockGame = (
  season: number = 2023,
  homeTeamName: string = "Kansas City Chiefs",
  awayTeamName: string = "Detroit Lions",
  homeScore: number = 21,
  awayScore: number = 20
): PerformanceGame => ({
  season,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
});

describe("over-under-performers.ts", () => {
  describe("computeOverUnderPerformers", () => {
    it("returns empty result for empty games", () => {
      const result = computeOverUnderPerformers([]);
      expect(result.teamPerformance).toEqual([]);
      expect(result.biggestOverperformers).toEqual([]);
      expect(result.biggestUnderperformers).toEqual([]);
      expect(result.luckyTeams).toEqual([]);
    });

    it("calculates actual wins for team", () => {
      const games = [
        mockGame(2023, "KC", "DET", 24, 20),
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 20, 24),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.actualWins).toBe(2);
    });

    it("calculates points for and against", () => {
      const games = [
        mockGame(2023, "KC", "DET", 24, 20),
        mockGame(2023, "KC", "DET", 21, 20),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.pointsFor).toBe(45);
      expect(kcPerf?.pointsAgainst).toBe(40);
    });

    it("calculates expected wins using Pythagorean expectation", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2023, "KC", "DET", 24, 14),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.expectedWins).toBeGreaterThan(0);
      expect(kcPerf?.expectedWins).toBeLessThanOrEqual(kcPerf?.gamesPlayed || 0);
    });

    it("calculates over/under performance correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2023, "KC", "DET", 24, 14),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.overUnder).toBe((kcPerf?.actualWins ?? 0) - (kcPerf?.expectedWins ?? 0));
    });

    it("identifies biggest overperformers", () => {
      const games = [
        mockGame(2023, "Lucky", "Unlucky", 28, 10),
        mockGame(2023, "Lucky", "Unlucky", 27, 11),
        mockGame(2023, "Lucky", "Unlucky", 26, 12),
      ];
      const result = computeOverUnderPerformers(games);
      expect(result.biggestOverperformers.length).toBeGreaterThan(0);
      const lucky = result.biggestOverperformers.find((p) => p.team === "Lucky");
      expect(lucky?.overUnder).toBeGreaterThanOrEqual(0);
    });

    it("identifies biggest underperformers", () => {
      const games = [
        mockGame(2023, "Unlucky", "Lucky", 10, 28),
        mockGame(2023, "Unlucky", "Lucky", 11, 27),
      ];
      const result = computeOverUnderPerformers(games);
      expect(result.biggestUnderperformers.length).toBeGreaterThan(0);
      const unlucky = result.biggestUnderperformers.find((p) => p.team === "Unlucky");
      expect(unlucky?.overUnder).toBeLessThanOrEqual(0);
    });

    it("limits overperformers to top 10", () => {
      const games: PerformanceGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, `Team${i}`, `Team${i + 1}`, 28, 10));
      }
      const result = computeOverUnderPerformers(games);
      expect(result.biggestOverperformers.length).toBeLessThanOrEqual(10);
    });

    it("limits underperformers to bottom 10", () => {
      const games: PerformanceGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, `Team${i}`, `Team${i + 1}`, 10, 28));
      }
      const result = computeOverUnderPerformers(games);
      expect(result.biggestUnderperformers.length).toBeLessThanOrEqual(10);
    });

    it("rounds over/under to 2 decimal places", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2023, "KC", "DET", 27, 11),
        mockGame(2023, "KC", "DET", 26, 12),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      const decimalPlaces = (kcPerf?.overUnder.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("identifies lucky teams that consistently overperform", () => {
      const games = [
        // KC overperforms in 2023 and 2024
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2023, "KC", "DET", 27, 11),
        mockGame(2024, "KC", "DET", 28, 10),
        mockGame(2024, "KC", "DET", 27, 11),
      ];
      const result = computeOverUnderPerformers(games);
      expect(result.luckyTeams.length).toBeGreaterThan(0);
      const kcLucky = result.luckyTeams.find((t) => t.team === "KC");
      expect(kcLucky?.consistentlyOver).toBe(true);
    });

    it("filters lucky teams to only those with 2+ seasons", () => {
      const games = [
        mockGame(2023, "OneYear", "DET", 28, 10),
        mockGame(2023, "OneYear", "DET", 27, 11),
        mockGame(2023, "TwoYears", "DET", 28, 10),
        mockGame(2024, "TwoYears", "DET", 27, 11),
      ];
      const result = computeOverUnderPerformers(games);
      const oneYearTeam = result.luckyTeams.find((t) => t.team === "OneYear");
      expect(oneYearTeam).toBeUndefined();
    });

    it("determines consistent overperformance correctly", () => {
      const games = [
        // KC: over/under of 1, 1, 1 = consistently over
        mockGame(2023, "Lucky", "DET", 28, 10),
        mockGame(2023, "Lucky", "DET", 27, 11),
        mockGame(2024, "Lucky", "DET", 28, 10),
        mockGame(2024, "Lucky", "DET", 27, 11),
      ];
      const result = computeOverUnderPerformers(games);
      const lucky = result.luckyTeams.find((t) => t.team === "Lucky");
      expect(lucky?.consistentlyOver).toBe(true);
    });

    it("calculates average over/under for lucky teams", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2024, "KC", "DET", 28, 10),
      ];
      const result = computeOverUnderPerformers(games);
      const kcLucky = result.luckyTeams.find((t) => t.team === "KC");
      expect(kcLucky?.avgOverUnder).toBeGreaterThan(0);
    });

    it("separates performance by season", () => {
      const games = [
        mockGame(2023, "KC", "DET", 24, 20),
        mockGame(2024, "KC", "DET", 28, 18),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerfs = result.teamPerformance.filter((p) => p.team === "KC");
      expect(kcPerfs.length).toBe(2);
      expect(kcPerfs[0].season).toBe(2023);
      expect(kcPerfs[1].season).toBe(2024);
    });

    it("handles away team performance correctly", () => {
      const games = [
        mockGame(2023, "DET", "KC", 20, 24),
        mockGame(2023, "DET", "KC", 20, 21),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.actualWins).toBe(2);
      expect(kcPerf?.pointsFor).toBe(45);
    });

    it("handles tie games correctly (no win or loss)", () => {
      const games = [
        mockGame(2023, "KC", "DET", 20, 20),
        mockGame(2023, "KC", "DET", 24, 20),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.actualWins).toBe(1);
    });

    it("rounds expected wins to 2 decimal places", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2023, "KC", "DET", 27, 11),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      const decimalPlaces = (kcPerf?.expectedWins.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("counts games played correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 24, 20),
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 20, 17),
      ];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.gamesPlayed).toBe(3);
    });

    it("includes all season data in lucky team trends", () => {
      const games = [
        mockGame(2023, "KC", "DET", 28, 10),
        mockGame(2024, "KC", "DET", 27, 11),
        mockGame(2025, "KC", "DET", 26, 12),
      ];
      const result = computeOverUnderPerformers(games);
      const kcLucky = result.luckyTeams.find((t) => t.team === "KC");
      expect(kcLucky?.seasons.length).toBe(3);
      expect(kcLucky?.overUnderValues.length).toBe(3);
    });

    it("sorts overperformers by highest over/under first", () => {
      const games = [
        // HighOver: 2 actual wins, ~1.5 expected = +0.5 over
        mockGame(2023, "HighOver", "Team1", 28, 10),
        mockGame(2023, "HighOver", "Team1", 27, 11),
        // LowOver: 2 actual wins, ~1.8 expected = +0.2 over
        mockGame(2023, "LowOver", "Team2", 24, 20),
        mockGame(2023, "LowOver", "Team2", 23, 21),
      ];
      const result = computeOverUnderPerformers(games);
      if (result.biggestOverperformers.length >= 2) {
        expect(result.biggestOverperformers[0].overUnder).toBeGreaterThanOrEqual(
          result.biggestOverperformers[1].overUnder
        );
      }
    });

    it("handles zero points in Pythagorean calculation", () => {
      const games = [mockGame(2023, "KC", "DET", 0, 0)];
      const result = computeOverUnderPerformers(games);
      const kcPerf = result.teamPerformance.find((p) => p.team === "KC");
      expect(kcPerf?.expectedWins).toBe(0);
    });
  });
});
