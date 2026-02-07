import { describe, it, expect } from "vitest";
import { computePrimetimeStats, type PrimetimeGame } from "@/lib/primetime-stats";

const mockGame = (
  homeScore: number = 21,
  awayScore: number = 20,
  primetime: string | null = null,
  spread: number | null = 3.5,
  spreadResult: string | null = "COVERED"
): PrimetimeGame => ({
  season: 2023,
  homeTeamName: "Kansas City Chiefs",
  awayTeamName: "Detroit Lions",
  homeScore,
  awayScore,
  winnerName: homeScore > awayScore ? "Kansas City Chiefs" : homeScore < awayScore ? "Detroit Lions" : null,
  primetime,
  isPlayoff: false,
  spread,
  spreadResult,
  ouResult: "UNDER",
});

describe("primetime-stats.ts", () => {
  describe("computePrimetimeStats", () => {
    it("returns empty result for empty games", () => {
      const result = computePrimetimeStats([]);
      expect(result.slots).toEqual([]);
      expect(result.bestPrimetimeTeam).toBeNull();
      expect(result.biggestBlowouts).toEqual([]);
    });

    it("categorizes games by primetime slot", () => {
      const games = [mockGame(21, 20, "SNF"), mockGame(24, 21, "MNF"), mockGame(17, 14, null)];
      const result = computePrimetimeStats(games);
      const slots = result.slots.map((s) => s.slot);
      expect(slots).toContain("SNF");
      expect(slots).toContain("MNF");
      expect(slots).toContain("Regular");
    });

    it("counts games per slot", () => {
      const games = [
        mockGame(21, 20, "SNF"),
        mockGame(24, 21, "SNF"),
        mockGame(17, 14, "MNF"),
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.totalGames).toBe(2);
    });

    it("calculates average scores", () => {
      const games = [
        mockGame(21, 20, "SNF"),
        mockGame(24, 18, "SNF"),
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.avgHomeScore).toBe("22.5");
      expect(snf?.avgAwayScore).toBe("19.0");
    });

    it("calculates home win percentage", () => {
      const games = [
        mockGame(21, 20, "SNF"),
        mockGame(20, 21, "SNF"),
        mockGame(24, 20, "SNF"),
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.homeWinPct).toBe("0.667");
    });

    it("calculates upset rate", () => {
      const games = [
        { ...mockGame(20, 21, "SNF"), spread: 3.0, spreadResult: "LOST" }, // Away win (21) when home favored = upset
        mockGame(21, 20, "SNF"),
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(parseFloat(snf?.upsetRate ?? "0")).toBeGreaterThan(0);
    });

    it("calculates home cover percentage", () => {
      const games = [
        { ...mockGame(21, 20, "SNF"), spreadResult: "COVERED" },
        { ...mockGame(21, 20, "SNF"), spreadResult: "LOST" },
        { ...mockGame(21, 20, "SNF"), spreadResult: "COVERED" },
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.homeCoverPct).toBe("0.667");
    });

    it("calculates over percentage", () => {
      const games = [
        { ...mockGame(21, 20, "SNF"), ouResult: "OVER" },
        { ...mockGame(21, 20, "SNF"), ouResult: "UNDER" },
        { ...mockGame(21, 20, "SNF"), ouResult: "OVER" },
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.overPct).toBe("0.667");
    });
  });

  describe("best and worst teams", () => {
    it("identifies best primetime team", () => {
      const games = Array.from({ length: 10 }, (_, i) => ({
        ...mockGame(21, 20, "SNF"),
        winnerName: i % 2 === 0 ? "Kansas City Chiefs" : "Detroit Lions",
      }));
      const result = computePrimetimeStats(games);
      expect(result.bestPrimetimeTeam).not.toBeNull();
      expect(result.bestPrimetimeTeam?.games).toBeGreaterThanOrEqual(3);
    });

    it("identifies worst primetime team", () => {
      const games = Array.from({ length: 10 }, (_, i) => ({
        ...mockGame(20, 21, "SNF"),
        homeTeamName: i % 2 === 0 ? "Kansas City Chiefs" : "Detroit Lions",
        awayTeamName: i % 2 === 0 ? "Detroit Lions" : "Kansas City Chiefs",
        winnerName: "Detroit Lions",
      }));
      const result = computePrimetimeStats(games);
      expect(result.worstPrimetimeTeam).not.toBeNull();
    });

    it("requires minimum 3 games for best team", () => {
      const games = [mockGame(21, 20, "SNF"), mockGame(21, 20, "SNF")];
      const result = computePrimetimeStats(games);
      expect(result.bestPrimetimeTeam).toBeNull();
    });
  });

  describe("primetime vs non-primetime", () => {
    it("compares primetime and non-primetime scoring", () => {
      const games = [
        mockGame(28, 24, "SNF"),
        mockGame(28, 24, "SNF"),
        mockGame(17, 14, null),
        mockGame(17, 14, null),
      ];
      const result = computePrimetimeStats(games);
      expect(result.primetimeVsNonPrimetime.primetime.avgTotal).toBe("52.0");
      expect(result.primetimeVsNonPrimetime.nonPrimetime.avgTotal).toBe("31.0");
    });

    it("compares home win percentages", () => {
      const games = [
        mockGame(21, 20, "SNF"),
        mockGame(21, 20, "SNF"),
        mockGame(20, 21, null),
      ];
      const result = computePrimetimeStats(games);
      expect(parseFloat(result.primetimeVsNonPrimetime.primetime.homeWinPct)).toBeGreaterThan(0);
    });

    it("calculates average spread", () => {
      const games = [
        { ...mockGame(21, 20, "SNF"), spread: 3.0 },
        { ...mockGame(21, 20, "SNF"), spread: 5.0 },
      ];
      const result = computePrimetimeStats(games);
      expect(result.primetimeVsNonPrimetime.primetime.avgSpread).toBe("4.0");
    });
  });

  describe("blowouts", () => {
    it("identifies games with margin >= 14", () => {
      const games = [
        mockGame(35, 21, "SNF"), // 14-point margin
        mockGame(28, 20, "SNF"), // 8-point margin
      ];
      const result = computePrimetimeStats(games);
      expect(result.biggestBlowouts.length).toBe(1);
      expect(result.biggestBlowouts[0].margin).toBe(14);
    });

    it("sorts blowouts by margin descending", () => {
      const games = [
        mockGame(42, 14, "SNF"), // 28-point margin
        mockGame(35, 21, "SNF"), // 14-point margin
      ];
      const result = computePrimetimeStats(games);
      expect(result.biggestBlowouts[0].margin).toBe(28);
      expect(result.biggestBlowouts[1].margin).toBe(14);
    });

    it("limits blowouts to top 10", () => {
      const games = Array.from({ length: 15 }, (_, i) => mockGame(35 + i, 14, "SNF"));
      const result = computePrimetimeStats(games);
      expect(result.biggestBlowouts.length).toBeLessThanOrEqual(10);
    });

    it("includes score and teams in blowout info", () => {
      const games = [mockGame(35, 21, "SNF")];
      const result = computePrimetimeStats(games);
      expect(result.biggestBlowouts[0].score).toBeDefined();
      expect(result.biggestBlowouts[0].teams).toContain("@");
    });
  });

  describe("upsets", () => {
    it("identifies away team wins when home favored", () => {
      const games = [
        { ...mockGame(20, 21, "SNF"), spread: 3.0, winnerName: "Detroit Lions" },
      ];
      const result = computePrimetimeStats(games);
      expect(result.upsets.length).toBeGreaterThan(0);
    });

    it("identifies home team wins when away favored", () => {
      const games = [
        { ...mockGame(21, 20, "SNF"), spread: -3.0, winnerName: "Kansas City Chiefs" },
      ];
      const result = computePrimetimeStats(games);
      expect(result.upsets.length).toBeGreaterThan(0);
    });

    it("limits upsets to top 10", () => {
      const games = Array.from({ length: 15 }, (_, i) => ({
        ...mockGame(20, 21, "SNF"),
        spread: 3.0,
        winnerName: "Detroit Lions",
        awayTeamName: `Team${i}`,
      }));
      const result = computePrimetimeStats(games);
      expect(result.upsets.length).toBeLessThanOrEqual(10);
    });

    it("includes score and teams in upset info", () => {
      const games = [
        { ...mockGame(20, 21, "SNF"), spread: 3.0, winnerName: "Detroit Lions" },
      ];
      const result = computePrimetimeStats(games);
      expect(result.upsets[0].teams).toBeDefined();
      expect(result.upsets[0].score).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles ties", () => {
      const games = [mockGame(21, 21, "SNF")];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.homeWins).toBe(0);
      expect(snf?.awayWins).toBe(0);
    });

    it("handles null spread", () => {
      const games = [mockGame(21, 20, "SNF", null, null)];
      const result = computePrimetimeStats(games);
      expect(result.primetimeVsNonPrimetime.primetime.avgSpread).toBe("0.0");
    });

    it("handles games without primetime designation", () => {
      const games = [mockGame(21, 20, null)];
      const result = computePrimetimeStats(games);
      const regular = result.slots.find((s) => s.slot === "Regular");
      expect(regular?.totalGames).toBe(1);
    });

    it("handles playoff games", () => {
      const games = [{ ...mockGame(21, 20, "SNF"), isPlayoff: true }];
      const result = computePrimetimeStats(games);
      expect(result.slots.length).toBeGreaterThan(0);
    });
  });

  describe("data formatting", () => {
    it("formats averages with 1 decimal place", () => {
      const games = [mockGame(21, 20, "SNF"), mockGame(24, 19, "SNF")];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.avgHomeScore).toMatch(/^\d+\.\d$/);
    });

    it("formats percentages with 3 decimal places", () => {
      const games = [
        mockGame(21, 20, "SNF"),
        mockGame(20, 21, "SNF"),
        mockGame(24, 20, "SNF"),
      ];
      const result = computePrimetimeStats(games);
      const snf = result.slots.find((s) => s.slot === "SNF");
      expect(snf?.homeWinPct).toMatch(/^0\.\d{3}$/);
    });
  });
});
