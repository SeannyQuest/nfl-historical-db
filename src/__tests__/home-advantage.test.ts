import { describe, it, expect } from "vitest";
import { computeHomeAdvantage, type HomeAdvantageGame } from "@/lib/home-advantage";

function makeGame(overrides: Partial<HomeAdvantageGame> = {}): HomeAdvantageGame {
  return {
    season: 2024,
    date: "2024-01-01T12:00:00.000Z",
    dayOfWeek: "Sunday",
    isPlayoff: false,
    primetime: null,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Buffalo Bills",
    homeScore: 27,
    awayScore: 20,
    conditions: null,
    spread: -3.5,
    spreadResult: "COVERED",
    ...overrides,
  };
}

describe("computeHomeAdvantage — empty", () => {
  it("returns zeroes for no games", () => {
    const result = computeHomeAdvantage([]);
    expect(result.overallHomeWinRate).toBe(".000");
    expect(result.homeWinRateBySeasonTrend).toHaveLength(0);
    expect(result.homeScoringAdvantage).toBe("0.0");
    expect(result.homeCoverRate).toBe(".000");
  });
});

describe("computeHomeAdvantage — overall win rate", () => {
  it("computes 100% home win rate", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 24, awayScore: 17 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 30, awayScore: 10 }),
    ]);
    expect(result.overallHomeWinRate).toBe("1.000");
  });

  it("computes 0% home win rate", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 14, awayScore: 20 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 31 }),
    ]);
    expect(result.overallHomeWinRate).toBe("0.000");
  });

  it("computes mixed home win rate", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 24, awayScore: 17 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    expect(result.overallHomeWinRate).toBe("0.667");
  });

  it("ignores ties in win rate calculation", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 20, awayScore: 20 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
    ]);
    expect(result.overallHomeWinRate).toBe("1.000");
  });
});

describe("computeHomeAdvantage — season trends", () => {
  it("tracks home win rate by season", () => {
    const result = computeHomeAdvantage([
      makeGame({ season: 2023, homeScore: 24, awayScore: 17 }),
      makeGame({ season: 2023, date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ season: 2024, date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    expect(result.homeWinRateBySeasonTrend).toHaveLength(2);
    const season2023 = result.homeWinRateBySeasonTrend.find((s) => s.season === 2023);
    expect(season2023?.homeWinPct).toBe("0.500");
  });

  it("sorts seasons in descending order", () => {
    const result = computeHomeAdvantage([
      makeGame({ season: 2022, homeScore: 24, awayScore: 17 }),
      makeGame({ season: 2024, date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
      makeGame({ season: 2023, date: "2024-01-15T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
    ]);
    expect(result.homeWinRateBySeasonTrend[0].season).toBe(2024);
    expect(result.homeWinRateBySeasonTrend[1].season).toBe(2023);
    expect(result.homeWinRateBySeasonTrend[2].season).toBe(2022);
  });
});

describe("computeHomeAdvantage — day of week", () => {
  it("breaks down home win rate by day", () => {
    const result = computeHomeAdvantage([
      makeGame({ dayOfWeek: "Sunday", homeScore: 24, awayScore: 17 }),
      makeGame({ dayOfWeek: "Sunday", date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ dayOfWeek: "Monday", date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    const sunday = result.homeWinRateByDayOfWeek.find((d) => d.day === "Sunday");
    expect(sunday?.homeWinPct).toBe("0.500");
    const monday = result.homeWinRateByDayOfWeek.find((d) => d.day === "Monday");
    expect(monday?.homeWinPct).toBe("1.000");
  });

  it("includes game counts by day", () => {
    const result = computeHomeAdvantage([
      makeGame({ dayOfWeek: "Sunday", homeScore: 24, awayScore: 17 }),
      makeGame({ dayOfWeek: "Sunday", date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
    ]);
    const sunday = result.homeWinRateByDayOfWeek.find((d) => d.day === "Sunday");
    expect(sunday?.games).toBe(2);
  });
});

describe("computeHomeAdvantage — primetime", () => {
  it("breaks down home win rate by primetime slot", () => {
    const result = computeHomeAdvantage([
      makeGame({ primetime: "SNF", homeScore: 24, awayScore: 17 }),
      makeGame({ primetime: "SNF", date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ primetime: "MNF", date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    const snf = result.homeWinRateByPrimetime.find((p) => p.slot === "SNF");
    expect(snf?.homeWinPct).toBe("0.500");
    const mnf = result.homeWinRateByPrimetime.find((p) => p.slot === "MNF");
    expect(mnf?.homeWinPct).toBe("1.000");
  });
});

describe("computeHomeAdvantage — playoff vs regular", () => {
  it("separates playoff and regular season home win rates", () => {
    const result = computeHomeAdvantage([
      makeGame({ isPlayoff: false, homeScore: 24, awayScore: 17 }),
      makeGame({ isPlayoff: false, date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ isPlayoff: true, date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    expect(result.playoffVsRegularHomeWinRate.regular).toBe("0.500");
    expect(result.playoffVsRegularHomeWinRate.playoff).toBe("1.000");
  });
});

describe("computeHomeAdvantage — scoring advantage", () => {
  it("computes average home scoring advantage", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 30, awayScore: 20 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 20, awayScore: 10 }),
    ]);
    // (30-20 + 20-10) / 2 = 20/2 = 10.0
    expect(result.homeScoringAdvantage).toBe("10.0");
  });

  it("handles negative advantage", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeScore: 10, awayScore: 30 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 15, awayScore: 20 }),
    ]);
    // (10-30 + 15-20) / 2 = -25/2 = -12.5
    expect(result.homeScoringAdvantage).toBe("-12.5");
  });
});

describe("computeHomeAdvantage — cover rate", () => {
  it("computes home cover rate from spread results", () => {
    const result = computeHomeAdvantage([
      makeGame({ spreadResult: "COVERED", homeScore: 24, awayScore: 17 }),
      makeGame({ spreadResult: "LOST", date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
      makeGame({ spreadResult: "COVERED", date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    expect(result.homeCoverRate).toBe("0.667");
  });

  it("ignores games without spread data", () => {
    const result = computeHomeAdvantage([
      makeGame({ spreadResult: "COVERED", homeScore: 24, awayScore: 17 }),
      makeGame({ spreadResult: null, date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
    ]);
    expect(result.homeCoverRate).toBe("1.000");
  });
});

describe("computeHomeAdvantage — team home records", () => {
  it("tracks best home teams", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeTeamName: "Chiefs", homeScore: 24, awayScore: 17 }),
      makeGame({ homeTeamName: "Chiefs", date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
      makeGame({ homeTeamName: "Bills", date: "2024-01-15T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
    ]);
    const chiefs = result.bestHomeTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWins).toBe(2);
    expect(chiefs?.homeLosses).toBe(0);
  });

  it("tracks worst home teams", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeTeamName: "Chiefs", homeScore: 10, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 24 }),
      makeGame({ homeTeamName: "Bills", date: "2024-01-15T12:00:00.000Z", homeScore: 21, awayScore: 18 }),
    ]);
    const chiefs = result.worstHomeTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.homeWins).toBe(0);
    expect(chiefs?.homeLosses).toBe(2);
  });

  it("sorts best home teams by win percentage then total wins", () => {
    const result = computeHomeAdvantage([
      makeGame({ homeTeamName: "A", homeScore: 24, awayScore: 17 }),
      makeGame({ homeTeamName: "B", date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
      makeGame({ homeTeamName: "B", date: "2024-01-15T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
      makeGame({ homeTeamName: "B", date: "2024-01-22T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
    ]);
    expect(result.bestHomeTeams[0].team).toBe("B");
  });
});

describe("computeHomeAdvantage — dome vs outdoor", () => {
  it("computes dome home advantage", () => {
    const result = computeHomeAdvantage([
      makeGame({ conditions: "Dome", homeScore: 24, awayScore: 17 }),
      makeGame({ conditions: "Dome", date: "2024-01-08T12:00:00.000Z", homeScore: 24, awayScore: 17 }),
      makeGame({ conditions: "Outdoor", date: "2024-01-15T12:00:00.000Z", homeScore: 10, awayScore: 20 }),
    ]);
    expect(result.domeVsOutdoorAdvantage.dome).toBe("100.0%");
    expect(result.domeVsOutdoorAdvantage.outdoor).toBe("0.0%");
  });

  it("returns null for unavailable conditions", () => {
    const result = computeHomeAdvantage([
      makeGame({ conditions: null, homeScore: 24, awayScore: 17 }),
    ]);
    expect(result.domeVsOutdoorAdvantage.dome).toBeNull();
    expect(result.domeVsOutdoorAdvantage.outdoor).toBeNull();
  });
});
