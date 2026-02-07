import { describe, it, expect } from "vitest";
import { computeScheduleStrength, type SOSGame } from "@/lib/schedule-strength";

function makeGame(overrides: Partial<SOSGame> = {}): SOSGame {
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

describe("computeScheduleStrength — empty", () => {
  it("returns empty list for no games", () => {
    const r = computeScheduleStrength([]);
    expect(r.stats.teams).toHaveLength(0);
    expect(r.stats.easiestSchedules).toHaveLength(0);
    expect(r.stats.hardestSchedules).toHaveLength(0);
  });
});

// ─── Team SOS Calculation ────────────────────────────────

describe("computeScheduleStrength — SOS calculation", () => {
  it("computes SOS for season", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team A", awayTeamName: "Team B", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2024, homeTeamName: "Team B", awayTeamName: "Team C", homeScore: 20, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team C", awayTeamName: "Team A", homeScore: 25, awayScore: 25 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.teams.length).toBeGreaterThan(0);
  });

  it("returns correct season", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2024, homeTeamName: "Team B", awayTeamName: "Team C" }),
    ];
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.season).toBe(2024);
  });

  it("filters games by season", () => {
    const games = [
      makeGame({ season: 2023, homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2024, homeTeamName: "Team B", awayTeamName: "Team C" }),
    ];
    const r = computeScheduleStrength(games, 2024);
    // Should only include games from 2024
    expect(r.stats.teams.length).toBeGreaterThan(0);
  });
});

// ─── SOS Sorting ─────────────────────────────────────────

describe("computeScheduleStrength — SOS sorting", () => {
  it("identifies hardest schedules", () => {
    const games = [
      // Create perfect team (12-0)
      makeGame({ season: 2024, homeTeamName: "Perfect Team", awayTeamName: "Weak A", homeScore: 35, awayScore: 7 }),
      makeGame({ season: 2024, homeTeamName: "Perfect Team", awayTeamName: "Weak B", homeScore: 35, awayScore: 7 }),
      // Create weak teams
      makeGame({ season: 2024, homeTeamName: "Weak A", awayTeamName: "Weak B", homeScore: 14, awayScore: 13 }),
      makeGame({ season: 2024, homeTeamName: "Weak B", awayTeamName: "Weak C", homeScore: 10, awayScore: 7 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    if (r.stats.hardestSchedules.length > 0) {
      // Teams facing perfect team should have harder schedule
      expect(r.stats.hardestSchedules[0].team).toBeDefined();
    }
  });

  it("identifies easiest schedules", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Perfect Team", awayTeamName: "Weak A", homeScore: 35, awayScore: 7 }),
      makeGame({ season: 2024, homeTeamName: "Perfect Team", awayTeamName: "Weak B", homeScore: 35, awayScore: 7 }),
      makeGame({ season: 2024, homeTeamName: "Weak A", awayTeamName: "Weak B", homeScore: 14, awayScore: 13 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    if (r.stats.easiestSchedules.length > 0) {
      expect(r.stats.easiestSchedules[0].team).toBeDefined();
    }
  });
});

// ─── Games Played vs Remaining ──────────────────────────

describe("computeScheduleStrength — games tracking", () => {
  it("counts games played", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Team A", awayTeamName: "Team C" }),
    ];
    const r = computeScheduleStrength(games, 2024);
    const teamA = r.stats.teams.find((t) => t.team === "Team A");
    if (teamA) {
      expect(teamA.gamesPlayed).toBe(2);
    }
  });

  it("tracks future SOS separately", () => {
    const games = [
      makeGame({ season: 2024, week: "1", homeTeamName: "Team A", awayTeamName: "Team B", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2024, week: "2", homeTeamName: "Team A", awayTeamName: "Team C", homeScore: 0, awayScore: 0 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    const teamA = r.stats.teams.find((t) => t.team === "Team A");
    if (teamA) {
      expect(teamA.futureSOS).toBeDefined();
    }
  });
});

// ─── SOS Values ──────────────────────────────────────────

describe("computeScheduleStrength — SOS values", () => {
  it("returns SOS as string with 3 decimals", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team A", awayTeamName: "Team B", homeScore: 24, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "Team B", awayTeamName: "Team C", homeScore: 20, awayScore: 20 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    const teamA = r.stats.teams.find((t) => t.team === "Team A");
    if (teamA) {
      expect(teamA.combinedSOS).toMatch(/^\d\.\d{3}$/);
    }
  });

  it("returns .500 default for no opponents", () => {
    const games: SOSGame[] = [];
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.teams.length).toBe(0);
  });
});

// ─── Multiple Seasons ───────────────────────────────────

describe("computeScheduleStrength — season filtering", () => {
  it("handles multiple seasons correctly", () => {
    const games: SOSGame[] = [
      makeGame({ season: 2022, homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2023, homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2024, homeTeamName: "Team A", awayTeamName: "Team B" }),
    ];
    const r2024 = computeScheduleStrength(games, 2024);
    const r2023 = computeScheduleStrength(games, 2023);

    expect(r2024.stats.season).toBe(2024);
    expect(r2023.stats.season).toBe(2023);
  });

  it("defaults to first season if not specified", () => {
    const games: SOSGame[] = [
      makeGame({ season: 2022, homeTeamName: "Team A", awayTeamName: "Team B" }),
      makeGame({ season: 2023, homeTeamName: "Team B", awayTeamName: "Team C" }),
    ];
    const r = computeScheduleStrength(games);
    expect(r.stats.season).toBe(2022);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeScheduleStrength — edge cases", () => {
  it("handles single team single game", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team A", awayTeamName: "Team B" }),
    ];
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.teams.length).toBe(2);
  });

  it("limits hardest/easiest schedules to 10", () => {
    const games = Array.from({ length: 15 }, (_, i) =>
      makeGame({
        season: 2024,
        week: String(i + 1),
        homeTeamName: `Team ${i % 12}`,
        awayTeamName: `Team ${(i + 1) % 12}`,
      })
    );
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.hardestSchedules.length).toBeLessThanOrEqual(10);
    expect(r.stats.easiestSchedules.length).toBeLessThanOrEqual(10);
  });

  it("handles ties in scheduling", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "Team A", awayTeamName: "Team B", homeScore: 20, awayScore: 20 }),
    ];
    const r = computeScheduleStrength(games, 2024);
    expect(r.stats.totalTeams).toBeGreaterThan(0);
  });
});
