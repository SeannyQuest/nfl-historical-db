import { describe, it, expect } from "vitest";
import { computeTravelImpact, type TravelGame } from "@/lib/travel-impact";

function makeGame(overrides: Partial<TravelGame> = {}): TravelGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 24,
    homeTimezone: "Central",
    awayTimezone: "Central",
    ...overrides,
  };
}

describe("computeTravelImpact — empty", () => {
  it("returns empty data for no games", () => {
    const r = computeTravelImpact([]);
    expect(r.timezoneAdvantage).toHaveLength(0);
    expect(r.crossCountryResults.games).toBe(0);
    expect(r.teamTravelRecords).toHaveLength(0);
  });
});

describe("computeTravelImpact — timezone advantage", () => {
  it("categorizes games by travel direction", () => {
    const games = [
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern" }), // East to West
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }), // West to East
      makeGame({ homeTimezone: "Central", awayTimezone: "Central" }), // Same
    ];
    const r = computeTravelImpact(games);
    expect(r.timezoneAdvantage).toHaveLength(3);
  });

  it("calculates away win percentage per direction", () => {
    const games = [
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern", homeScore: 20, awayScore: 30 }), // Away wins
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern", homeScore: 30, awayScore: 20 }), // Home wins
    ];
    const r = computeTravelImpact(games);
    const eastToWest = r.timezoneAdvantage.find((t) => t.travelDirection === "East to West");
    expect(eastToWest?.awayWinPct).toBe(50);
  });

  it("counts total games per direction", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }),
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }),
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }),
      makeGame({ homeTimezone: "Central", awayTimezone: "Central" }),
    ];
    const r = computeTravelImpact(games);
    const westToEast = r.timezoneAdvantage.find((t) => t.travelDirection === "West to East");
    expect(westToEast?.games).toBe(3);
  });

  it("sorts by game count descending", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }), // West to East
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }),
      makeGame({ homeTimezone: "Central", awayTimezone: "Central" }), // Same
    ];
    const r = computeTravelImpact(games);
    expect(r.timezoneAdvantage[0].games).toBe(2);
  });
});

describe("computeTravelImpact — cross-country games", () => {
  it("identifies Pacific-Eastern matchups", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific" }),
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern" }),
      makeGame({ homeTimezone: "Central", awayTimezone: "Central" }),
    ];
    const r = computeTravelImpact(games);
    expect(r.crossCountryResults.games).toBe(2);
  });

  it("calculates home win percentage in cross-country games", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific", homeScore: 30, awayScore: 20 }), // Home wins
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific", homeScore: 20, awayScore: 30 }), // Away wins
    ];
    const r = computeTravelImpact(games);
    expect(r.crossCountryResults.homeWinPct).toBe(50);
  });

  it("calculates average margin for cross-country games", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific", homeScore: 30, awayScore: 20 }), // 10
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific", homeScore: 35, awayScore: 30 }), // 5
    ];
    const r = computeTravelImpact(games);
    expect(r.crossCountryResults.avgMargin).toBe(7.5);
  });

  it("handles no cross-country games", () => {
    const games = [makeGame({ homeTimezone: "Central", awayTimezone: "Central" })];
    const r = computeTravelImpact(games);
    expect(r.crossCountryResults.games).toBe(0);
    expect(r.crossCountryResults.homeWinPct).toBe(0);
  });
});

describe("computeTravelImpact — team travel records", () => {
  it("tracks away games and wins per team", () => {
    const games = [
      makeGame({ awayTeamName: "Chiefs", homeScore: 20, awayScore: 30 }), // Chiefs away win
      makeGame({ awayTeamName: "Chiefs", homeScore: 30, awayScore: 20 }), // Chiefs away loss
      makeGame({ awayTeamName: "Ravens", homeScore: 35, awayScore: 28 }), // Ravens away loss
    ];
    const r = computeTravelImpact(games);
    const chiefs = r.teamTravelRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.awayGames).toBe(2);
    expect(chiefs?.awayWins).toBe(1);
    expect(chiefs?.awayLosses).toBe(1);
  });

  it("tracks cross-timezone records", () => {
    const games = [
      makeGame({ awayTeamName: "Chiefs", homeTimezone: "Eastern", awayTimezone: "Central", homeScore: 20, awayScore: 30 }), // Win
      makeGame({ awayTeamName: "Chiefs", homeTimezone: "Eastern", awayTimezone: "Central", homeScore: 30, awayScore: 20 }), // Loss
      makeGame({ awayTeamName: "Chiefs", homeTimezone: "Central", awayTimezone: "Central", homeScore: 30, awayScore: 20 }), // Same tz, loss (not counted)
    ];
    const r = computeTravelImpact(games);
    const chiefs = r.teamTravelRecords.find((t) => t.team === "Chiefs");
    expect(chiefs?.crossTimezoneRecord).toBe("1-1");
  });

  it("sorts by away games descending", () => {
    const games = [
      makeGame({ awayTeamName: "Chiefs" }),
      makeGame({ awayTeamName: "Chiefs" }),
      makeGame({ awayTeamName: "Ravens" }),
    ];
    const r = computeTravelImpact(games);
    expect(r.teamTravelRecords[0].team).toBe("Chiefs");
    expect(r.teamTravelRecords[0].awayGames).toBe(2);
  });
});

describe("computeTravelImpact — direction detection", () => {
  it("detects East to West travel (Pacific home, Eastern away)", () => {
    const games = [
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern", awayScore: 30, homeScore: 20 }), // Away wins
    ];
    const r = computeTravelImpact(games);
    const eastToWest = r.timezoneAdvantage.find((t) => t.travelDirection === "East to West");
    expect(eastToWest).toBeDefined();
    expect(eastToWest?.awayWinPct).toBe(100);
  });

  it("detects West to East travel (Eastern home, Pacific away)", () => {
    const games = [
      makeGame({ homeTimezone: "Eastern", awayTimezone: "Pacific", homeScore: 30, awayScore: 20 }), // Home wins
    ];
    const r = computeTravelImpact(games);
    const westToEast = r.timezoneAdvantage.find((t) => t.travelDirection === "West to East");
    expect(westToEast).toBeDefined();
    expect(westToEast?.awayWinPct).toBe(0);
  });

  it("detects same timezone", () => {
    const games = [
      makeGame({ homeTimezone: "Central", awayTimezone: "Central" }),
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Pacific" }),
    ];
    const r = computeTravelImpact(games);
    const same = r.timezoneAdvantage.find((t) => t.travelDirection === "Same");
    expect(same?.games).toBe(2);
  });
});

describe("computeTravelImpact — home advantage variations", () => {
  it("shows home advantage differences by travel", () => {
    const sameTimezone = [
      makeGame({ homeTimezone: "Central", awayTimezone: "Central", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTimezone: "Central", awayTimezone: "Central", homeScore: 28, awayScore: 21 }),
      makeGame({ homeTimezone: "Central", awayTimezone: "Central", homeScore: 25, awayScore: 22 }),
    ];
    const eastToWest = [
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern", homeScore: 20, awayScore: 30 }),
      makeGame({ homeTimezone: "Pacific", awayTimezone: "Eastern", homeScore: 21, awayScore: 28 }),
    ];
    const r = computeTravelImpact([...sameTimezone, ...eastToWest]);
    const same = r.timezoneAdvantage.find((t) => t.travelDirection === "Same");
    const eastWest = r.timezoneAdvantage.find((t) => t.travelDirection === "East to West");
    // When traveling East to West, away teams win more (higher awayWinPct)
    // vs same timezone where home teams typically win (lower awayWinPct)
    expect(same!.awayWinPct).toBeLessThan(eastWest!.awayWinPct);
  });
});
