import { describe, it, expect } from "vitest";
import { computeCoachingStats, type CoachingGame } from "@/lib/coaching";

function makeGame(overrides: Partial<CoachingGame> = {}): CoachingGame {
  return {
    season: 2024,
    week: "5",
    homeTeamName: "New England Patriots",
    awayTeamName: "Buffalo Bills",
    homeScore: 24,
    awayScore: 21,
    homeTeamAbbr: "NE",
    awayTeamAbbr: "BUF",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeCoachingStats — empty", () => {
  it("returns empty lists for no games", () => {
    const r = computeCoachingStats([]);
    expect(r.stats.totalTeams).toBe(0);
    expect(r.stats.mostImprovedTeams).toHaveLength(0);
    expect(r.stats.mostDeclinedTeams).toHaveLength(0);
  });
});

// ─── Most Improved Teams ─────────────────────────────────

describe("computeCoachingStats — most improved teams", () => {
  it("identifies improvement between seasons", () => {
    const games = [
      // Season 2023: Team A goes 1-2 (.333)
      makeGame({ season: 2023, homeTeamName: "Team A", homeScore: 20, awayScore: 10 }),
      makeGame({ season: 2023, homeTeamName: "Team B", awayTeamName: "Team A", homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2023, homeTeamName: "Team C", awayTeamName: "Team A", homeScore: 28, awayScore: 14 }),
      // Season 2024: Team A goes 3-0 (1.000)
      makeGame({ season: 2024, homeTeamName: "Team A", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2024, homeTeamName: "Team A", homeScore: 28, awayScore: 7 }),
      makeGame({ season: 2024, homeTeamName: "Team A", homeScore: 25, awayScore: 20 }),
    ];
    const r = computeCoachingStats(games);
    const improved = r.stats.mostImprovedTeams.find((t) => t.team === "Team A");
    expect(improved?.improvement).toBeDefined();
    expect(parseFloat(improved?.improvement ?? "0")).toBeGreaterThan(0);
  });

  it("limits most improved teams to 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const season = i < 15 ? 2023 : 2024;
      const teamNum = (i % 15) + 1;
      return makeGame({
        season,
        homeTeamName: `Team ${teamNum}`,
        awayTeamName: `Team ${(teamNum % 15) + 1}`,
        homeScore: season === 2024 ? 28 : 20,
        awayScore: season === 2024 ? 10 : 20,
      });
    });
    const r = computeCoachingStats(games);
    expect(r.stats.mostImprovedTeams.length).toBeLessThanOrEqual(10);
  });

  it("calculates improvement percentage", () => {
    const games = [
      // 2023: 2-2 (.500)
      makeGame({ season: 2023, homeTeamName: "Team X", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2023, homeTeamName: "Team X", homeScore: 25, awayScore: 23 }),
      makeGame({ season: 2023, awayTeamName: "Team X", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2023, awayTeamName: "Team X", homeScore: 28, awayScore: 14 }),
      // 2024: 4-0 (1.000)
      makeGame({ season: 2024, homeTeamName: "Team X", homeScore: 28, awayScore: 7 }),
      makeGame({ season: 2024, homeTeamName: "Team X", homeScore: 31, awayScore: 6 }),
      makeGame({ season: 2024, homeTeamName: "Team X", homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, homeTeamName: "Team X", homeScore: 27, awayScore: 20 }),
    ];
    const r = computeCoachingStats(games);
    const teamX = r.stats.mostImprovedTeams.find((t) => t.team === "Team X");
    expect(teamX?.improvement).toBe("0.500");
  });
});

// ─── Most Declined Teams ────────────────────────────────

describe("computeCoachingStats — most declined teams", () => {
  it("identifies decline between seasons", () => {
    const games = [
      // Season 2023: Team B goes 3-0 (1.000)
      makeGame({ season: 2023, homeTeamName: "Team B", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2023, homeTeamName: "Team B", homeScore: 28, awayScore: 7 }),
      makeGame({ season: 2023, homeTeamName: "Team B", homeScore: 25, awayScore: 20 }),
      // Season 2024: Team B goes 1-2 (.333)
      makeGame({ season: 2024, homeTeamName: "Team B", homeScore: 20, awayScore: 10 }),
      makeGame({ season: 2024, awayTeamName: "Team B", homeScore: 24, awayScore: 21 }),
      makeGame({ season: 2024, awayTeamName: "Team B", homeScore: 28, awayScore: 14 }),
    ];
    const r = computeCoachingStats(games);
    const declined = r.stats.mostDeclinedTeams.find((t) => t.team === "Team B");
    expect(declined?.decline).toBeDefined();
    expect(parseFloat(declined?.decline ?? "0")).toBeGreaterThan(0);
  });

  it("limits most declined teams to 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const season = i < 15 ? 2023 : 2024;
      const teamNum = (i % 15) + 1;
      return makeGame({
        season,
        homeTeamName: `Team ${teamNum}`,
        awayTeamName: `Team ${(teamNum % 15) + 1}`,
        homeScore: season === 2023 ? 28 : 20,
        awayScore: season === 2023 ? 10 : 20,
      });
    });
    const r = computeCoachingStats(games);
    expect(r.stats.mostDeclinedTeams.length).toBeLessThanOrEqual(10);
  });
});

// ─── Consistency Score ───────────────────────────────────

describe("computeCoachingStats — consistency", () => {
  it("identifies consistent teams", () => {
    const games = [
      // Team C: consistent winning
      makeGame({ season: 2021, homeTeamName: "Team C", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2022, homeTeamName: "Team C", homeScore: 25, awayScore: 23 }),
      makeGame({ season: 2023, homeTeamName: "Team C", homeScore: 27, awayScore: 22 }),
      makeGame({ season: 2024, homeTeamName: "Team C", homeScore: 26, awayScore: 21 }),
    ];
    const r = computeCoachingStats(games);
    const consistent = r.stats.consistentTeams.find((t) => t.team === "Team C");
    expect(consistent?.consistencyScore).toBeDefined();
    expect(parseFloat(consistent?.consistencyScore ?? "0")).toBeGreaterThan(0);
  });

  it("tracks biggest improvement/decline within consistency", () => {
    const games = [
      makeGame({ season: 2021, homeTeamName: "Team D", homeScore: 20, awayScore: 10 }),
      makeGame({ season: 2022, homeTeamName: "Team D", homeScore: 28, awayScore: 7 }),
      makeGame({ season: 2023, homeTeamName: "Team D", homeScore: 25, awayScore: 20 }),
    ];
    const r = computeCoachingStats(games);
    const teamD = r.stats.consistentTeams.find((t) => t.team === "Team D");
    expect(teamD?.biggestImprovement).toBeDefined();
    expect(teamD?.biggestDecline).toBeDefined();
  });

  it("limits consistent teams to 15", () => {
    const games = Array.from({ length: 60 }, (_, i) => {
      const season = Math.floor(i / 5) + 2020;
      const teamNum = (i % 20) + 1;
      return makeGame({
        season,
        homeTeamName: `Team ${teamNum}`,
        awayTeamName: `Team ${(teamNum % 20) + 1}`,
        homeScore: 24,
        awayScore: 20,
      });
    });
    const r = computeCoachingStats(games);
    expect(r.stats.consistentTeams.length).toBeLessThanOrEqual(15);
  });

  it("calculates seasons coached", () => {
    const games = [
      makeGame({ season: 2021, homeTeamName: "Team E" }),
      makeGame({ season: 2022, homeTeamName: "Team E" }),
      makeGame({ season: 2023, homeTeamName: "Team E" }),
      makeGame({ season: 2024, homeTeamName: "Team E" }),
    ];
    const r = computeCoachingStats(games);
    const teamE = r.stats.consistentTeams.find((t) => t.team === "Team E");
    expect(teamE?.seasons).toBe(4);
  });
});

// ─── Team Count ──────────────────────────────────────────

describe("computeCoachingStats — team tracking", () => {
  it("counts total teams", () => {
    const games = [
      makeGame({ homeTeamName: "Team 1", awayTeamName: "Team 2" }),
      makeGame({ homeTeamName: "Team 3", awayTeamName: "Team 4" }),
      makeGame({ homeTeamName: "Team 1", awayTeamName: "Team 3" }),
    ];
    const r = computeCoachingStats(games);
    expect(r.stats.totalTeams).toBe(4);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeCoachingStats — edge cases", () => {
  it("handles single season (no improvement/decline)", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team F", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team F", homeScore: 25, awayScore: 23 }),
    ];
    const r = computeCoachingStats(games);
    // No prior season, so no improvement/decline
    expect(r.stats.mostImprovedTeams.length).toBe(0);
  });

  it("handles ties in year-over-year change", () => {
    const games = [
      // 2023: 2-2
      makeGame({ season: 2023, homeTeamName: "Team G", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2023, homeTeamName: "Team G", homeScore: 25, awayScore: 23 }),
      makeGame({ season: 2023, awayTeamName: "Team G", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2023, awayTeamName: "Team G", homeScore: 28, awayScore: 14 }),
      // 2024: 2-2 (same)
      makeGame({ season: 2024, homeTeamName: "Team G", homeScore: 22, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team G", homeScore: 23, awayScore: 21 }),
      makeGame({ season: 2024, awayTeamName: "Team G", homeScore: 31, awayScore: 10 }),
      makeGame({ season: 2024, awayTeamName: "Team G", homeScore: 29, awayScore: 14 }),
    ];
    const r = computeCoachingStats(games);
    expect(r.stats.totalTeams).toBeGreaterThan(0);
  });

  it("handles average win percentage calculation", () => {
    const games = [
      // Team H: alternating seasons
      makeGame({ season: 2021, homeTeamName: "Team H", homeScore: 28, awayScore: 14 }), // 1-0
      makeGame({ season: 2022, homeTeamName: "Team H", homeScore: 10, awayScore: 24 }), // 0-1
      makeGame({ season: 2023, homeTeamName: "Team H", homeScore: 27, awayScore: 21 }), // 1-0
    ];
    const r = computeCoachingStats(games);
    const teamH = r.stats.consistentTeams.find((t) => t.team === "Team H");
    expect(teamH?.avgWinPct).toBeDefined();
  });
});
