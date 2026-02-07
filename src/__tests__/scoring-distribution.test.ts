import { describe, it, expect } from "vitest";
import { computeScoringDistribution, type ScoringGame } from "@/lib/scoring-distribution";

describe("scoring-distribution.ts", () => {
  const mockGames: ScoringGame[] = [
    {
      season: 2023,
      homeScore: 24,
      awayScore: 20,
      isPlayoff: false,
      primetime: "Sunday Night",
      date: "2023-09-10",
    },
    {
      season: 2023,
      homeScore: 31,
      awayScore: 27,
      isPlayoff: false,
      primetime: null,
      date: "2023-09-11",
    },
    {
      season: 2023,
      homeScore: 10,
      awayScore: 8,
      isPlayoff: false,
      primetime: null,
      date: "2023-09-12",
    },
    {
      season: 2022,
      homeScore: 45,
      awayScore: 42,
      isPlayoff: false,
      primetime: "Monday Night",
      date: "2022-09-10",
    },
    {
      season: 2022,
      homeScore: 13,
      awayScore: 10,
      isPlayoff: false,
      primetime: null,
      date: "2022-09-11",
    },
    {
      season: 2020,
      homeScore: 56,
      awayScore: 55,
      isPlayoff: false,
      primetime: null,
      date: "2020-01-01",
    },
    {
      season: 2020,
      homeScore: 3,
      awayScore: 0,
      isPlayoff: false,
      primetime: null,
      date: "2020-01-02",
    },
  ];

  describe("computeScoringDistribution", () => {
    it("returns empty distribution for empty games", () => {
      const result = computeScoringDistribution([]);
      expect(result.totalGames).toBe(0);
      expect(result.overallAvgTotal).toBe("0.0");
      expect(result.scoreDistribution).toHaveLength(6);
      expect(result.marginDistribution).toHaveLength(6);
    });

    it("computes total games count", () => {
      const result = computeScoringDistribution(mockGames);
      expect(result.totalGames).toBe(7);
    });

    it("computes overall average total", () => {
      const result = computeScoringDistribution(mockGames);
      // (44 + 58 + 18 + 87 + 23 + 111 + 3) / 7 = 344 / 7 = 49.14...
      expect(parseFloat(result.overallAvgTotal)).toBeCloseTo(49.14, 1);
    });

    it("computes score distribution buckets", () => {
      const result = computeScoringDistribution(mockGames);
      const dist = result.scoreDistribution;

      expect(dist).toHaveLength(6);
      expect(dist[0].label).toBe("0-20");
      expect(dist[1].label).toBe("21-30");
      expect(dist[2].label).toBe("31-40");
      expect(dist[3].label).toBe("41-50");
      expect(dist[4].label).toBe("51-60");
      expect(dist[5].label).toBe("61+");

      // Game totals: 44, 58, 18, 87, 23, 111, 3
      // 0-20: 18, 3 (2 games)
      expect(dist[0].count).toBe(2);
      // 21-30: 23 (1 game)
      expect(dist[1].count).toBe(1);
      // 31-40: none (0 games)
      expect(dist[2].count).toBe(0);
      // 41-50: 44 (1 game)
      expect(dist[3].count).toBe(1);
      // 51-60: 58 (1 game)
      expect(dist[4].count).toBe(1);
      // 61+: 87, 111 (2 games)
      expect(dist[5].count).toBe(2);
      // Total should equal 7 games
      const total = dist.reduce((sum, b) => sum + b.count, 0);
      expect(total).toBe(7);
    });

    it("computes percentages correctly", () => {
      const result = computeScoringDistribution(mockGames);
      const dist = result.scoreDistribution;

      // 2/7 = 28.6%
      expect(parseFloat(dist[0].percentage)).toBeCloseTo(28.6, 0);
      // 1/7 = 14.3%
      expect(parseFloat(dist[1].percentage)).toBeCloseTo(14.3, 0);
    });

    it("computes margin distribution", () => {
      const result = computeScoringDistribution(mockGames);
      const margin = result.marginDistribution;

      expect(margin).toHaveLength(6);
      expect(margin[0].label).toBe("0 (Tie)");
      expect(margin[1].label).toBe("1-3");
      // Margins: 4, 4, 2, 3, 3, 1, 3
    });

    it("groups games by era/decade", () => {
      const result = computeScoringDistribution(mockGames);
      const eras = result.byEra;

      expect(eras.length).toBeGreaterThan(0);
      expect(eras.some((e) => e.decade === 2020)).toBe(true);
      expect(eras.some((e) => e.decade === 2030)).toBe(false); // No 2030s games
    });

    it("computes era statistics", () => {
      const result = computeScoringDistribution(mockGames);
      const era2020 = result.byEra.find((e) => e.decade === 2020);

      expect(era2020).toBeDefined();
      expect(era2020!.era).toBe("2020s");
      // 2020s includes 2023, 2022, and 2020 games = 7 total games
      expect(era2020!.games).toBe(7);
      // Highest total in dataset is 111 (2020), lowest is 3 (2020)
      expect(era2020!.highestGame).toBe(111);
      expect(era2020!.lowestGame).toBe(3);
    });

    it("analyzes by day of week", () => {
      const result = computeScoringDistribution(mockGames);
      const byDay = result.byDayOfWeek;

      expect(byDay.length).toBeGreaterThan(0);
      expect(byDay.some((d) => d.games > 0)).toBe(true);
    });

    it("compares primetime vs regular", () => {
      const result = computeScoringDistribution(mockGames);
      const { primetime, regular } = result.primetimeComparison;

      expect(primetime.games).toBeGreaterThan(0);
      expect(regular.games).toBeGreaterThan(0);
      expect(primetime.games + regular.games).toBe(7);
    });

    it("calculates primetime averages", () => {
      const result = computeScoringDistribution(mockGames);
      const { primetime } = result.primetimeComparison;

      // Primetime games: 44, 87 (total 131, avg 65.5)
      expect(parseFloat(primetime.avgTotal)).toBeCloseTo(65.5, 1);
      expect(primetime.games).toBe(2);
    });

    it("calculates regular season averages", () => {
      const result = computeScoringDistribution(mockGames);
      const { regular } = result.primetimeComparison;

      // Regular games: 58, 18, 23, 111, 3 (total 213, avg 42.6)
      expect(parseFloat(regular.avgTotal)).toBeCloseTo(42.6, 1);
      expect(regular.games).toBe(5);
    });

    it("handles single game", () => {
      const singleGame: ScoringGame[] = [
        {
          season: 2023,
          homeScore: 24,
          awayScore: 20,
          isPlayoff: false,
          primetime: null,
          date: "2023-09-10",
        },
      ];

      const result = computeScoringDistribution(singleGame);
      expect(result.totalGames).toBe(1);
      expect(result.overallAvgTotal).toBe("44.0");
    });

    it("handles playoff games in statistics", () => {
      const games: ScoringGame[] = [
        {
          season: 2023,
          homeScore: 24,
          awayScore: 20,
          isPlayoff: true,
          primetime: null,
          date: "2023-01-15",
        },
        {
          season: 2023,
          homeScore: 30,
          awayScore: 27,
          isPlayoff: false,
          primetime: null,
          date: "2023-09-10",
        },
      ];

      const result = computeScoringDistribution(games);
      expect(result.totalGames).toBe(2);
      expect(parseFloat(result.overallAvgTotal)).toBeCloseTo(50.5, 1);
    });

    it("handles all primetime games", () => {
      const ptGames: ScoringGame[] = [
        {
          season: 2023,
          homeScore: 24,
          awayScore: 20,
          isPlayoff: false,
          primetime: "Sunday Night",
          date: "2023-09-10",
        },
        {
          season: 2023,
          homeScore: 30,
          awayScore: 27,
          isPlayoff: false,
          primetime: "Monday Night",
          date: "2023-09-11",
        },
      ];

      const result = computeScoringDistribution(ptGames);
      expect(result.primetimeComparison.primetime.games).toBe(2);
      expect(result.primetimeComparison.regular.games).toBe(0);
    });

    it("handles all regular season games", () => {
      const rgGames: ScoringGame[] = [
        {
          season: 2023,
          homeScore: 24,
          awayScore: 20,
          isPlayoff: false,
          primetime: null,
          date: "2023-09-10",
        },
        {
          season: 2023,
          homeScore: 30,
          awayScore: 27,
          isPlayoff: false,
          primetime: null,
          date: "2023-09-11",
        },
      ];

      const result = computeScoringDistribution(rgGames);
      expect(result.primetimeComparison.primetime.games).toBe(0);
      expect(result.primetimeComparison.regular.games).toBe(2);
    });

    it("eras are sorted by decade descending", () => {
      const result = computeScoringDistribution(mockGames);
      const eras = result.byEra;

      for (let i = 0; i < eras.length - 1; i++) {
        expect(eras[i].decade).toBeGreaterThanOrEqual(eras[i + 1].decade);
      }
    });

    it("day of week preserves order", () => {
      const result = computeScoringDistribution(mockGames);
      const days = result.byDayOfWeek;

      const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      for (let i = 0; i < days.length - 1; i++) {
        const idx1 = dayOrder.indexOf(days[i].day);
        const idx2 = dayOrder.indexOf(days[i + 1].day);
        expect(idx1).toBeLessThanOrEqual(idx2);
      }
    });
  });
});
