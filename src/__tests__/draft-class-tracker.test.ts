import { describe, it, expect } from "vitest";
import { computeDraftClassImpact, type DraftClassTeam } from "@/lib/draft-class-tracker";

const mockTeam = (
  team: string = "Kansas City Chiefs",
  season: number = 2023,
  wins: number = 12,
  losses: number = 5,
  prevSeasonWins: number = 13,
  prevSeasonLosses: number = 4
): DraftClassTeam => ({
  team,
  season,
  wins,
  losses,
  prevSeasonWins,
  prevSeasonLosses,
});

describe("draft-class-tracker.ts", () => {
  describe("computeDraftClassImpact", () => {
    it("returns empty result for empty teams", () => {
      const result = computeDraftClassImpact([]);
      expect(result.yearOverYear).toEqual([]);
      expect(result.biggestImprovements).toEqual([]);
      expect(result.biggestDeclines).toEqual([]);
      expect(result.avgImprovementByPrevRecord).toEqual([]);
      expect(result.regressionToMean).toEqual([]);
    });

    it("calculates year-over-year improvement", () => {
      const teams = [mockTeam("KC", 2023, 14, 3, 13, 4)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "KC");
      expect(yoy?.improvement).toBe(1);
    });

    it("calculates year-over-year decline", () => {
      const teams = [mockTeam("KC", 2023, 10, 7, 13, 4)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "KC");
      expect(yoy?.improvement).toBe(-3);
    });

    it("calculates improvement percentage", () => {
      const teams = [mockTeam("KC", 2023, 13, 4, 10, 7)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "KC");
      expect(yoy?.improvementPct).toBe(30);
    });

    it("handles zero previous wins for improvement percentage", () => {
      const teams = [mockTeam("KC", 2023, 5, 12, 0, 17)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "KC");
      expect(yoy?.improvementPct).toBe(0);
    });

    it("identifies biggest improvements", () => {
      const teams = [
        mockTeam("BigImprove", 2023, 14, 3, 6, 11),
        mockTeam("SmallImprove", 2023, 12, 5, 11, 6),
      ];
      const result = computeDraftClassImpact(teams);
      expect(result.biggestImprovements.length).toBeGreaterThan(0);
      expect(result.biggestImprovements[0].team).toBe("BigImprove");
      expect(result.biggestImprovements[0].improvement).toBe(8);
    });

    it("identifies biggest declines", () => {
      const teams = [
        mockTeam("BigDecline", 2023, 6, 11, 14, 3),
        mockTeam("SmallDecline", 2023, 12, 5, 13, 4),
      ];
      const result = computeDraftClassImpact(teams);
      expect(result.biggestDeclines.length).toBeGreaterThan(0);
      expect(result.biggestDeclines[0].team).toBe("BigDecline");
      expect(result.biggestDeclines[0].improvement).toBe(-8);
    });

    it("limits improvements to top 10", () => {
      const teams: DraftClassTeam[] = [];
      for (let i = 1; i <= 15; i++) {
        teams.push(mockTeam(`Team${i}`, 2023, 12 + i, 5, 6, 11));
      }
      const result = computeDraftClassImpact(teams);
      expect(result.biggestImprovements.length).toBeLessThanOrEqual(10);
    });

    it("limits declines to bottom 10", () => {
      const teams: DraftClassTeam[] = [];
      for (let i = 1; i <= 15; i++) {
        teams.push(mockTeam(`Team${i}`, 2023, 6 - i, 11, 12, 5));
      }
      const result = computeDraftClassImpact(teams);
      expect(result.biggestDeclines.length).toBeLessThanOrEqual(10);
    });

    it("formats record strings correctly", () => {
      const teams = [mockTeam("KC", 2023, 14, 3, 13, 4)];
      const result = computeDraftClassImpact(teams);
      const improvement = result.biggestImprovements.find((i) => i.team === "KC");
      expect(improvement?.prevRecord).toBe("13-4");
      expect(improvement?.currRecord).toBe("14-3");
    });

    it("calculates average improvement by previous record range 0-4", () => {
      const teams = [
        mockTeam("Bad1", 2023, 8, 9, 2, 15),
        mockTeam("Bad2", 2023, 9, 8, 3, 14),
      ];
      const result = computeDraftClassImpact(teams);
      const range = result.avgImprovementByPrevRecord.find((r) => r.prevRecordRange === "0-4");
      expect(range).toBeDefined();
      expect(range?.avgImprovement).toBeGreaterThan(0);
    });

    it("calculates average improvement by previous record range 5-8", () => {
      const teams = [
        mockTeam("Med1", 2023, 10, 7, 5, 12),
        mockTeam("Med2", 2023, 9, 8, 8, 9),
      ];
      const result = computeDraftClassImpact(teams);
      const range = result.avgImprovementByPrevRecord.find((r) => r.prevRecordRange === "5-8");
      expect(range).toBeDefined();
    });

    it("calculates average improvement by previous record range 9-12", () => {
      const teams = [mockTeam("Good", 2023, 13, 4, 10, 7)];
      const result = computeDraftClassImpact(teams);
      const range = result.avgImprovementByPrevRecord.find((r) => r.prevRecordRange === "9-12");
      expect(range).toBeDefined();
    });

    it("calculates average improvement by previous record range 13+", () => {
      const teams = [mockTeam("Great", 2023, 14, 3, 13, 4)];
      const result = computeDraftClassImpact(teams);
      const range = result.avgImprovementByPrevRecord.find((r) => r.prevRecordRange === "13+");
      expect(range).toBeDefined();
    });

    it("calculates regression to the mean by win percentage", () => {
      const teams = [
        mockTeam("Good", 2023, 13, 4, 14, 3),
        mockTeam("Bad", 2023, 7, 10, 2, 15),
      ];
      const result = computeDraftClassImpact(teams);
      expect(result.regressionToMean.length).toBeGreaterThan(0);
    });

    it("rounds improvement percentage to 2 decimal places", () => {
      const teams = [mockTeam("KC", 2023, 11, 6, 10, 7)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "KC");
      const decimalPlaces = (yoy?.improvementPct.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("separates improvements and declines correctly", () => {
      const teams = [
        mockTeam("Improver", 2023, 12, 5, 8, 9),
        mockTeam("Decliner", 2023, 6, 11, 12, 5),
      ];
      const result = computeDraftClassImpact(teams);
      const improver = result.biggestImprovements.find((i) => i.team === "Improver");
      const decliner = result.biggestDeclines.find((d) => d.team === "Decliner");
      expect(improver?.improvement).toBeGreaterThan(0);
      expect(decliner?.improvement).toBeLessThan(0);
    });

    it("handles perfect record (0 previous losses)", () => {
      const teams = [mockTeam("Perfect", 2023, 13, 4, 17, 0)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "Perfect");
      expect(yoy?.prevWins).toBe(17);
    });

    it("handles winless season (0 wins)", () => {
      const teams = [mockTeam("Winless", 2023, 0, 17, 8, 9)];
      const result = computeDraftClassImpact(teams);
      const yoy = result.yearOverYear.find((y) => y.team === "Winless");
      expect(yoy?.currWins).toBe(0);
      expect(yoy?.improvement).toBe(-8);
    });

    it("sorts record ranges in correct order", () => {
      const teams = [
        mockTeam("Team1", 2023, 8, 9, 2, 15),
        mockTeam("Team2", 2023, 10, 7, 5, 12),
        mockTeam("Team3", 2023, 12, 5, 10, 7),
        mockTeam("Team4", 2023, 14, 3, 13, 4),
      ];
      const result = computeDraftClassImpact(teams);
      const ranges = result.avgImprovementByPrevRecord.map((r) => r.prevRecordRange);
      expect(ranges[0]).toBe("0-4");
      expect(ranges[ranges.length - 1]).toBe("13+");
    });

    it("sorts regression to mean by win percentage buckets", () => {
      const teams = [
        mockTeam("Bad", 2023, 8, 9, 2, 15),
        mockTeam("Good", 2023, 13, 4, 14, 3),
      ];
      const result = computeDraftClassImpact(teams);
      const winPcts = result.regressionToMean.map((r) => r.prevWinPct);
      const expectedOrder = ["0.00-0.25", "0.26-0.37", "0.38-0.50", "0.51-0.62", "0.63-0.75", "0.76-1.00"];
      for (let i = 1; i < winPcts.length; i++) {
        const prevIdx = expectedOrder.indexOf(winPcts[i - 1]);
        const currIdx = expectedOrder.indexOf(winPcts[i]);
        expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
      }
    });

    it("includes team count in average improvement by record", () => {
      const teams = [
        mockTeam("Team1", 2023, 8, 9, 2, 15),
        mockTeam("Team2", 2023, 10, 7, 3, 14),
      ];
      const result = computeDraftClassImpact(teams);
      const range = result.avgImprovementByPrevRecord.find((r) => r.prevRecordRange === "0-4");
      expect(range?.teamCount).toBe(2);
    });

    it("includes team count in regression to mean", () => {
      const teams = [mockTeam("Team1", 2023, 8, 9, 2, 15)];
      const result = computeDraftClassImpact(teams);
      const rtm = result.regressionToMean.find((r) => r.teamsCount > 0);
      expect(rtm?.teamsCount).toBeGreaterThan(0);
    });

    it("sorts improvements by highest improvement first", () => {
      const teams = [
        mockTeam("Big", 2023, 14, 3, 4, 13),
        mockTeam("Small", 2023, 11, 6, 8, 9),
      ];
      const result = computeDraftClassImpact(teams);
      expect(result.biggestImprovements[0].improvement).toBeGreaterThanOrEqual(result.biggestImprovements[1].improvement);
    });

    it("sorts declines by largest decline first", () => {
      const teams = [
        mockTeam("Big", 2023, 4, 13, 14, 3),
        mockTeam("Small", 2023, 10, 7, 12, 5),
      ];
      const result = computeDraftClassImpact(teams);
      expect(Math.abs(result.biggestDeclines[0].improvement)).toBeGreaterThanOrEqual(
        Math.abs(result.biggestDeclines[1].improvement)
      );
    });
  });
});
