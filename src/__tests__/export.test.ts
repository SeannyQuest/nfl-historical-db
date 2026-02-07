import { describe, it, expect } from "vitest";
import {
  formatGamesCSV,
  formatGamesJSON,
  formatTeamStatsCSV,
  generateFilename,
  type ExportGame,
  type ExportTeamStats,
} from "@/lib/export";

const mockGame: ExportGame = {
  id: "1",
  date: "2023-09-10T13:00:00Z",
  season: 2023,
  week: "1",
  isPlayoff: false,
  homeTeamName: "Kansas City Chiefs",
  homeTeamAbbr: "KC",
  awayTeamName: "Detroit Lions",
  awayTeamAbbr: "DET",
  homeScore: 21,
  awayScore: 20,
  spread: 3.5,
  spreadResult: "COVERED",
  ouResult: "UNDER",
  overUnder: 42.5,
  primetime: "SNF",
};

const mockTeamStats: ExportTeamStats = {
  teamName: "Kansas City Chiefs",
  teamAbbr: "KC",
  season: 2023,
  wins: 14,
  losses: 3,
  ties: 0,
  pointsFor: 420,
  pointsAgainst: 280,
  atsRecord: "10-7",
};

describe("export.ts", () => {
  describe("formatGamesCSV", () => {
    it("formats games as CSV", () => {
      const csv = formatGamesCSV([mockGame]);
      expect(csv).toContain("Date,Season,Week,Type");
      expect(csv).toContain("2023-09-10");
      expect(csv).toContain("Kansas City Chiefs");
      expect(csv).toContain("Detroit Lions");
      expect(csv).toContain("21");
      expect(csv).toContain("20");
    });

    it("includes all game fields", () => {
      const csv = formatGamesCSV([mockGame]);
      expect(csv).toContain("SNF");
      expect(csv).toContain("COVERED");
      expect(csv).toContain("UNDER");
      expect(csv).toContain("3.5");
    });

    it("handles empty games array", () => {
      const csv = formatGamesCSV([]);
      expect(csv).toContain("Date,Season,Week,Type");
      const lines = csv.split("\n");
      expect(lines.length).toBe(1); // Only header
    });

    it("handles multiple games", () => {
      const game2 = { ...mockGame, id: "2", week: "2", homeScore: 24 };
      const csv = formatGamesCSV([mockGame, game2]);
      const lines = csv.split("\n");
      expect(lines.length).toBe(3); // Header + 2 games
      expect(csv).toContain("21");
      expect(csv).toContain("24");
    });

    it("properly escapes quotes and commas", () => {
      const game = { ...mockGame, homeTeamName: 'Team, "Special"' };
      const csv = formatGamesCSV([game]);
      expect(csv).toContain('KC Team, "Special"');
    });

    it("marks playoff games correctly", () => {
      const playoffGame = { ...mockGame, isPlayoff: true };
      const csv = formatGamesCSV([playoffGame]);
      expect(csv).toContain("Playoff");
    });
  });

  describe("formatGamesJSON", () => {
    it("formats games as JSON", () => {
      const json = formatGamesJSON([mockGame]);
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].id).toBe("1");
    });

    it("includes nested structure", () => {
      const json = formatGamesJSON([mockGame]);
      const parsed = JSON.parse(json);
      expect(parsed[0].away.abbreviation).toBe("DET");
      expect(parsed[0].home.score).toBe(21);
      expect(parsed[0].betting.spread).toBe(3.5);
    });

    it("formats date without time", () => {
      const json = formatGamesJSON([mockGame]);
      const parsed = JSON.parse(json);
      expect(parsed[0].date).toBe("2023-09-10");
    });

    it("handles null betting values", () => {
      const game = { ...mockGame, spread: null, spreadResult: null };
      const json = formatGamesJSON([game]);
      const parsed = JSON.parse(json);
      expect(parsed[0].betting.spread).toBeNull();
      expect(parsed[0].betting.spreadResult).toBeNull();
    });

    it("handles empty games array", () => {
      const json = formatGamesJSON([]);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual([]);
    });

    it("handles multiple games", () => {
      const game2 = { ...mockGame, id: "2", week: "2" };
      const json = formatGamesJSON([mockGame, game2]);
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(2);
    });

    it("marks playoff games correctly", () => {
      const playoffGame = { ...mockGame, isPlayoff: true };
      const json = formatGamesJSON([playoffGame]);
      const parsed = JSON.parse(json);
      expect(parsed[0].type).toBe("Playoff");
    });
  });

  describe("formatTeamStatsCSV", () => {
    it("formats team stats as CSV", () => {
      const csv = formatTeamStatsCSV([mockTeamStats]);
      expect(csv).toContain("Team,Season,Wins,Losses,Ties");
      expect(csv).toContain("KC Kansas City Chiefs");
      expect(csv).toContain("2023");
      expect(csv).toContain("14");
      expect(csv).toContain("3");
    });

    it("calculates win percentage", () => {
      const csv = formatTeamStatsCSV([mockTeamStats]);
      expect(csv).toContain("0.824"); // 14/17
    });

    it("calculates point differential", () => {
      const csv = formatTeamStatsCSV([mockTeamStats]);
      expect(csv).toContain("140"); // 420 - 280
    });

    it("includes ATS record", () => {
      const csv = formatTeamStatsCSV([mockTeamStats]);
      expect(csv).toContain("10-7");
    });

    it("handles empty stats array", () => {
      const csv = formatTeamStatsCSV([]);
      expect(csv).toContain("Team,Season,Wins,Losses");
      const lines = csv.split("\n");
      expect(lines.length).toBe(1);
    });

    it("handles multiple teams", () => {
      const stats2 = { ...mockTeamStats, teamAbbr: "DET", teamName: "Lions", wins: 12 };
      const csv = formatTeamStatsCSV([mockTeamStats, stats2]);
      const lines = csv.split("\n");
      expect(lines.length).toBe(3);
    });

    it("calculates zero win percentage for empty season", () => {
      const stats = { ...mockTeamStats, wins: 0, losses: 0, ties: 0 };
      const csv = formatTeamStatsCSV([stats]);
      expect(csv).toContain(".000");
    });

    it("handles ties in record", () => {
      const stats = { ...mockTeamStats, ties: 1, wins: 13, losses: 3 };
      const csv = formatTeamStatsCSV([stats]);
      expect(csv).toContain("0.765"); // 13/17
    });
  });

  describe("generateFilename", () => {
    it("generates games filename with date", () => {
      const filename = generateFilename("games", { format: "csv" });
      const today = new Date().toISOString().split("T")[0];
      expect(filename).toContain(`nfl-games-${today}`);
      expect(filename).toBe(`nfl-games-${today}.csv`);
    });

    it("generates team-stats filename", () => {
      const filename = generateFilename("team-stats", { format: "json" });
      expect(filename).toContain("nfl-team-stats-");
      expect(filename).toMatch(/\.json$/);
    });

    it("includes season filter in filename", () => {
      const filename = generateFilename("games", { season: 2023, format: "csv" });
      expect(filename).toContain("-s2023");
    });

    it("includes team filter in filename", () => {
      const filename = generateFilename("games", { team: "Kansas City Chiefs", format: "csv" });
      expect(filename).toContain("kansas-city-chiefs");
    });

    it("combines multiple filters", () => {
      const filename = generateFilename("games", {
        season: 2023,
        team: "Kansas City Chiefs",
        format: "csv",
      });
      expect(filename).toContain("s2023");
      expect(filename).toContain("kansas-city-chiefs");
    });

    it("handles json format", () => {
      const filename = generateFilename("games", { format: "json" });
      expect(filename).toMatch(/\.json$/);
    });

    it("defaults to csv when not specified", () => {
      const filename = generateFilename("games", { format: "csv" });
      expect(filename).toMatch(/\.csv$/);
    });

    it("converts team names to lowercase and hyphenated", () => {
      const filename = generateFilename("games", { team: "NEW YORK JETS", format: "csv" });
      expect(filename).toContain("new-york-jets");
    });
  });
});
