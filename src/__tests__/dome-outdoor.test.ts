import { describe, it, expect } from "vitest";
import { computeDomeOutdoor, type VenueGame } from "@/lib/dome-outdoor";

function makeGame(overrides: Partial<VenueGame> = {}): VenueGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 20,
    conditions: null,
    temperature: 72,
    ...overrides,
  };
}

describe("computeDomeOutdoor — dome detection", () => {
  it("identifies game as dome if conditions contains 'dome'", () => {
    const games = [
      makeGame({ conditions: "Dome", temperature: 72 }),
      makeGame({ conditions: "dome", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.games).toBe(2);
    expect(r.outdoorStats.games).toBe(0);
  });

  it("identifies game as dome if conditions contains 'indoor'", () => {
    const games = [
      makeGame({ conditions: "Indoor", temperature: 72 }),
      makeGame({ conditions: "indoor", homeScore: 25, awayScore: 24 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.games).toBe(2);
  });

  it("identifies game as dome if no conditions and no temperature", () => {
    const games = [
      makeGame({ conditions: null, temperature: null }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.games).toBe(1);
    expect(r.outdoorStats.games).toBe(0);
  });

  it("identifies game as outdoor if conditions provided without 'dome'", () => {
    const games = [
      makeGame({ conditions: "Sunny", temperature: 72 }),
      makeGame({ conditions: "Cloudy", temperature: 65 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.outdoorStats.games).toBe(2);
    expect(r.domeStats.games).toBe(0);
  });
});

describe("computeDomeOutdoor — dome vs outdoor stats", () => {
  it("calculates dome home win pct", () => {
    const games = [
      makeGame({ conditions: "Dome", homeScore: 30, awayScore: 20 }),
      makeGame({ conditions: "Dome", homeScore: 25, awayScore: 25 }),
      makeGame({ conditions: "Dome", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.homeWinPct).toBe((1 / 3) * 100);
  });

  it("calculates outdoor home win pct", () => {
    const games = [
      makeGame({ conditions: "Sunny", homeScore: 30, awayScore: 20 }),
      makeGame({ conditions: "Cloudy", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.outdoorStats.homeWinPct).toBe(100);
  });

  it("calculates dome avg total", () => {
    const games = [
      makeGame({ conditions: "Dome", homeScore: 30, awayScore: 20 }), // 50
      makeGame({ conditions: "Dome", homeScore: 28, awayScore: 22 }), // 50
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.avgTotal).toBe(50);
  });

  it("calculates outdoor avg total", () => {
    const games = [
      makeGame({ conditions: "Sunny", homeScore: 25, awayScore: 15 }), // 40
      makeGame({ conditions: "Sunny", homeScore: 30, awayScore: 20 }), // 50
    ];
    const r = computeDomeOutdoor(games);
    expect(r.outdoorStats.avgTotal).toBe(45);
  });

  it("calculates dome avg margin", () => {
    const games = [
      makeGame({ conditions: "Dome", homeScore: 30, awayScore: 20 }), // 10
      makeGame({ conditions: "Dome", homeScore: 28, awayScore: 20 }), // 8
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.avgMargin).toBe(9);
  });

  it("calculates outdoor avg margin", () => {
    const games = [
      makeGame({ conditions: "Sunny", homeScore: 25, awayScore: 10 }), // 15
      makeGame({ conditions: "Sunny", homeScore: 30, awayScore: 20 }), // 10
    ];
    const r = computeDomeOutdoor(games);
    expect(r.outdoorStats.avgMargin).toBe(12.5);
  });
});

describe("computeDomeOutdoor — cold weather stats", () => {
  it("identifies games below 40°F as cold weather", () => {
    const games = [
      makeGame({ temperature: 35, conditions: "Cold" }),
      makeGame({ temperature: 38, conditions: "Cold" }),
      makeGame({ temperature: 40, conditions: "Cold" }),
      makeGame({ temperature: 45, conditions: "Mild" }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.coldWeatherStats.games).toBe(2);
  });

  it("calculates cold weather home win pct", () => {
    const games = [
      makeGame({ temperature: 35, homeScore: 30, awayScore: 20 }),
      makeGame({ temperature: 38, homeScore: 25, awayScore: 25 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.coldWeatherStats.homeWinPct).toBe(50);
  });

  it("excludes null temperatures from cold weather", () => {
    const games = [
      makeGame({ temperature: null, conditions: "Indoor" }),
      makeGame({ temperature: 35, conditions: "Cold" }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.coldWeatherStats.games).toBe(1);
  });
});

describe("computeDomeOutdoor — hot weather stats", () => {
  it("identifies games above 85°F as hot weather", () => {
    const games = [
      makeGame({ temperature: 86, conditions: "Hot" }),
      makeGame({ temperature: 90, conditions: "Hot" }),
      makeGame({ temperature: 85, conditions: "Mild" }),
      makeGame({ temperature: 80, conditions: "Mild" }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.hotWeatherStats.games).toBe(2);
  });

  it("calculates hot weather home win pct", () => {
    const games = [
      makeGame({ temperature: 88, homeScore: 30, awayScore: 20 }),
      makeGame({ temperature: 90, homeScore: 20, awayScore: 30 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.hotWeatherStats.homeWinPct).toBe(50);
  });

  it("excludes null temperatures from hot weather", () => {
    const games = [
      makeGame({ temperature: null, conditions: "Indoor" }),
      makeGame({ temperature: 88, conditions: "Hot" }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.hotWeatherStats.games).toBe(1);
  });
});

describe("computeDomeOutdoor — team dome records", () => {
  it("tracks dome wins for home team", () => {
    const games = [
      makeGame({ conditions: "Dome", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeDomeOutdoor(games);
    const chiefs = r.teamDomeRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.domeWins).toBe(1);
  });

  it("tracks dome losses for away team", () => {
    const games = [
      makeGame({ conditions: "Dome", awayTeamName: "Ravens", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeDomeOutdoor(games);
    const ravens = r.teamDomeRecords.find((t) => t.team === "Ravens");
    expect(ravens?.domeLosses).toBe(1);
  });

  it("tracks outdoor wins for home team", () => {
    const games = [
      makeGame({ conditions: "Sunny", homeTeamName: "Chiefs", homeScore: 28, awayScore: 18 }),
    ];
    const r = computeDomeOutdoor(games);
    const chiefs = r.teamDomeRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.outdoorWins).toBe(1);
  });

  it("tracks outdoor losses for away team", () => {
    const games = [
      makeGame({ conditions: "Sunny", awayTeamName: "Ravens", homeScore: 25, awayScore: 15 }),
    ];
    const r = computeDomeOutdoor(games);
    const ravens = r.teamDomeRecords.find((t) => t.team === "Ravens");
    expect(ravens?.outdoorLosses).toBe(1);
  });

  it("includes both dome and outdoor games for team", () => {
    const games = [
      makeGame({ conditions: "Dome", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ conditions: "Sunny", homeTeamName: "Chiefs", homeScore: 25, awayScore: 15 }),
    ];
    const r = computeDomeOutdoor(games);
    const chiefs = r.teamDomeRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.domeWins).toBe(1);
    expect(chiefs?.outdoorWins).toBe(1);
  });

  it("sorts team records by overall win pct", () => {
    const games = [
      makeGame({ conditions: "Dome", homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
      makeGame({ conditions: "Dome", homeTeamName: "Chiefs", homeScore: 28, awayScore: 22 }),
      makeGame({ conditions: "Sunny", homeTeamName: "Ravens", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.teamDomeRecords[0].team).toBe("Chiefs");
  });

  it("handles ties without counting as wins or losses", () => {
    const games = [
      makeGame({ conditions: "Dome", homeTeamName: "Chiefs", homeScore: 25, awayScore: 25 }),
    ];
    const r = computeDomeOutdoor(games);
    const chiefs = r.teamDomeRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.domeWins).toBe(0);
    expect(chiefs?.domeLosses).toBe(0);
  });
});

describe("computeDomeOutdoor — empty and edge cases", () => {
  it("returns zeroes for no games", () => {
    const r = computeDomeOutdoor([]);
    expect(r.domeStats.games).toBe(0);
    expect(r.outdoorStats.games).toBe(0);
    expect(r.coldWeatherStats.games).toBe(0);
    expect(r.hotWeatherStats.games).toBe(0);
  });

  it("handles high-scoring dome games", () => {
    const games = [
      makeGame({ conditions: "Dome", homeScore: 42, awayScore: 38 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.avgTotal).toBe(80);
  });

  it("handles low-scoring outdoor games", () => {
    const games = [
      makeGame({ conditions: "Rainy", homeScore: 10, awayScore: 8 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.outdoorStats.avgTotal).toBe(18);
  });

  it("separates cold and hot weather correctly", () => {
    const games = [
      makeGame({ temperature: 35, homeScore: 30, awayScore: 20 }),
      makeGame({ temperature: 88, homeScore: 25, awayScore: 24 }),
      makeGame({ temperature: 72, homeScore: 28, awayScore: 22 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.coldWeatherStats.games).toBe(1);
    expect(r.hotWeatherStats.games).toBe(1);
  });

  it("case-insensitive conditions matching", () => {
    const games = [
      makeGame({ conditions: "DOME", homeScore: 30, awayScore: 20 }),
      makeGame({ conditions: "INDOOR", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.games).toBe(2);
  });
});

describe("computeDomeOutdoor — multiple seasons", () => {
  it("treats games from all seasons together", () => {
    const games = [
      makeGame({ season: 2023, conditions: "Dome", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, conditions: "Sunny", homeScore: 25, awayScore: 15 }),
    ];
    const r = computeDomeOutdoor(games);
    expect(r.domeStats.games).toBe(1);
    expect(r.outdoorStats.games).toBe(1);
  });
});
