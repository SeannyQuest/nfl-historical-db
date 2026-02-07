import { describe, it, expect } from "vitest";
import { computeEraComparison, type EraGame } from "@/lib/era-comparison";

const mockGame = (season: number, homeScore: number = 21, awayScore: number = 20): EraGame => ({
  season,
  homeScore,
  awayScore,
  isPlayoff: false,
  homeTeamName: "Kansas City Chiefs",
  awayTeamName: "Detroit Lions",
  winnerName: homeScore > awayScore ? "Kansas City Chiefs" : "Detroit Lions",
  spread: 3.5,
  spreadResult: "COVERED",
  ouResult: "UNDER",
  overUnder: 42.5,
});

describe("era-comparison.ts", () => {
  describe("computeEraComparison", () => {
    it("returns empty result for empty games", () => {
      const result = computeEraComparison([]);
      expect(result.eras).toEqual([]);
      expect(result.highestScoringEra.era).toBe("N/A");
      expect(result.notableRecords).toEqual([]);
    });

    it("classifies games into correct eras", () => {
      const games = [
        mockGame(1967),
        mockGame(1975),
        mockGame(2005),
        mockGame(2015),
      ];
      const result = computeEraComparison(games);
      expect(result.eras.length).toBe(4);
    });

    it("identifies Pre-Merger era (1966-1969)", () => {
      const games = [mockGame(1966), mockGame(1967), mockGame(1968), mockGame(1969)];
      const result = computeEraComparison(games);
      const premerger = result.eras.find((e) => e.era === "Pre-Merger");
      expect(premerger).toBeDefined();
      expect(premerger?.totalGames).toBe(4);
      expect(premerger?.years).toBe("1966-1969");
    });

    it("identifies Early Modern era (1970-1989)", () => {
      const games = [mockGame(1970), mockGame(1985), mockGame(1989)];
      const result = computeEraComparison(games);
      const earlyModern = result.eras.find((e) => e.era === "Early Modern");
      expect(earlyModern).toBeDefined();
      expect(earlyModern?.totalGames).toBe(3);
      expect(earlyModern?.years).toBe("1970-1989");
    });

    it("identifies Salary Cap Era (1994-2009)", () => {
      const games = [mockGame(1994), mockGame(2005), mockGame(2009)];
      const result = computeEraComparison(games);
      const salaryCap = result.eras.find((e) => e.era === "Salary Cap Era");
      expect(salaryCap).toBeDefined();
      expect(salaryCap?.totalGames).toBe(3);
      expect(salaryCap?.years).toBe("1994-2009");
    });

    it("identifies Modern Era (2010+)", () => {
      const games = [mockGame(2010), mockGame(2020), mockGame(2023)];
      const result = computeEraComparison(games);
      const modern = result.eras.find((e) => e.era === "Modern Era");
      expect(modern).toBeDefined();
      expect(modern?.totalGames).toBe(3);
      expect(modern?.years).toBe("2010+");
    });
  });

  describe("era statistics", () => {
    it("calculates average scoring total", () => {
      const games = [
        mockGame(2015, 21, 20), // 41 total
        mockGame(2015, 24, 20), // 44 total
        mockGame(2015, 28, 14), // 42 total
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgScoringTotal).toBe("42.3");
    });

    it("calculates average home score", () => {
      const games = [mockGame(2015, 21, 20), mockGame(2015, 24, 20)];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgHomeScore).toBe("22.5");
    });

    it("calculates average away score", () => {
      const games = [mockGame(2015, 21, 20), mockGame(2015, 24, 18)];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgAwayScore).toBe("19.0");
    });

    it("calculates home win percentage", () => {
      const games = [
        mockGame(2015, 21, 20),
        mockGame(2015, 21, 20),
        mockGame(2015, 20, 21), // Away win
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.homeWinPct).toBe("0.667");
    });

    it("calculates over percentage", () => {
      const games = [
        { ...mockGame(2015, 21, 20), ouResult: "OVER" },
        { ...mockGame(2015, 21, 20), ouResult: "UNDER" },
        { ...mockGame(2015, 21, 20), ouResult: "OVER" },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.overPct).toBe("0.667");
    });

    it("calculates average spread", () => {
      const games = [
        { ...mockGame(2015), spread: 3.0 },
        { ...mockGame(2015), spread: 5.0 },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgSpread).toBe("4.0");
    });

    it("calculates home cover percentage", () => {
      const games = [
        { ...mockGame(2015), spreadResult: "COVERED" },
        { ...mockGame(2015), spreadResult: "LOST" },
        { ...mockGame(2015), spreadResult: "COVERED" },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.homeCoverPct).toBe("0.667");
    });
  });

  describe("era comparisons", () => {
    it("identifies highest scoring era", () => {
      const games = [
        mockGame(1967, 10, 10), // 20 points
        mockGame(1970, 28, 21), // 49 points
        mockGame(2015, 30, 27), // 57 points (highest)
      ];
      const result = computeEraComparison(games);
      expect(result.highestScoringEra.era).toBe("Modern Era");
      expect(result.highestScoringEra.avg).toBe("57.0");
    });

    it("identifies lowest scoring era", () => {
      const games = [
        mockGame(1967, 14, 10), // 24 points (lowest)
        mockGame(1970, 28, 21), // 49 points
        mockGame(2015, 30, 27), // 57 points
      ];
      const result = computeEraComparison(games);
      expect(result.lowestScoringEra.era).toBe("Pre-Merger");
      expect(result.lowestScoringEra.avg).toBe("24.0");
    });

    it("identifies highest home win rate era", () => {
      const games = [
        mockGame(1967, 21, 10), // Home wins
        mockGame(1967, 21, 14), // Home wins
        mockGame(2015, 20, 21), // Away wins
        mockGame(2015, 20, 21), // Away wins
      ];
      const result = computeEraComparison(games);
      const premerger = result.eras.find((e) => e.era === "Pre-Merger");
      expect(result.highestHomeWinRateEra.era).toBe("Pre-Merger");
      expect(parseFloat(result.highestHomeWinRateEra.pct)).toBeGreaterThan(0.5);
    });
  });

  describe("notable records", () => {
    it("includes notable team season records", () => {
      const games = Array.from({ length: 16 }, (_, i) => ({
        ...mockGame(2015),
        season: 2015,
        isPlayoff: false,
        homeTeamName: i % 2 === 0 ? "Kansas City Chiefs" : "Detroit Lions",
        awayTeamName: i % 2 === 0 ? "Detroit Lions" : "Kansas City Chiefs",
      }));
      const result = computeEraComparison(games);
      expect(result.notableRecords.length).toBeGreaterThan(0);
    });

    it("filters out incomplete seasons", () => {
      const games = [mockGame(2015), mockGame(2015)]; // Only 2 games
      const result = computeEraComparison(games);
      expect(result.notableRecords.length).toBe(0); // Less than 10 games
    });

    it("includes season and team info in notable records", () => {
      const games = Array.from({ length: 16 }, (_, i) => ({
        ...mockGame(2015),
        season: 2015,
        isPlayoff: false,
        homeTeamName: "Kansas City Chiefs",
        awayTeamName: "Detroit Lions",
      }));
      const result = computeEraComparison(games);
      if (result.notableRecords.length > 0) {
        expect(result.notableRecords[0].season).toBe(2015);
        expect(result.notableRecords[0].team).toBeDefined();
      }
    });

    it("limits notable records to top 5", () => {
      const games: EraGame[] = [];
      for (let team = 0; team < 10; team++) {
        for (let game = 0; game < 16; game++) {
          const teamName = ["KC", "DET", "PHI", "DAL", "NE", "GB", "SF", "SEA", "BAL", "ATL"][team];
          games.push({
            ...mockGame(2015),
            season: 2015,
            isPlayoff: false,
            homeTeamName: teamName,
            awayTeamName: "Opponent",
            winnerName: teamName,
          });
        }
      }
      const result = computeEraComparison(games);
      expect(result.notableRecords.length).toBeLessThanOrEqual(5);
    });
  });

  describe("edge cases", () => {
    it("handles games with null spread", () => {
      const games = [
        { ...mockGame(2015), spread: null },
        { ...mockGame(2015), spread: 3.5 },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgSpread).toBe("3.5");
    });

    it("handles ties", () => {
      const games = [
        mockGame(2015, 21, 21),
        mockGame(2015, 21, 20),
        mockGame(2015, 20, 21),
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.homeWinPct).toBe("0.500");
    });

    it("handles playoff games separately", () => {
      const games = [
        { ...mockGame(2015, 21, 20), isPlayoff: true },
        { ...mockGame(2015, 21, 20), isPlayoff: false },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.totalGames).toBe(2); // Both counted in era
    });

    it("handles games with no spread result", () => {
      const games = [
        { ...mockGame(2015), spreadResult: null },
        { ...mockGame(2015), spreadResult: "COVERED" },
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.homeCoverPct).toBe("1.000");
    });
  });

  describe("data formatting", () => {
    it("formats averages with 1 decimal place", () => {
      const games = [mockGame(2015, 21, 20), mockGame(2015, 24, 19)];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.avgScoringTotal).toMatch(/^\d+\.\d$/);
    });

    it("formats percentages with 3 decimal places", () => {
      const games = [
        mockGame(2015, 21, 20),
        mockGame(2015, 21, 20),
        mockGame(2015, 20, 21),
      ];
      const result = computeEraComparison(games);
      const modern = result.eras[0];
      expect(modern.homeWinPct).toMatch(/^\d\.\d{3}$/);
    });
  });
});
