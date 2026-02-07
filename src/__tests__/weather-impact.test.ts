import { describe, it, expect } from "vitest";
import { computeWeatherImpact, type WeatherGame } from "@/lib/weather-impact";

function makeGame(overrides: Partial<WeatherGame> = {}): WeatherGame {
  return {
    season: 2024,
    homeScore: 27,
    awayScore: 20,
    conditions: "Clear",
    temperature: 65,
    windSpeed: 8,
    spreadResult: "COVERED",
    ouResult: "OVER",
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeWeatherImpact — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeWeatherImpact([]);
    expect(r.totalGames).toBe(0);
    expect(r.conditionStats).toHaveLength(0);
    expect(r.coldWeatherAnalysis.games).toBe(0);
    expect(r.domeAdvantage).toBeNull();
    expect(r.outdoorAdvantage).toBeNull();
  });
});

// ─── Condition Classification ───────────────────────────

describe("computeWeatherImpact — condition classification", () => {
  it("classifies dome conditions", () => {
    const games = [
      makeGame({ conditions: "Dome" }),
      makeGame({ conditions: "Dome" }),
      makeGame({ conditions: "Clear" }),
    ];
    const r = computeWeatherImpact(games);
    const dome = r.conditionStats.find((c) => c.condition === "Dome");
    expect(dome?.games).toBe(2);
  });

  it("classifies rain conditions", () => {
    const games = [
      makeGame({ conditions: "Heavy Rain" }),
      makeGame({ conditions: "Rain" }),
      makeGame({ conditions: "Clear" }),
    ];
    const r = computeWeatherImpact(games);
    const rain = r.conditionStats.find((c) => c.condition === "Rain");
    expect(rain?.games).toBe(2);
  });

  it("classifies snow conditions", () => {
    const games = [
      makeGame({ conditions: "Snow" }),
      makeGame({ conditions: "Light Snow" }),
    ];
    const r = computeWeatherImpact(games);
    const snow = r.conditionStats.find((c) => c.condition === "Snow");
    expect(snow?.games).toBe(2);
  });

  it("classifies clear conditions", () => {
    const games = [
      makeGame({ conditions: "Clear" }),
      makeGame({ conditions: "Sunny" }),
    ];
    const r = computeWeatherImpact(games);
    const clear = r.conditionStats.find((c) => c.condition === "Clear");
    expect(clear).toBeDefined();
  });

  it("handles unknown/other conditions", () => {
    const games = [makeGame({ conditions: null })];
    const r = computeWeatherImpact(games);
    const unknown = r.conditionStats.find((c) => c.condition === "Unknown");
    expect(unknown?.games).toBe(1);
  });
});

// ─── Condition Stats ─────────────────────────────────────

describe("computeWeatherImpact — condition stats", () => {
  it("computes avg total by condition", () => {
    const games = [
      makeGame({ conditions: "Clear", homeScore: 30, awayScore: 10 }), // 40
      makeGame({ conditions: "Clear", homeScore: 20, awayScore: 24 }), // 44
    ];
    const r = computeWeatherImpact(games);
    const clear = r.conditionStats.find((c) => c.condition === "Clear");
    expect(clear?.avgTotal).toBe("42.0");
  });

  it("computes home win pct by condition", () => {
    const games = [
      makeGame({ conditions: "Rain", homeScore: 27, awayScore: 20 }), // home win
      makeGame({ conditions: "Rain", homeScore: 10, awayScore: 24 }), // away win
    ];
    const r = computeWeatherImpact(games);
    const rain = r.conditionStats.find((c) => c.condition === "Rain");
    expect(rain?.homeWinPct).toBe("0.500");
  });

  it("computes over pct by condition", () => {
    const games = [
      makeGame({ conditions: "Snow", ouResult: "OVER" }),
      makeGame({ conditions: "Snow", ouResult: "OVER" }),
      makeGame({ conditions: "Snow", ouResult: "UNDER" }),
    ];
    const r = computeWeatherImpact(games);
    const snow = r.conditionStats.find((c) => c.condition === "Snow");
    expect(snow?.overPct).toBe("0.667");
  });

  it("sorts conditions by games descending", () => {
    const games = [
      makeGame({ conditions: "Clear" }),
      makeGame({ conditions: "Clear" }),
      makeGame({ conditions: "Clear" }),
      makeGame({ conditions: "Rain" }),
      makeGame({ conditions: "Rain" }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.conditionStats[0].condition).toBe("Clear");
    expect(r.conditionStats[0].games).toBe(3);
    expect(r.conditionStats[1].condition).toBe("Rain");
    expect(r.conditionStats[1].games).toBe(2);
  });
});

// ─── Cold Weather Analysis ──────────────────────────────

describe("computeWeatherImpact — cold weather", () => {
  it("identifies cold weather (temp < 32)", () => {
    const games = [
      makeGame({ temperature: 25 }),
      makeGame({ temperature: 30 }),
      makeGame({ temperature: 35 }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.coldWeatherAnalysis.games).toBe(2);
  });

  it("computes cold weather avg total", () => {
    const games = [
      makeGame({ temperature: 25, homeScore: 30, awayScore: 10 }), // 40
      makeGame({ temperature: 20, homeScore: 20, awayScore: 24 }), // 44
      makeGame({ temperature: 45, homeScore: 28, awayScore: 28 }), // 56
    ];
    const r = computeWeatherImpact(games);
    expect(r.coldWeatherAnalysis.games).toBe(2);
    expect(r.coldWeatherAnalysis.avgTotal).toBe("42.0");
  });

  it("computes cold weather home win pct", () => {
    const games = [
      makeGame({ temperature: 25, homeScore: 27, awayScore: 20 }), // home win
      makeGame({ temperature: 28, homeScore: 10, awayScore: 24 }), // away win
      makeGame({ temperature: 40, homeScore: 25, awayScore: 25 }), // tie
    ];
    const r = computeWeatherImpact(games);
    expect(r.coldWeatherAnalysis.homeWinPct).toBe("0.500");
  });

  it("computes cold weather over pct", () => {
    const games = [
      makeGame({ temperature: 25, ouResult: "OVER" }),
      makeGame({ temperature: 28, ouResult: "OVER" }),
      makeGame({ temperature: 28, ouResult: "UNDER" }),
      makeGame({ temperature: 40, ouResult: "OVER" }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.coldWeatherAnalysis.overPct).toBe("0.667");
  });
});

// ─── Wind Impact ────────────────────────────────────────

describe("computeWeatherImpact — wind impact", () => {
  it("categorizes low wind (<=10 mph)", () => {
    const games = [
      makeGame({ windSpeed: 5 }),
      makeGame({ windSpeed: 10 }),
      makeGame({ windSpeed: 12 }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.windImpact.lowWind.games).toBe(2);
  });

  it("categorizes moderate wind (>10, <=15)", () => {
    const games = [
      makeGame({ windSpeed: 5 }),
      makeGame({ windSpeed: 11 }),
      makeGame({ windSpeed: 15 }),
      makeGame({ windSpeed: 18 }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.windImpact.moderateWind.games).toBe(2);
  });

  it("categorizes high wind (>15 mph)", () => {
    const games = [
      makeGame({ windSpeed: 15 }),
      makeGame({ windSpeed: 16 }),
      makeGame({ windSpeed: 25 }),
    ];
    const r = computeWeatherImpact(games);
    expect(r.windImpact.highWind.games).toBe(2);
  });

  it("computes wind impact home win pct", () => {
    const games = [
      makeGame({ windSpeed: 5, homeScore: 27, awayScore: 20 }), // home win, low
      makeGame({ windSpeed: 5, homeScore: 10, awayScore: 24 }), // away win, low
      makeGame({ windSpeed: 20, homeScore: 25, awayScore: 23 }), // home win, high
    ];
    const r = computeWeatherImpact(games);
    expect(r.windImpact.lowWind.homeWinPct).toBe("0.500");
    expect(r.windImpact.highWind.homeWinPct).toBe("1.000");
  });
});

// ─── Dome vs Outdoor ────────────────────────────────────

describe("computeWeatherImpact — dome vs outdoor", () => {
  it("computes dome advantage", () => {
    const games = [
      makeGame({ conditions: "Dome", homeScore: 27, awayScore: 20 }), // home win
      makeGame({ conditions: "Dome", homeScore: 27, awayScore: 20 }), // home win
      makeGame({ conditions: "Dome", homeScore: 10, awayScore: 24 }), // away win
    ];
    const r = computeWeatherImpact(games);
    expect(r.domeAdvantage).toBe("66.7%");
  });

  it("computes outdoor advantage", () => {
    const games = [
      makeGame({ conditions: "Clear", homeScore: 27, awayScore: 20 }), // home win
      makeGame({ conditions: "Clear", homeScore: 10, awayScore: 24 }), // away win
    ];
    const r = computeWeatherImpact(games);
    expect(r.outdoorAdvantage).toBe("50.0%");
  });

  it("handles no dome games", () => {
    const games = [makeGame({ conditions: "Clear" })];
    const r = computeWeatherImpact(games);
    expect(r.domeAdvantage).toBeNull();
  });
});

// ─── Total Games Count ──────────────────────────────────

describe("computeWeatherImpact — total games", () => {
  it("counts total games", () => {
    const games = [
      makeGame(),
      makeGame(),
      makeGame(),
      makeGame(),
    ];
    const r = computeWeatherImpact(games);
    expect(r.totalGames).toBe(4);
  });
});
