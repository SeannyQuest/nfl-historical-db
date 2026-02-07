import { describe, it, expect } from "vitest";
import { computeRankingsVolatility, type VolatilityGame } from "@/lib/rankings-volatility";

function makeGame(overrides: Partial<VolatilityGame> = {}): VolatilityGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 20,
    ...overrides,
  };
}

describe("computeRankingsVolatility — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeRankingsVolatility([]);
    expect(r.weeklyVolatility).toHaveLength(0);
    expect(r.mostVolatileWeeks).toHaveLength(0);
    expect(r.mostStableTeams).toHaveLength(0);
    expect(r.mostVolatileTeams).toHaveLength(0);
  });
});

describe("computeRankingsVolatility — weekly volatility", () => {
  it("computes volatility for single week", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility).toHaveLength(1);
    expect(r.weeklyVolatility[0].season).toBe(2024);
    expect(r.weeklyVolatility[0].week).toBe(1);
  });

  it("has avgRankChange for week", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility[0].avgRankChange).toBeGreaterThanOrEqual(0);
  });

  it("creates entry for each week", () => {
    const games = [
      makeGame({ week: 1, homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 28, awayScore: 22 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility.length).toBeGreaterThanOrEqual(2);
  });

  it("includes season and week in volatility", () => {
    const games = [
      makeGame({ season: 2023, week: 5, homeScore: 30, awayScore: 20 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility[0].season).toBe(2023);
    expect(r.weeklyVolatility[0].week).toBe(5);
  });
});

describe("computeRankingsVolatility — most volatile weeks", () => {
  it("limits to top 10 weeks", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({ week: i + 1, homeScore: 30 + i, awayScore: 20 })
    );
    const r = computeRankingsVolatility(games);
    expect(r.mostVolatileWeeks.length).toBeLessThanOrEqual(10);
  });

  it("sorts by avgRankChange descending", () => {
    const games = [
      makeGame({ week: 1, homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 35, awayScore: 10 }),
    ];
    const r = computeRankingsVolatility(games);
    if (r.mostVolatileWeeks.length > 1) {
      expect(r.mostVolatileWeeks[0].avgRankChange).toBeGreaterThanOrEqual(
        r.mostVolatileWeeks[1].avgRankChange
      );
    }
  });

  it("includes gameCount in result", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.mostVolatileWeeks[0].gameCount).toBe(2);
  });
});

describe("computeRankingsVolatility — team volatility", () => {
  it("includes all teams in volatility map initially", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeRankingsVolatility(games);
    const allTeams = new Set<string>();
    for (const t of r.mostVolatileTeams) allTeams.add(t.team);
    for (const t of r.mostStableTeams) allTeams.add(t.team);
    expect(allTeams.size).toBeGreaterThanOrEqual(2);
  });

  it("limits most volatile teams to top 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        week: i + 1,
        homeTeamName: `Team${i % 10}`,
        awayTeamName: `Team${(i + 1) % 10}`,
        homeScore: 30 + i,
        awayScore: 20,
      })
    );
    const r = computeRankingsVolatility(games);
    expect(r.mostVolatileTeams.length).toBeLessThanOrEqual(10);
  });

  it("limits most stable teams to top 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        week: i + 1,
        homeTeamName: `Team${i % 10}`,
        awayTeamName: `Team${(i + 1) % 10}`,
        homeScore: 25 + i,
        awayScore: 23 + i,
      })
    );
    const r = computeRankingsVolatility(games);
    expect(r.mostStableTeams.length).toBeLessThanOrEqual(10);
  });

  it("includes avgRankChange for volatile team", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 10, awayScore: 40 }),
    ];
    const r = computeRankingsVolatility(games);
    const chiefs = r.mostVolatileTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgRankChange).toBeGreaterThanOrEqual(0);
  });

  it("includes appearances in result", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeRankingsVolatility(games);
    const chiefs = r.mostVolatileTeams.find((t) => t.team === "Chiefs") || r.mostStableTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.appearances).toBe(2);
  });

  it("volatile teams sorted descending by avgRankChange", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 40, awayScore: 10 }),
      makeGame({ week: 1, homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 25, awayScore: 24 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 10, awayScore: 40 }),
    ];
    const r = computeRankingsVolatility(games);
    if (r.mostVolatileTeams.length > 1) {
      expect(r.mostVolatileTeams[0].avgRankChange).toBeGreaterThanOrEqual(
        r.mostVolatileTeams[1].avgRankChange
      );
    }
  });

  it("stable teams sorted ascending by avgRankChange", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "Ravens", awayTeamName: "Steelers", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeRankingsVolatility(games);
    if (r.mostStableTeams.length > 1) {
      expect(r.mostStableTeams[0].avgRankChange).toBeLessThanOrEqual(
        r.mostStableTeams[1].avgRankChange
      );
    }
  });
});

describe("computeRankingsVolatility — multiple seasons", () => {
  it("separates volatility by season", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, week: 1, homeScore: 28, awayScore: 22 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility.length).toBeGreaterThanOrEqual(2);
  });

  it("identifies season correctly in most volatile weeks", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, week: 1, homeScore: 50, awayScore: 10 }),
    ];
    const r = computeRankingsVolatility(games);
    const weeks = r.mostVolatileWeeks;
    expect(weeks.some((w) => w.season === 2023)).toBe(true);
    expect(weeks.some((w) => w.season === 2024)).toBe(true);
  });
});

describe("computeRankingsVolatility — edge cases", () => {
  it("handles all same-score games (ties)", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 25 }),
      makeGame({ week: 1, homeScore: 24, awayScore: 24 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility[0]).toBeDefined();
  });

  it("handles blowouts causing high volatility", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 60, awayScore: 10 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 10, awayScore: 60 }),
    ];
    const r = computeRankingsVolatility(games);
    const chiefs = r.mostVolatileTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgRankChange).toBeGreaterThan(0);
  });

  it("handles consecutive weeks with same teams", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility.length).toBe(2);
  });

  it("handles single team across multiple games", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeRankingsVolatility(games);
    const chiefs = r.mostVolatileTeams.find((t) => t.team === "Chiefs") || r.mostStableTeams.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
  });

  it("handles large number of teams", () => {
    const games = Array.from({ length: 32 }, (_, i) =>
      makeGame({
        week: 1,
        homeTeamName: `Team${i}`,
        awayTeamName: `Team${(i + 1) % 32}`,
        homeScore: 30 + (i % 5),
        awayScore: 20 + ((i + 1) % 5),
      })
    );
    const r = computeRankingsVolatility(games);
    expect(r.mostVolatileTeams.length).toBeLessThanOrEqual(10);
    expect(r.mostStableTeams.length).toBeLessThanOrEqual(10);
  });
});

describe("computeRankingsVolatility — ranking changes over weeks", () => {
  it("reflects ranking changes from week 1 to week 2", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 30, awayScore: 10 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 10, awayScore: 30 }),
    ];
    const r = computeRankingsVolatility(games);
    expect(r.weeklyVolatility.length).toBe(2);
    // Week 2 should have volatility due to ranking change
    const week2 = r.weeklyVolatility.find((w) => w.week === 2);
    expect(week2?.avgRankChange).toBeGreaterThan(0);
  });

  it("shows consistent winners as stable", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", awayTeamName: "Texans", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", awayTeamName: "Ravens", homeScore: 28, awayScore: 22 }),
      makeGame({ week: 3, homeTeamName: "Chiefs", awayTeamName: "Steelers", homeScore: 25, awayScore: 23 }),
    ];
    const r = computeRankingsVolatility(games);
    const chiefs = r.mostStableTeams.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
  });
});
