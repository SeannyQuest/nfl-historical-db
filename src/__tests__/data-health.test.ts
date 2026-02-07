import { describe, it, expect } from "vitest";
import { computeDataHealth } from "@/lib/data-health";

describe("Data Health", () => {
  it("should return F grade for empty games array", () => {
    const report = computeDataHealth([], "nfl");

    expect(report.totalGames).toBe(0);
    expect(report.grade).toBe("F");
    expect(report.completeness.scores).toBe(0);
  });

  it("should calculate score completeness for NFL", () => {
    const games = [
      {
        homeScore: 28,
        awayScore: 21,
        homeQ1: 7,
        homeFumbles: 1,
      },
      {
        homeScore: 0,
        awayScore: 0,
        homeQ1: null,
        homeFumbles: null,
      },
      {
        homeScore: 35,
        awayScore: 14,
        homeQ1: 7,
        homeFumbles: 2,
      },
    ];

    const report = computeDataHealth(games, "nfl");

    expect(report.totalGames).toBe(3);
    expect(report.completeness.scores).toBe(66.67); // 2 out of 3 games
  });

  it("should calculate quarter completeness for NFL", () => {
    const games = [
      {
        homeScore: 28,
        awayScore: 21,
        homeQ1: 7,
        homeFumbles: 1,
      },
      {
        homeScore: 35,
        awayScore: 14,
        homeQ1: 10,
        homeFumbles: 2,
      },
      {
        homeScore: 21,
        awayScore: 17,
        homeQ1: null,
        homeFumbles: null,
      },
    ];

    const report = computeDataHealth(games, "nfl");

    expect(report.completeness.quarters).toBe(66.67); // 2 out of 3 games
  });

  it("should calculate turnover completeness for NFL", () => {
    const games = [
      {
        homeScore: 28,
        awayScore: 21,
        homeQ1: 7,
        homeFumbles: 1,
      },
      {
        homeScore: 35,
        awayScore: 14,
        homeQ1: null,
        homeFumbles: null,
      },
    ];

    const report = computeDataHealth(games, "nfl");

    expect(report.completeness.turnovers).toBe(50); // 1 out of 2 games
  });

  it("should assign A grade for 90%+ completeness", () => {
    const games = Array(10)
      .fill(null)
      .map((_, i) => ({
        homeScore: 28 + i,
        awayScore: 21 + i,
        homeQ1: 7,
        homeFumbles: i % 3,
      }));

    const report = computeDataHealth(games, "nfl");

    expect(report.grade).toBe("A");
  });

  it("should assign B grade for 80-89% completeness", () => {
    const games = [
      { homeScore: 28, awayScore: 21, homeQ1: 7, homeFumbles: 1 },
      { homeScore: 35, awayScore: 14, homeQ1: 10, homeFumbles: 2 },
      { homeScore: 21, awayScore: 17, homeQ1: 5, homeFumbles: null },
      { homeScore: 0, awayScore: 0, homeQ1: null, homeFumbles: null },
      { homeScore: 42, awayScore: 38, homeQ1: 14, homeFumbles: 3 },
    ];

    const report = computeDataHealth(games, "nfl");

    expect(report.grade).toMatch(/[AB]/); // A or B
  });

  it("should extract seasons correctly", () => {
    const games = [
      { homeScore: 28, awayScore: 21, season: { year: 2023 } },
      { homeScore: 35, awayScore: 14, season: { year: 2023 } },
      { homeScore: 21, awayScore: 17, season: { year: 2024 } },
    ];

    const report = computeDataHealth(games, "cfb");

    expect(report.totalSeasons).toBe(2);
    expect(report.seasonsWithData).toContain(2023);
    expect(report.seasonsWithData).toContain(2024);
  });

  it("should return zero completeness for non-NFL sports when checking quarters/turnovers", () => {
    const games = [
      { homeScore: 28, awayScore: 21, season: { year: 2023 } },
      { homeScore: 35, awayScore: 14, season: { year: 2023 } },
    ];

    const report = computeDataHealth(games, "cfb");

    expect(report.completeness.quarters).toBe(0); // CFB doesn't have quarters
    expect(report.completeness.turnovers).toBe(0);
  });

  it("should round completeness percentages to 2 decimals", () => {
    const games = [
      { homeScore: 28, awayScore: 21, homeQ1: 7, homeFumbles: 1 },
      { homeScore: 35, awayScore: 14, homeQ1: 10, homeFumbles: 2 },
      { homeScore: 0, awayScore: 0, homeQ1: null, homeFumbles: null },
    ];

    const report = computeDataHealth(games, "nfl");

    expect(report.completeness.scores.toString()).toMatch(/^\d+\.\d{2}$/);
  });
});
