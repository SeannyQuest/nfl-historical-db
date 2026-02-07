import { describe, it, expect } from "vitest";
import {
  buildSearchQuery,
  normalizeTeamName,
  parseScoreRange,
  parseSeasonRange,
} from "@/lib/search";

describe("search.ts", () => {
  describe("normalizeTeamName", () => {
    it("normalizes abbreviation", () => {
      expect(normalizeTeamName("KC")).toBe("Kansas City Chiefs");
      expect(normalizeTeamName("DAL")).toBe("Dallas Cowboys");
      expect(normalizeTeamName("PHI")).toBe("Philadelphia Eagles");
    });

    it("normalizes nickname", () => {
      expect(normalizeTeamName("Chiefs")).toBe("Kansas City Chiefs");
      expect(normalizeTeamName("Cowboys")).toBe("Dallas Cowboys");
      expect(normalizeTeamName("Eagles")).toBe("Philadelphia Eagles");
    });

    it("normalizes city name", () => {
      expect(normalizeTeamName("Kansas City")).toBe("Kansas City Chiefs");
      expect(normalizeTeamName("Dallas")).toBe("Dallas Cowboys");
      expect(normalizeTeamName("Philadelphia")).toBe("Philadelphia Eagles");
    });

    it("is case-insensitive", () => {
      expect(normalizeTeamName("kc")).toBe("Kansas City Chiefs");
      expect(normalizeTeamName("chiefs")).toBe("Kansas City Chiefs");
      expect(normalizeTeamName("KANSAS CITY")).toBe("Kansas City Chiefs");
    });

    it("returns null for invalid team", () => {
      expect(normalizeTeamName("InvalidTeam")).toBeNull();
      expect(normalizeTeamName("")).toBeNull();
      expect(normalizeTeamName("XYZ")).toBeNull();
    });
  });

  describe("parseScoreRange", () => {
    it("parses 30+ format", () => {
      expect(parseScoreRange("30+")).toEqual({ min: 30, max: 200 });
      expect(parseScoreRange("50+")).toEqual({ min: 50, max: 200 });
      expect(parseScoreRange("0+")).toEqual({ min: 0, max: 200 });
    });

    it("parses 20-30 range format", () => {
      expect(parseScoreRange("20-30")).toEqual({ min: 20, max: 30 });
      expect(parseScoreRange("10-40")).toEqual({ min: 10, max: 40 });
      expect(parseScoreRange("0-100")).toEqual({ min: 0, max: 100 });
    });

    it("parses plain number", () => {
      expect(parseScoreRange("30")).toEqual({ min: 30, max: 30 });
      expect(parseScoreRange("0")).toEqual({ min: 0, max: 0 });
      expect(parseScoreRange("100")).toEqual({ min: 100, max: 100 });
    });

    it("trims whitespace", () => {
      expect(parseScoreRange("  30+  ")).toEqual({ min: 30, max: 200 });
      expect(parseScoreRange(" 20-30 ")).toEqual({ min: 20, max: 30 });
    });

    it("returns null for invalid input", () => {
      expect(parseScoreRange("")).toBeNull();
      expect(parseScoreRange("invalid")).toBeNull();
      expect(parseScoreRange("30-20")).toBeNull(); // reversed range
      expect(parseScoreRange("-5")).toBeNull();
    });
  });

  describe("parseSeasonRange", () => {
    it("parses since format", () => {
      expect(parseSeasonRange("since 2010")).toEqual({ start: 2010, end: 2025 });
      expect(parseSeasonRange("since 2000")).toEqual({ start: 2000, end: 2025 });
    });

    it("parses range format", () => {
      expect(parseSeasonRange("2020-2024")).toEqual({ start: 2020, end: 2024 });
      expect(parseSeasonRange("2010-2015")).toEqual({ start: 2010, end: 2015 });
    });

    it("parses plain year", () => {
      expect(parseSeasonRange("2020")).toEqual({ start: 2020, end: 2020 });
      expect(parseSeasonRange("1995")).toEqual({ start: 1995, end: 1995 });
    });

    it("is case-insensitive for since", () => {
      expect(parseSeasonRange("SINCE 2010")).toEqual({ start: 2010, end: 2025 });
      expect(parseSeasonRange("Since 2010")).toEqual({ start: 2010, end: 2025 });
    });

    it("returns null for invalid input", () => {
      expect(parseSeasonRange("")).toBeNull();
      expect(parseSeasonRange("invalid")).toBeNull();
      expect(parseSeasonRange("2024-2020")).toBeNull(); // reversed
      expect(parseSeasonRange("1800")).toBeNull(); // too old
      expect(parseSeasonRange("2500")).toBeNull(); // too far future
    });
  });

  describe("buildSearchQuery", () => {
    it("parses single team", () => {
      const result = buildSearchQuery("Chiefs");
      expect(result.teamNames).toContain("Kansas City Chiefs");
    });

    it("parses multiple teams", () => {
      const result = buildSearchQuery("Chiefs Cowboys");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.teamNames).toContain("Dallas Cowboys");
    });

    it("parses team with abbreviation", () => {
      const result = buildSearchQuery("KC DAL");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.teamNames).toContain("Dallas Cowboys");
    });

    it("parses score range", () => {
      const result = buildSearchQuery("30+");
      expect(result.scoreMin).toBe(30);
      expect(result.scoreMax).toBe(200);
    });

    it("parses score range with team", () => {
      const result = buildSearchQuery("Chiefs 30+");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.scoreMin).toBe(30);
    });

    it("parses season range", () => {
      const result = buildSearchQuery("2020-2024");
      expect(result.seasonStart).toBe(2020);
      expect(result.seasonEnd).toBe(2024);
    });

    it("parses since format", () => {
      const result = buildSearchQuery("since 2015");
      expect(result.seasonStart).toBe(2015);
      expect(result.seasonEnd).toBe(2025);
    });

    it("parses complex query", () => {
      const result = buildSearchQuery("Chiefs Cowboys 2020-2024 35+");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.teamNames).toContain("Dallas Cowboys");
      expect(result.seasonStart).toBe(2020);
      expect(result.seasonEnd).toBe(2024);
      expect(result.scoreMin).toBe(35);
    });

    it("parses week format", () => {
      const result = buildSearchQuery("week5");
      expect(result.week).toBe("5");
    });

    it("parses query with week and team", () => {
      const result = buildSearchQuery("Chiefs week5");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.week).toBe("5");
    });

    it("ignores unrecognized tokens", () => {
      const result = buildSearchQuery("Chiefs randomword 2020");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.seasonStart).toBe(2020);
    });

    it("returns empty filters for empty input", () => {
      const result = buildSearchQuery("");
      expect(result.teamNames).toEqual([]);
      expect(result.scoreMin).toBeUndefined();
    });

    it("handles whitespace", () => {
      const result = buildSearchQuery("  Chiefs   Cowboys  ");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.teamNames).toContain("Dallas Cowboys");
    });

    it("avoids duplicate teams", () => {
      const result = buildSearchQuery("Chiefs Chiefs KC");
      expect(result.teamNames.filter((t) => t === "Kansas City Chiefs").length).toBe(1);
    });

    it("parses two-word team names", () => {
      const result = buildSearchQuery("Kansas City");
      expect(result.teamNames).toContain("Kansas City Chiefs");
    });

    it("parses New York Giants", () => {
      const result = buildSearchQuery("New York Giants");
      expect(result.teamNames).toContain("New York Giants");
    });

    it("parses San Francisco 49ers", () => {
      const result = buildSearchQuery("San Francisco");
      expect(result.teamNames).toContain("San Francisco 49ers");
    });

    it("handles mixed case input", () => {
      const result = buildSearchQuery("CHIEFS 2020-2024");
      expect(result.teamNames).toContain("Kansas City Chiefs");
      expect(result.seasonStart).toBe(2020);
    });
  });
});
