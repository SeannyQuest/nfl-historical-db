import { describe, it, expect } from "vitest";
import { computeDivisionHistory, type DivisionGame } from "@/lib/division-history";

const mockGame = (
  homeTeam: string = "Kansas City Chiefs",
  awayTeam: string = "Detroit Lions",
  homeDiv: string = "AFC West",
  awayDiv: string = "NFC North",
  homeScore: number = 21,
  awayScore: number = 20,
  season: number = 2023
): DivisionGame => ({
  season,
  homeTeamName: homeTeam,
  homeTeamDivision: homeDiv,
  awayTeamName: awayTeam,
  awayTeamDivision: awayDiv,
  homeScore,
  awayScore,
  winnerName: homeScore > awayScore ? homeTeam : awayScore > homeScore ? awayTeam : null,
  isPlayoff: false,
});

describe("division-history.ts", () => {
  describe("computeDivisionHistory", () => {
    it("returns empty result for empty games", () => {
      const result = computeDivisionHistory([]);
      expect(result.divisionWinners).toEqual([]);
      expect(result.divisionDominance).toEqual([]);
    });

    it("identifies division winners", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2023),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21, 2023),
        mockGame("LAC", "LAC", "AFC West", "AFC West", 20, 17, 2023),
      ];
      const result = computeDivisionHistory(games);
      const afcWestWinner = result.divisionWinners.find((w) => w.season === 2023 && w.divisionName === "AFC West");
      expect(afcWestWinner).toBeDefined();
    });

    it("selects winner by win percentage", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2023),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21, 2023),
        mockGame("LAC", "KC", "AFC West", "AFC West", 17, 14, 2023), // LAC only 1 win, KC has 2
      ];
      const result = computeDivisionHistory(games);
      const winner = result.divisionWinners.find((w) => w.season === 2023 && w.divisionName === "AFC West");
      expect(winner?.winnerName).toBe("KC");
    });

    it("tracks division dominance (titles)", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2021),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21, 2021),
        mockGame("KC", "LAC", "AFC West", "AFC West", 20, 17, 2022),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21, 2022),
      ];
      const result = computeDivisionHistory(games);
      const dominance = result.divisionDominance.find((d) => d.teamName === "KC");
      expect(dominance?.titles).toBeGreaterThanOrEqual(2);
    });

    it("calculates intra-division records", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21),
        mockGame("LAC", "KC", "AFC West", "AFC West", 17, 14),
      ];
      const result = computeDivisionHistory(games);
      const kcRecord = result.intraDivisionRecords.find((r) => r.teamName === "KC");
      expect(kcRecord).toBeDefined();
      expect(kcRecord?.wins).toBeGreaterThan(0);
    });

    it("calculates division strength by year", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2023),
        mockGame("KC", "LAC", "AFC West", "AFC West", 24, 21, 2023),
      ];
      const result = computeDivisionHistory(games);
      const strength = result.divisionStrengthByYear.find((s) => s.season === 2023);
      expect(strength).toBeDefined();
    });

    it("identifies most competitive divisions", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2023),
        mockGame("KC", "LAC", "AFC West", "AFC West", 20, 21, 2023),
        mockGame("LAC", "KC", "AFC West", "AFC West", 21, 20, 2023),
      ];
      const result = computeDivisionHistory(games);
      expect(result.mostCompetitiveDivisions.length).toBeGreaterThan(0);
    });
  });

  describe("division winners", () => {
    it("excludes playoff games from winner calculation", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20),
        { ...mockGame("LAC", "KC", "AFC West", "AFC West", 24, 21), isPlayoff: true },
      ];
      const result = computeDivisionHistory(games);
      const winner = result.divisionWinners[0];
      expect(winner.winnerName).toBe("KC");
    });

    it("handles multiple divisions", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20),
        mockGame("DAL", "PHI", "NFC East", "NFC East", 21, 20),
      ];
      const result = computeDivisionHistory(games);
      const divisions = new Set(result.divisionWinners.map((w) => w.divisionName));
      expect(divisions.size).toBeGreaterThan(1);
    });

    it("handles ties in records", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 21),
      ];
      const result = computeDivisionHistory(games);
      expect(result.divisionWinners.length).toBeGreaterThan(0);
    });
  });

  describe("intra-division records", () => {
    it("only counts same-division games", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20),
        mockGame("KC", "PHI", "AFC West", "NFC East", 24, 21), // Different divisions
      ];
      const result = computeDivisionHistory(games);
      const kcRecord = result.intraDivisionRecords.find((r) => r.teamName === "KC");
      expect(kcRecord?.wins).toBe(1); // Only the first game
    });

    it("calculates win percentage", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20),
        mockGame("KC", "LAC", "AFC West", "AFC West", 20, 21),
      ];
      const result = computeDivisionHistory(games);
      const kcRecord = result.intraDivisionRecords.find((r) => r.teamName === "KC");
      expect(kcRecord?.pct).toBe("0.500");
    });

    it("limits results to top 20", () => {
      const games: DivisionGame[] = [];
      for (let i = 0; i < 50; i++) {
        games.push(mockGame(`Team${i}`, `Team${i + 1}`, "AFC West", "AFC West", 21, 20));
      }
      const result = computeDivisionHistory(games);
      expect(result.intraDivisionRecords.length).toBeLessThanOrEqual(20);
    });
  });

  describe("dominance rankings", () => {
    it("ranks teams by number of titles", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2021),
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2022),
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2023),
        mockGame("LAC", "KC", "AFC West", "AFC West", 21, 20, 2024),
      ];
      const result = computeDivisionHistory(games);
      const kcTitles = result.divisionDominance.find((d) => d.teamName === "KC")?.titles;
      const lacTitles = result.divisionDominance.find((d) => d.teamName === "LAC")?.titles;
      expect(kcTitles).toBeGreaterThanOrEqual(lacTitles ?? 0);
    });

    it("limits dominance to top 15", () => {
      const games: DivisionGame[] = [];
      for (let i = 0; i < 30; i++) {
        games.push(mockGame(`Team${i % 10}`, `Team${(i + 1) % 10}`, "AFC West", "AFC West", 21, 20, 2020 + Math.floor(i / 10)));
      }
      const result = computeDivisionHistory(games);
      expect(result.divisionDominance.length).toBeLessThanOrEqual(15);
    });
  });

  describe("edge cases", () => {
    it("handles single game divisions", () => {
      const games = [mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20)];
      const result = computeDivisionHistory(games);
      expect(result.divisionWinners.length).toBeGreaterThan(0);
    });

    it("handles all ties", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 21),
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 21),
      ];
      const result = computeDivisionHistory(games);
      expect(result.divisionWinners.length).toBeGreaterThan(0);
    });

    it("handles null winner names", () => {
      const games = [mockGame("KC", "LAC", "AFC West", "AFC West", 21, 21)];
      const result = computeDivisionHistory(games);
      expect(result.divisionWinners.length).toBeGreaterThan(0);
    });
  });

  describe("data formatting", () => {
    it("formats win percentage with 3 decimals", () => {
      const games = [mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20)];
      const result = computeDivisionHistory(games);
      const record = result.intraDivisionRecords[0];
      expect(record.pct).toMatch(/^\d\.\d{3}$/);
    });

    it("includes season range in dominance", () => {
      const games = [
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2020),
        mockGame("KC", "LAC", "AFC West", "AFC West", 21, 20, 2025),
      ];
      const result = computeDivisionHistory(games);
      const dominance = result.divisionDominance.find((d) => d.teamName === "KC");
      expect(dominance?.seasons).toContain("-");
    });
  });
});
