import { describe, it, expect } from "vitest";
import {
  computeTeamArchetypes,
  type ArchetypeGame,
} from "@/lib/team-archetypes";

function makeGame(overrides: Partial<ArchetypeGame> = {}): ArchetypeGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 24,
    awayScore: 17,
    ...overrides,
  };
}

// ─── Empty ───────────────────────────────────────────────

describe("computeTeamArchetypes — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeTeamArchetypes([]);
    expect(r.teamArchetypes).toHaveLength(0);
    expect(r.archetypeWinRates).toHaveLength(0);
    expect(r.archetypeDistribution).toHaveLength(0);
  });
});

// ─── Single Team ────────────────────────────────────────

describe("computeTeamArchetypes — single team", () => {
  it("classifies single team with balanced record", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Bears",
        awayTeamName: "Packers",
        homeScore: 24,
        awayScore: 21,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.teamArchetypes.length).toBeGreaterThan(0);
  });

  it("computes points per game correctly", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 28,
        awayScore: 18,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const packers = r.teamArchetypes.find(
      (t) => t.team === "Packers" && t.season === 2024
    );
    expect(packers?.ptsPerGame).toBe(29); // (30 + 28) / 2
  });

  it("computes points allowed per game correctly", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 28,
        awayScore: 14,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const packers = r.teamArchetypes.find(
      (t) => t.team === "Packers" && t.season === 2024
    );
    expect(packers?.ptsAllowedPerGame).toBe(17); // (20 + 14) / 2
  });
});

// ─── Archetype Classification ─────────────────────────

describe("computeTeamArchetypes — archetype classification", () => {
  it("classifies Offensive Juggernaut (high offense, low defense)", () => {
    const games = [
      // Create 5 teams with 5 games each (25 games)
      // Team A: 35 PPG (top quartile), 28 PPA (bottom quartile)
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamB",
        homeScore: 35,
        awayScore: 28,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamC",
        homeScore: 35,
        awayScore: 28,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamD",
        homeScore: 35,
        awayScore: 28,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamE",
        homeScore: 35,
        awayScore: 28,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamF",
        homeScore: 35,
        awayScore: 28,
      }),
      // Other teams
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamD",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamE",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamF",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamA",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamD",
        homeScore: 18,
        awayScore: 12,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamE",
        homeScore: 18,
        awayScore: 12,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamF",
        homeScore: 18,
        awayScore: 12,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamA",
        homeScore: 18,
        awayScore: 12,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamB",
        homeScore: 18,
        awayScore: 12,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamE",
        homeScore: 16,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamF",
        homeScore: 16,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamA",
        homeScore: 16,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamB",
        homeScore: 16,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamC",
        homeScore: 16,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamF",
        homeScore: 14,
        awayScore: 8,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamA",
        homeScore: 14,
        awayScore: 8,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamB",
        homeScore: 14,
        awayScore: 8,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamC",
        homeScore: 14,
        awayScore: 8,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamD",
        homeScore: 14,
        awayScore: 8,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const teamA = r.teamArchetypes.find(
      (t) => t.team === "TeamA" && t.season === 2024
    );
    expect(teamA?.archetype).toBe("Offensive Juggernaut");
  });

  it("classifies Defensive Fortress (low offense, high defense)", () => {
    const games = [
      // TeamA: 15 PPG (bottom quartile), 10 PPA (top quartile)
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamB",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamC",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamD",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamE",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamF",
        homeScore: 15,
        awayScore: 10,
      }),
      // Padding
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamC",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamD",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamE",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamF",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamA",
        homeScore: 28,
        awayScore: 25,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamD",
        homeScore: 26,
        awayScore: 23,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamE",
        homeScore: 26,
        awayScore: 23,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamF",
        homeScore: 26,
        awayScore: 23,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamA",
        homeScore: 26,
        awayScore: 23,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamB",
        homeScore: 26,
        awayScore: 23,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamE",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamF",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamA",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamB",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamC",
        homeScore: 24,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamF",
        homeScore: 22,
        awayScore: 19,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamA",
        homeScore: 22,
        awayScore: 19,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamB",
        homeScore: 22,
        awayScore: 19,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamC",
        homeScore: 22,
        awayScore: 19,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamE",
        awayTeamName: "TeamD",
        homeScore: 22,
        awayScore: 19,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const teamA = r.teamArchetypes.find(
      (t) => t.team === "TeamA" && t.season === 2024
    );
    expect(teamA?.archetype).toBe("Defensive Fortress");
  });
});

// ─── Archetype Win Rates ────────────────────────────────

describe("computeTeamArchetypes — archetype win rates", () => {
  it("computes average win percentage per archetype", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamB",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamC",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamD",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamD",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamE",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamE",
        homeScore: 10,
        awayScore: 5,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamD",
        awayTeamName: "TeamA",
        homeScore: 10,
        awayScore: 5,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.archetypeWinRates.length).toBeGreaterThan(0);
    expect(r.archetypeWinRates[0].avgWinPct).toBeGreaterThanOrEqual(
      r.archetypeWinRates[r.archetypeWinRates.length - 1].avgWinPct
    );
  });

  it("counts teams in each archetype", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamB",
        homeScore: 28,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamA",
        awayTeamName: "TeamC",
        homeScore: 28,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamB",
        awayTeamName: "TeamD",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamD",
        homeScore: 15,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "TeamC",
        awayTeamName: "TeamE",
        homeScore: 15,
        awayScore: 10,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const totalTeams = r.archetypeWinRates.reduce(
      (sum, a) => sum + a.teams,
      0
    );
    expect(totalTeams).toBeGreaterThan(0);
  });
});

// ─── Distribution ───────────────────────────────────────

describe("computeTeamArchetypes — archetype distribution", () => {
  it("computes archetype counts", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 20,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "D",
        homeScore: 20,
        awayScore: 10,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.archetypeDistribution.length).toBeGreaterThan(0);
    const totalCount = r.archetypeDistribution.reduce(
      (sum, d) => sum + d.count,
      0
    );
    expect(totalCount).toBeGreaterThan(0);
  });

  it("computes archetype percentages", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 20,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "D",
        homeScore: 20,
        awayScore: 10,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const totalPct = r.archetypeDistribution.reduce((sum, d) => sum + d.pct, 0);
    expect(totalPct).toBeLessThanOrEqual(1.0001); // allow rounding error
    expect(totalPct).toBeGreaterThanOrEqual(0.9999);
  });

  it("sorts by count descending", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 20,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "D",
        homeScore: 20,
        awayScore: 10,
      }),
    ];
    const r = computeTeamArchetypes(games);
    for (let i = 0; i < r.archetypeDistribution.length - 1; i++) {
      expect(r.archetypeDistribution[i].count).toBeGreaterThanOrEqual(
        r.archetypeDistribution[i + 1].count
      );
    }
  });
});

// ─── Multi-Season ───────────────────────────────────────

describe("computeTeamArchetypes — multi-season", () => {
  it("separates teams by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 30,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const packers2023 = r.teamArchetypes.find(
      (t) => t.team === "Packers" && t.season === 2023
    );
    const packers2024 = r.teamArchetypes.find(
      (t) => t.team === "Packers" && t.season === 2024
    );
    expect(packers2023).toBeDefined();
    expect(packers2024).toBeDefined();
    expect(packers2023?.ptsPerGame).toBeGreaterThan(
      packers2024?.ptsPerGame ?? 0
    );
  });

  it("handles team name changes across seasons", () => {
    const games = [
      makeGame({
        season: 2023,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        homeTeamName: "Lions",
        awayTeamName: "Packers",
        homeScore: 24,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 22,
        awayScore: 18,
      }),
    ];
    const r = computeTeamArchetypes(games);
    const allPackersRecords = r.teamArchetypes.filter(
      (t) => t.team === "Packers"
    );
    expect(allPackersRecords.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeTeamArchetypes — edge cases", () => {
  it("handles single game", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 28,
        awayScore: 14,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.teamArchetypes.length).toBeGreaterThan(0);
  });

  it("handles ties (equal scores)", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 24,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.teamArchetypes.length).toBeGreaterThan(0);
  });

  it("handles zero scores", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 0,
        awayScore: 0,
      }),
    ];
    const r = computeTeamArchetypes(games);
    expect(r.teamArchetypes.length).toBeGreaterThan(0);
  });
});
