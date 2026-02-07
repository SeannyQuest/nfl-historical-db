import { describe, it, expect } from "vitest";
import { computePointDiffTrends, type PointDiffGame } from "@/lib/point-diff-trends";

const mockGame = (
  season: number = 2023,
  week: number = 1,
  homeTeamName: string = "Kansas City Chiefs",
  awayTeamName: string = "Detroit Lions",
  homeScore: number = 21,
  awayScore: number = 20
): PointDiffGame => ({
  season,
  week,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
});

describe("point-diff-trends.ts", () => {
  describe("computePointDiffTrends", () => {
    it("returns empty result for empty games", () => {
      const result = computePointDiffTrends([]);
      expect(result.teamTrends).toEqual([]);
      expect(result.bestPointDiff).toEqual([]);
      expect(result.worstPointDiff).toEqual([]);
      expect(result.pythagoreanWins).toEqual([]);
      expect(result.leagueTrends).toEqual([]);
    });

    it("calculates point differential for home team", () => {
      const games = [mockGame(2023, 1, "KC", "DET", 24, 20)];
      const result = computePointDiffTrends(games);
      const kcTrend = result.teamTrends.find((t) => t.team === "KC");
      expect(kcTrend).toBeDefined();
      expect(kcTrend?.cumulativePointDiff[0]).toEqual({
        week: 1,
        pointDiff: 4,
        cumulative: 4,
      });
    });

    it("calculates point differential for away team", () => {
      const games = [mockGame(2023, 1, "KC", "DET", 20, 24)];
      const result = computePointDiffTrends(games);
      const detTrend = result.teamTrends.find((t) => t.team === "DET");
      expect(detTrend).toBeDefined();
      expect(detTrend?.cumulativePointDiff[0]).toEqual({
        week: 1,
        pointDiff: 4,
        cumulative: 4,
      });
    });

    it("accumulates cumulative point differential across weeks", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "KC", "DET", 21, 17),
        mockGame(2023, 3, "KC", "DET", 20, 20),
      ];
      const result = computePointDiffTrends(games);
      const kcTrend = result.teamTrends.find((t) => t.team === "KC" && t.season === 2023);
      expect(kcTrend?.cumulativePointDiff.length).toBe(3);
      expect(kcTrend?.cumulativePointDiff[0].cumulative).toBe(4);
      expect(kcTrend?.cumulativePointDiff[1].cumulative).toBe(8);
      expect(kcTrend?.cumulativePointDiff[2].cumulative).toBe(8);
    });

    it("tracks best point differential teams", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 28, 10),
        mockGame(2023, 2, "KC", "DET", 24, 14),
        mockGame(2023, 3, "DET", "KC", 17, 20),
      ];
      const result = computePointDiffTrends(games);
      const best = result.bestPointDiff[0];
      expect(best.team).toBe("KC");
      expect(best.totalPointDiff).toBeGreaterThan(0);
    });

    it("tracks worst point differential teams", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 10, 28),
        mockGame(2023, 2, "KC", "DET", 14, 24),
      ];
      const result = computePointDiffTrends(games);
      const worst = result.worstPointDiff[0];
      expect(worst.team).toBe("KC");
      expect(worst.totalPointDiff).toBeLessThan(0);
    });

    it("limits best point diff to top 10", () => {
      const games: PointDiffGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, i, `Team${i}`, `Team${i + 1}`, 28, 10));
      }
      const result = computePointDiffTrends(games);
      expect(result.bestPointDiff.length).toBeLessThanOrEqual(10);
    });

    it("limits worst point diff to bottom 10", () => {
      const games: PointDiffGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, i, `Team${i}`, `Team${i + 1}`, 10, 28));
      }
      const result = computePointDiffTrends(games);
      expect(result.worstPointDiff.length).toBeLessThanOrEqual(10);
    });

    it("calculates average point diff per game", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "KC", "DET", 21, 17),
        mockGame(2023, 3, "KC", "DET", 20, 20),
      ];
      const result = computePointDiffTrends(games);
      const best = result.bestPointDiff.find((b) => b.team === "KC");
      expect(best?.avgPointDiffPerGame).toBeCloseTo(8 / 3, 1);
    });

    it("calculates Pythagorean wins", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 28, 10),
        mockGame(2023, 2, "KC", "DET", 24, 14),
        mockGame(2023, 3, "KC", "DET", 20, 17),
      ];
      const result = computePointDiffTrends(games);
      const pyth = result.pythagoreanWins.find((p) => p.team === "KC");
      expect(pyth?.pointsFor).toBe(72);
      expect(pyth?.pointsAgainst).toBe(41);
      expect(pyth?.actualWins).toBe(3);
      expect(pyth?.expectedWins).toBeGreaterThan(0);
    });

    it("accounts for negative Pythagorean difference", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 28, 10),
        mockGame(2023, 2, "KC", "DET", 20, 30),
      ];
      const result = computePointDiffTrends(games);
      const pyth = result.pythagoreanWins.find((p) => p.team === "KC");
      expect(pyth?.diff).toBeDefined();
    });

    it("calculates league-wide average point differential", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 1, "TB", "NO", 28, 15),
      ];
      const result = computePointDiffTrends(games);
      const leagueData = result.leagueTrends.find((l) => l.season === 2023);
      expect(leagueData?.avgPointDiff).toBeGreaterThan(0);
      expect(leagueData?.gamesCount).toBe(2);
    });

    it("calculates league-wide average total points", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 1, "TB", "NO", 28, 15),
      ];
      const result = computePointDiffTrends(games);
      const leagueData = result.leagueTrends.find((l) => l.season === 2023);
      expect(leagueData?.avgTotalPts).toBeCloseTo((24 + 20 + 28 + 15) / 2, 1);
    });

    it("separates trends by season", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2024, 1, "KC", "DET", 28, 18),
      ];
      const result = computePointDiffTrends(games);
      const kcTrends = result.teamTrends.filter((t) => t.team === "KC");
      expect(kcTrends.length).toBe(2);
      expect(kcTrends[0].season).toBe(2023);
      expect(kcTrends[1].season).toBe(2024);
    });

    it("handles tie games with zero point differential", () => {
      const games = [mockGame(2023, 1, "KC", "DET", 20, 20)];
      const result = computePointDiffTrends(games);
      const kcTrend = result.teamTrends.find((t) => t.team === "KC");
      expect(kcTrend?.cumulativePointDiff[0].pointDiff).toBe(0);
      expect(kcTrend?.cumulativePointDiff[0].cumulative).toBe(0);
    });

    it("sorts league trends by season", () => {
      const games = [
        mockGame(2024, 1, "KC", "DET", 24, 20),
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2022, 1, "KC", "DET", 24, 20),
      ];
      const result = computePointDiffTrends(games);
      expect(result.leagueTrends[0].season).toBe(2022);
      expect(result.leagueTrends[1].season).toBe(2023);
      expect(result.leagueTrends[2].season).toBe(2024);
    });

    it("rounds Pythagorean wins to 2 decimal places", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 28, 10),
        mockGame(2023, 2, "KC", "DET", 24, 14),
      ];
      const result = computePointDiffTrends(games);
      const pyth = result.pythagoreanWins.find((p) => p.team === "KC");
      const decimalPlaces = (pyth?.expectedWins.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("handles multiple teams in same season", () => {
      const games = [
        mockGame(2023, 1, "KC", "DET", 24, 20),
        mockGame(2023, 2, "TB", "NO", 28, 15),
      ];
      const result = computePointDiffTrends(games);
      const teams = new Set(result.teamTrends.map((t) => t.team));
      expect(teams.size).toBe(4);
    });

    it("calculates Pythagorean wins correctly with zero points", () => {
      const games = [mockGame(2023, 1, "KC", "DET", 0, 0)];
      const result = computePointDiffTrends(games);
      const pyth = result.pythagoreanWins.find((p) => p.team === "KC");
      expect(pyth?.expectedWins).toBe(0);
    });
  });
});
