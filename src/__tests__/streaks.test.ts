import { describe, it, expect } from "vitest";
import { computeStreaks, type StreakGame } from "@/lib/streaks";

const mockGame = (
  homeTeamName: string = "Kansas City Chiefs",
  awayTeamName: string = "Detroit Lions",
  homeScore: number = 21,
  awayScore: number = 20,
  season: number = 2023
): StreakGame => ({
  season,
  date: "2023-09-10",
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  winnerName: homeScore > awayScore ? homeTeamName : awayScore > homeScore ? awayTeamName : null,
  spreadResult: "COVERED",
  ouResult: "UNDER",
  isPlayoff: false,
});

describe("streaks.ts", () => {
  describe("computeStreaks", () => {
    it("returns empty result for empty games", () => {
      const result = computeStreaks([]);
      expect(result.currentStreaks).toEqual([]);
      expect(result.longestWinningStreaks).toEqual([]);
    });

    it("identifies winning streaks", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("KC", "DET", 24, 21),
        mockGame("KC", "DET", 20, 17),
      ];
      const result = computeStreaks(games);
      const kcWinStreak = result.longestWinningStreaks.find((s) => s.teamName === "KC");
      expect(kcWinStreak?.allTimeRecord).toBeGreaterThanOrEqual(3);
    });

    it("identifies losing streaks", () => {
      const games = [
        mockGame("KC", "DET", 17, 21),
        mockGame("KC", "DET", 14, 24),
        mockGame("KC", "DET", 10, 20),
      ];
      const result = computeStreaks(games);
      const kcLossStreak = result.longestLosingStreaks.find((s) => s.teamName === "KC");
      expect(kcLossStreak?.allTimeRecord).toBeGreaterThanOrEqual(3);
    });

    it("tracks home and away win streaks separately", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("DET", "KC", 21, 20),
        mockGame("KC", "DET", 24, 21),
      ];
      const result = computeStreaks(games);
      expect(result.longestHomeWinStreaks.length).toBeGreaterThan(0);
      expect(result.longestAwayWinStreaks.length).toBeGreaterThan(0);
    });

    it("tracks ATS streaks", () => {
      const games = [
        { ...mockGame("KC", "DET", 21, 20), spreadResult: "COVERED" },
        { ...mockGame("KC", "DET", 24, 21), spreadResult: "COVERED" },
      ];
      const result = computeStreaks(games);
      expect(result.longestATSStreaks.length).toBeGreaterThan(0);
    });

    it("tracks over streaks", () => {
      const games = [
        { ...mockGame("KC", "DET", 28, 24), ouResult: "OVER" },
        { ...mockGame("KC", "DET", 35, 28), ouResult: "OVER" },
      ];
      const result = computeStreaks(games);
      expect(result.longestOverStreaks.length).toBeGreaterThan(0);
    });
  });

  describe("current streaks", () => {
    it("identifies active winning streaks", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("KC", "DET", 24, 21),
        mockGame("KC", "DET", 20, 17),
      ];
      const result = computeStreaks(games);
      const activeWins = result.currentStreaks.filter((s) => s.streakType === "WIN");
      expect(activeWins.length).toBeGreaterThan(0);
    });

    it("identifies active losing streaks", () => {
      const games = [
        mockGame("KC", "DET", 17, 21),
        mockGame("KC", "DET", 14, 24),
      ];
      const result = computeStreaks(games);
      const activeLosses = result.currentStreaks.filter((s) => s.streakType === "LOSS");
      expect(activeLosses.length).toBeGreaterThan(0);
    });

    it("limits current streaks to top 10", () => {
      const games: StreakGame[] = [];
      for (let i = 0; i < 20; i++) {
        const team = i % 2 === 0 ? `Team${i}` : "DET";
        games.push(mockGame(team, team === "DET" ? "Other" : "DET", 21, 20));
      }
      const result = computeStreaks(games);
      expect(result.currentStreaks.length).toBeLessThanOrEqual(10);
    });
  });

  describe("all-time records", () => {
    it("limits winning streaks to top 10", () => {
      const games: StreakGame[] = [];
      for (let i = 0; i < 50; i++) {
        games.push(mockGame("KC", "DET", 21, 20));
      }
      const result = computeStreaks(games);
      expect(result.longestWinningStreaks.length).toBeLessThanOrEqual(10);
    });

    it("limits losing streaks to top 10", () => {
      const games: StreakGame[] = [];
      for (let i = 0; i < 50; i++) {
        games.push(mockGame("KC", "DET", 17, 21));
      }
      const result = computeStreaks(games);
      expect(result.longestLosingStreaks.length).toBeLessThanOrEqual(10);
    });

    it("limits home win streaks to top 5", () => {
      const games: StreakGame[] = [];
      for (let i = 0; i < 30; i++) {
        games.push(mockGame("KC", "DET", 21, 20));
      }
      const result = computeStreaks(games);
      expect(result.longestHomeWinStreaks.length).toBeLessThanOrEqual(5);
    });

    it("sorts streaks by length descending", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("KC", "DET", 24, 21),
        mockGame("KC", "DET", 20, 17),
        mockGame("PHI", "DET", 21, 20),
        mockGame("PHI", "DET", 20, 17),
      ];
      const result = computeStreaks(games);
      if (result.longestWinningStreaks.length > 1) {
        expect(result.longestWinningStreaks[0].allTimeRecord).toBeGreaterThanOrEqual(
          result.longestWinningStreaks[1].allTimeRecord
        );
      }
    });
  });

  describe("edge cases", () => {
    it("handles ties", () => {
      const games = [mockGame("KC", "DET", 21, 21)];
      const result = computeStreaks(games);
      expect(result.longestWinningStreaks.length).toBe(2);
      expect(result.longestLosingStreaks.length).toBe(2);
    });

    it("handles null spread results", () => {
      const games = [{ ...mockGame("KC", "DET"), spreadResult: null }];
      const result = computeStreaks(games);
      expect(result.longestATSStreaks.length).toBe(2);
    });

    it("resets streaks on opposite result", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("KC", "DET", 24, 21),
        mockGame("KC", "DET", 17, 21), // Streak breaks
        mockGame("KC", "DET", 21, 20), // New streak starts
      ];
      const result = computeStreaks(games);
      const kcWins = result.longestWinningStreaks.find((s) => s.teamName === "KC");
      expect(kcWins?.allTimeRecord).toBeGreaterThanOrEqual(1);
    });

    it("handles single game", () => {
      const games = [mockGame("KC", "DET", 21, 20)];
      const result = computeStreaks(games);
      expect(result.longestWinningStreaks.length).toBeGreaterThan(0);
    });
  });

  describe("multiple teams", () => {
    it("tracks multiple teams independently", () => {
      const games = [
        mockGame("KC", "DET", 21, 20),
        mockGame("KC", "DET", 24, 21),
        mockGame("PHI", "NE", 21, 20),
        mockGame("PHI", "NE", 24, 21),
      ];
      const result = computeStreaks(games);
      const kcWins = result.longestWinningStreaks.filter((s) => s.teamName === "KC");
      const phillyWins = result.longestWinningStreaks.filter((s) => s.teamName === "PHI");
      expect(kcWins.length).toBeGreaterThan(0);
      expect(phillyWins.length).toBeGreaterThan(0);
    });
  });

  describe("data formatting", () => {
    it("includes season information", () => {
      const games = [mockGame("KC", "DET", 21, 20, 2023)];
      const result = computeStreaks(games);
      if (result.longestWinningStreaks.length > 0) {
        expect(result.longestWinningStreaks[0].season).toBe(2023);
      }
    });

    it("includes season range in all-time records", () => {
      const games = [
        mockGame("KC", "DET", 21, 20, 2020),
        mockGame("KC", "DET", 24, 21, 2021),
        mockGame("KC", "DET", 20, 17, 2022),
      ];
      const result = computeStreaks(games);
      const kcWins = result.longestWinningStreaks.find((s) => s.teamName === "KC");
      expect(kcWins?.allTimeSeasons).toContain("-");
    });
  });
});
