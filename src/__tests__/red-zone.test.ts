import { describe, it, expect } from "vitest";
import { computeRedZoneEfficiency, type RedZoneGame } from "@/lib/red-zone";

function makeGame(overrides: Partial<RedZoneGame> = {}): RedZoneGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 24,
    awayScore: 20,
    homeTouchdowns: 3,
    awayTouchdowns: 2,
    homeFieldGoals: 2,
    awayFieldGoals: 2,
    ...overrides,
  };
}

describe("computeRedZoneEfficiency — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeRedZoneEfficiency([]);
    expect(r.teamStats).toHaveLength(0);
    expect(r.leagueAvgTdRate).toBe(0);
    expect(r.topRedZoneTeams).toHaveLength(0);
    expect(r.bottomRedZoneTeams).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeRedZoneEfficiency — single game", () => {
  it("tracks touchdowns and field goals", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 3,
        homeFieldGoals: 1,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.touchdowns).toBe(3);
    expect(chiefs?.fieldGoals).toBe(1);
    expect(chiefs?.totalDrives).toBe(4);
  });

  it("computes TD rate correctly", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 3,
        homeFieldGoals: 1,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.tdRate).toBe(0.75); // 3 / 4
  });

  it("computes average points per drive", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 2,
        homeFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.avgPointsPerDrive).toBe(4.5); // (2*6 + 2*3) / 4 = 18 / 4
  });
});

describe("computeRedZoneEfficiency — multiple teams", () => {
  it("accumulates stats across multiple games", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 2,
        homeFieldGoals: 1,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 1,
        homeFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.touchdowns).toBe(3);
    expect(chiefs?.fieldGoals).toBe(3);
    expect(chiefs?.totalDrives).toBe(6);
  });

  it("tracks both home and away teams separately", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 3,
        homeFieldGoals: 1,
        awayTouchdowns: 1,
        awayFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    expect(r.teamStats).toHaveLength(2);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    const ravens = r.teamStats.find((t) => t.team === "Ravens");
    expect(chiefs?.touchdowns).toBe(3);
    expect(ravens?.touchdowns).toBe(1);
  });

  it("sorts teams by TD rate descending", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 4,
        homeFieldGoals: 0,
        awayTouchdowns: 1,
        awayFieldGoals: 3,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    expect(r.teamStats[0].team).toBe("Chiefs");
    expect(r.teamStats[0].tdRate).toBe(1.0);
    expect(r.teamStats[1].team).toBe("Ravens");
    expect(r.teamStats[1].tdRate).toBeCloseTo(0.25, 2);
  });
});

describe("computeRedZoneEfficiency — league averages", () => {
  it("computes league average TD rate", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 3,
        homeFieldGoals: 1,
        awayTouchdowns: 2,
        awayFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    // Chiefs: 3/4 = 0.75, Ravens: 2/4 = 0.5, avg = (0.75 + 0.5) / 2 = 0.625
    expect(r.leagueAvgTdRate).toBe(0.625);
  });

  it("handles zero drives case", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 0,
        homeFieldGoals: 0,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.tdRate).toBe(0);
  });
});

describe("computeRedZoneEfficiency — top and bottom teams", () => {
  it("limits top teams to 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 2),
        homeTeamName: `Team${i}`,
        awayTeamName: "Other",
        homeTouchdowns: 20 - i,
        homeFieldGoals: i,
      })
    );
    const r = computeRedZoneEfficiency(games);
    expect(r.topRedZoneTeams.length).toBeLessThanOrEqual(10);
  });

  it("limits bottom teams to 10", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        season: 2024 + Math.floor(i / 2),
        homeTeamName: `Team${i}`,
        awayTeamName: "Other",
        homeTouchdowns: i,
        homeFieldGoals: 20 - i,
      })
    );
    const r = computeRedZoneEfficiency(games);
    expect(r.bottomRedZoneTeams.length).toBeLessThanOrEqual(10);
  });
});

describe("computeRedZoneEfficiency — season trends", () => {
  it("tracks trends by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 4,
        homeFieldGoals: 0,
        awayTouchdowns: 0,
        awayFieldGoals: 4,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 2,
        homeFieldGoals: 2,
        awayTouchdowns: 2,
        awayFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    expect(r.seasonTrends).toHaveLength(2);
    expect(r.seasonTrends[0].season).toBe(2023);
    expect(r.seasonTrends[1].season).toBe(2024);
  });

  it("computes average FG rate per season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        awayTeamName: "Ravens",
        homeTouchdowns: 3,
        homeFieldGoals: 1,
        awayTouchdowns: 2,
        awayFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const trend = r.seasonTrends.find((t) => t.season === 2024);
    // Chiefs: 1/4 = 0.25, Ravens: 2/4 = 0.5, avg = 0.375
    expect(trend?.avgFgRate).toBeCloseTo(0.375, 2);
  });
});

describe("computeRedZoneEfficiency — edge cases", () => {
  it("handles games with zero red zone attempts", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 0,
        homeFieldGoals: 0,
        awayTouchdowns: 0,
        awayFieldGoals: 0,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    expect(r.teamStats.length).toBe(2);
    expect(r.teamStats[0].totalDrives).toBe(0);
  });

  it("handles all TDs (no field goals)", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 5,
        homeFieldGoals: 0,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.tdRate).toBe(1.0);
    expect(chiefs?.avgPointsPerDrive).toBe(6);
  });

  it("rounds values to expected precision", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeTouchdowns: 1,
        homeFieldGoals: 2,
      }),
    ];
    const r = computeRedZoneEfficiency(games);
    const chiefs = r.teamStats.find((t) => t.team === "Chiefs");
    expect(chiefs?.tdRate).toBe(0.333); // 1/3 rounded to 3 decimals
    expect(chiefs?.avgPointsPerDrive).toBe(4); // 12/3 = 4.00
  });
});
