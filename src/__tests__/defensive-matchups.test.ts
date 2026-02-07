import { describe, it, expect } from "vitest";
import { computeDefensiveMatchups, type DefMatchupGame } from "@/lib/defensive-matchups";

const mockGame = (
  season: number = 2023,
  homeTeamName: string = "Kansas City Chiefs",
  awayTeamName: string = "Detroit Lions",
  homeScore: number = 21,
  awayScore: number = 20
): DefMatchupGame => ({
  season,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
});

describe("defensive-matchups.ts", () => {
  describe("computeDefensiveMatchups", () => {
    it("returns empty result for empty games", () => {
      const result = computeDefensiveMatchups([]);
      expect(result.teamDefenseRatings).toEqual([]);
      expect(result.bestDefenses).toEqual([]);
      expect(result.worstDefenses).toEqual([]);
      expect(result.defensiveMatchups).toEqual([]);
      expect(result.seasonDefenseTrends).toEqual([]);
    });

    it("calculates points allowed per game for home team defense", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 24, 15),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.ptsAllowedPerGame).toBe((20 + 15) / 2);
      expect(kcDefense?.totalPtsAllowed).toBe(35);
    });

    it("calculates points allowed per game for away team defense", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 24, 15),
      ];
      const result = computeDefensiveMatchups(games);
      const detDefense = result.teamDefenseRatings.find((r) => r.team === "DET");
      expect(detDefense?.ptsAllowedPerGame).toBe((21 + 24) / 2);
      expect(detDefense?.totalPtsAllowed).toBe(45);
    });

    it("counts shutouts correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 0),
        mockGame(2023, "KC", "DET", 24, 0),
        mockGame(2023, "KC", "DET", 20, 17),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.shutouts).toBe(2);
    });

    it("counts under 14 points games correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 10),
        mockGame(2023, "KC", "DET", 24, 13),
        mockGame(2023, "KC", "DET", 20, 17),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.under14Games).toBe(2);
    });

    it("counts under 21 points games correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 10),
        mockGame(2023, "KC", "DET", 24, 15),
        mockGame(2023, "KC", "DET", 20, 25),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.under21Games).toBe(2);
    });

    it("identifies best defenses by points allowed per game", () => {
      const games = [
        mockGame(2023, "BestDef", "BadDef", 28, 10),
        mockGame(2023, "BadDef", "BestDef", 30, 40),
      ];
      const result = computeDefensiveMatchups(games);
      const bestDefense = result.bestDefenses.find((d) => d.team === "BestDef");
      expect(bestDefense).toBeDefined();
      expect(bestDefense?.ptsAllowedPerGame).toBeLessThanOrEqual(20);
    });

    it("identifies worst defenses by points allowed per game", () => {
      const games = [
        mockGame(2023, "BestDef", "BadDef", 28, 10),
        mockGame(2023, "BadDef", "BestDef", 30, 40),
      ];
      const result = computeDefensiveMatchups(games);
      const worstDefense = result.worstDefenses.find((d) => d.team === "BadDef");
      expect(worstDefense).toBeDefined();
      expect(worstDefense?.ptsAllowedPerGame).toBeGreaterThan(30);
    });

    it("limits best defenses to top 10", () => {
      const games: DefMatchupGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, `GoodDef${i}`, `BadDef${i}`, 28, 10));
      }
      const result = computeDefensiveMatchups(games);
      expect(result.bestDefenses.length).toBeLessThanOrEqual(10);
    });

    it("limits worst defenses to bottom 10", () => {
      const games: DefMatchupGame[] = [];
      for (let i = 1; i <= 15; i++) {
        games.push(mockGame(2023, `GoodDef${i}`, `BadDef${i}`, 10, 28));
      }
      const result = computeDefensiveMatchups(games);
      expect(result.worstDefenses.length).toBeLessThanOrEqual(10);
    });

    it("identifies defensive matchup pairs", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 17),
        mockGame(2023, "DET", "KC", 20, 18),
      ];
      const result = computeDefensiveMatchups(games);
      const matchup = result.defensiveMatchups.find(
        (m) => (m.team1 === "KC" && m.team2 === "DET") || (m.team1 === "DET" && m.team2 === "KC")
      );
      expect(matchup).toBeDefined();
      expect(matchup?.games).toBe(2);
    });

    it("calculates average total points in matchup pairs", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 17),
        mockGame(2023, "DET", "KC", 20, 18),
      ];
      const result = computeDefensiveMatchups(games);
      const matchup = result.defensiveMatchups.find(
        (m) => (m.team1 === "KC" && m.team2 === "DET") || (m.team1 === "DET" && m.team2 === "KC")
      );
      expect(matchup?.avgTotal).toBeCloseTo((38 + 38) / 2, 1);
    });

    it("sorts defensive matchups by lowest scoring", () => {
      const games = [
        mockGame(2023, "HighScore", "Team1", 35, 32),
        mockGame(2023, "LowScore", "Team2", 14, 13),
      ];
      const result = computeDefensiveMatchups(games);
      expect(result.defensiveMatchups[0].avgTotal).toBeLessThanOrEqual(result.defensiveMatchups[1]?.avgTotal || Infinity);
    });

    it("limits defensive matchups to top 20", () => {
      const games: DefMatchupGame[] = [];
      for (let i = 1; i <= 25; i++) {
        games.push(mockGame(2023, `Team${i}`, `Team${i + 1}`, 17, 16));
      }
      const result = computeDefensiveMatchups(games);
      expect(result.defensiveMatchups.length).toBeLessThanOrEqual(20);
    });

    it("calculates season league average points allowed", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "TB", "NO", 28, 24),
      ];
      const result = computeDefensiveMatchups(games);
      const seasonTrend = result.seasonDefenseTrends.find((t) => t.season === 2023);
      // League average is (20+21+24+28) / 4 = 93/4 = 23.25
      expect(seasonTrend?.leagueAvgPtsAllowed).toBeCloseTo(23.25, 1);
    });

    it("separates defense ratings by season", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2024, "KC", "DET", 28, 18),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefenses = result.teamDefenseRatings.filter((r) => r.team === "KC");
      expect(kcDefenses.length).toBe(2);
      expect(kcDefenses[0].season).toBe(2023);
      expect(kcDefenses[1].season).toBe(2024);
    });

    it("rounds points allowed per game to 2 decimal places", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 17),
        mockGame(2023, "KC", "DET", 24, 18),
        mockGame(2023, "KC", "DET", 20, 14),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      const decimalPlaces = (kcDefense?.ptsAllowedPerGame.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("counts games played correctly", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 24, 21),
        mockGame(2023, "KC", "DET", 20, 17),
      ];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.gamesPlayed).toBe(3);
    });

    it("handles teams playing same opponent multiple times", () => {
      const games = [
        mockGame(2023, "KC", "DET", 21, 17),
        mockGame(2023, "KC", "DET", 20, 18),
        mockGame(2023, "KC", "DET", 28, 16),
      ];
      const result = computeDefensiveMatchups(games);
      const matchup = result.defensiveMatchups[0];
      expect(matchup.games).toBe(3);
    });

    it("sorts season trends by season", () => {
      const games = [
        mockGame(2024, "KC", "DET", 21, 20),
        mockGame(2023, "KC", "DET", 24, 20),
        mockGame(2022, "KC", "DET", 20, 20),
      ];
      const result = computeDefensiveMatchups(games);
      expect(result.seasonDefenseTrends[0].season).toBe(2022);
      expect(result.seasonDefenseTrends[1].season).toBe(2023);
      expect(result.seasonDefenseTrends[2].season).toBe(2024);
    });

    it("handles games with 0 points allowed and scored", () => {
      const games = [mockGame(2023, "KC", "DET", 0, 0)];
      const result = computeDefensiveMatchups(games);
      const kcDefense = result.teamDefenseRatings.find((r) => r.team === "KC");
      expect(kcDefense?.ptsAllowedPerGame).toBe(0);
      expect(kcDefense?.shutouts).toBe(1);
    });
  });
});
