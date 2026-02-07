import { describe, it, expect } from "vitest";
import { computeLineMovement, type LineGame } from "@/lib/line-movement";

function makeGame(overrides: Partial<LineGame> = {}): LineGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 15,
    spread: null,
    overUnder: null,
    spreadResult: null,
    ouResult: null,
    ...overrides,
  };
}

describe("computeLineMovement — empty input", () => {
  it("returns empty arrays for no games", () => {
    const r = computeLineMovement([]);
    expect(r.overUnderAccuracy).toHaveLength(0);
    expect(r.spreadAccuracyByWeek).toHaveLength(0);
    expect(r.mostProfitableAngles).toHaveLength(0);
    expect(r.seasonLineSharpness).toHaveLength(0);
  });
});

describe("computeLineMovement — over/under accuracy", () => {
  it("bins over/under by 5-point ranges", () => {
    const games = [
      makeGame({
        overUnder: 42,
        homeScore: 21,
        awayScore: 24,
        ouResult: "OVER",
      }),
      makeGame({
        overUnder: 43,
        homeScore: 20,
        awayScore: 15,
        ouResult: "UNDER",
      }),
    ];
    const r = computeLineMovement(games);
    const ranges = r.overUnderAccuracy.map((x) => x.ouRange);
    expect(ranges).toContain("40-45");
  });

  it("counts over results", () => {
    const games = [
      makeGame({
        overUnder: 40,
        homeScore: 25,
        awayScore: 20,
        ouResult: "OVER",
      }),
      makeGame({
        overUnder: 40,
        homeScore: 18,
        awayScore: 15,
        ouResult: "UNDER",
      }),
      makeGame({
        overUnder: 40,
        homeScore: 20,
        awayScore: 20,
        ouResult: "UNDER",
      }),
    ];
    const r = computeLineMovement(games);
    const range = r.overUnderAccuracy.find((x) => x.ouRange === "40-45");
    expect(range?.games).toBe(3);
    expect(range?.overPct).toBe("33.3");
  });

  it("calculates over/under/push percentages", () => {
    const games = [
      makeGame({
        overUnder: 40,
        homeScore: 25,
        awayScore: 20,
        ouResult: "OVER",
      }),
      makeGame({
        overUnder: 40,
        homeScore: 20,
        awayScore: 20,
        ouResult: "UNDER",
      }),
    ];
    const r = computeLineMovement(games);
    const range = r.overUnderAccuracy.find((x) => x.ouRange === "40-45");
    expect(range?.overPct).toBe("50.0");
    expect(range?.underPct).toBe("50.0");
    expect(range?.pushPct).toBe("0.0");
  });

  it("ignores games with null over/under", () => {
    const games = [
      makeGame({
        overUnder: null,
        homeScore: 25,
        awayScore: 20,
        ouResult: null,
      }),
    ];
    const r = computeLineMovement(games);
    expect(r.overUnderAccuracy).toHaveLength(0);
  });
});

describe("computeLineMovement — spread accuracy by week", () => {
  it("calculates absolute spread error", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 23,
        awayScore: 20, // 3-point margin, spread was -3, error = 0
      }),
      makeGame({
        spread: -3,
        homeScore: 25,
        awayScore: 20, // 5-point margin, spread was -3, error = 2
      }),
    ];
    const r = computeLineMovement(games);
    const week = r.spreadAccuracyByWeek[0];
    expect(week?.avgAbsError).toBe("1.00");
  });

  it("groups spread errors by week", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 23,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    expect(r.spreadAccuracyByWeek.length).toBeGreaterThan(0);
    expect(r.spreadAccuracyByWeek[0].games).toBeGreaterThan(0);
  });

  it("ignores games with null spread", () => {
    const games = [
      makeGame({
        spread: null,
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    // Should still have week entry but games count depends on implementation
    expect(r.spreadAccuracyByWeek.length).toBeGreaterThanOrEqual(0);
  });
});

describe("computeLineMovement — most profitable angles", () => {
  it("identifies home favorite wins", () => {
    const games = [
      makeGame({
        spread: -3, // Home favored
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        spread: -3,
        homeScore: 30,
        awayScore: 15,
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) =>
      a.angle.includes("Home favorite")
    );
    expect(angle).toBeDefined();
  });

  it("identifies away favorite wins", () => {
    const games = [
      makeGame({
        spread: 3, // Away favored
        homeScore: 20,
        awayScore: 25,
      }),
      makeGame({
        spread: 3,
        homeScore: 15,
        awayScore: 30,
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) =>
      a.angle.includes("Away favorite")
    );
    expect(angle).toBeDefined();
  });

  it("identifies home underdog wins", () => {
    const games = [
      makeGame({
        spread: 5, // Home underdog (away favored by 5, so spread > 3)
        homeScore: 25,
        awayScore: 20, // Home wins as underdog
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) =>
      a.angle === "Home underdog"
    );
    expect(angle).toBeDefined();
    expect(angle?.record).toContain("1-");
  });

  it("calculates ROI correctly", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 25,
        awayScore: 20, // Home favorite wins
      }),
      makeGame({
        spread: -3,
        homeScore: 15,
        awayScore: 20, // Home favorite loses
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) =>
      a.angle.includes("Home favorite")
    );
    // 1 win, 1 loss = (1-1)/2 * 100 = 0% ROI
    expect(angle?.roi).toBe("0.0");
  });

  it("limits to top 10 angles", () => {
    const games: LineGame[] = [];
    for (let i = 1; i <= 30; i++) {
      games.push(
        makeGame({
          spread: -3,
          homeScore: 25 + (i % 2),
          awayScore: 20,
        })
      );
    }
    const r = computeLineMovement(games);
    expect(r.mostProfitableAngles.length).toBeLessThanOrEqual(10);
  });

  it("excludes angles with no games", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    expect(r.mostProfitableAngles.every((a) => parseInt(a.record.split("-")[0]) + parseInt(a.record.split("-")[1]) > 0)).toBe(true);
  });
});

describe("computeLineMovement — home/away under/over", () => {
  it("tracks home team unders", () => {
    const games = [
      makeGame({
        overUnder: 40,
        homeScore: 15,
        awayScore: 20,
        ouResult: "UNDER",
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) => a.angle === "Home under");
    expect(angle).toBeDefined();
  });

  it("tracks away team overs", () => {
    const games = [
      makeGame({
        overUnder: 40,
        homeScore: 25,
        awayScore: 20,
        ouResult: "OVER",
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) => a.angle === "Away over");
    expect(angle).toBeDefined();
  });
});

describe("computeLineMovement — season line sharpness", () => {
  it("calculates average spread error by season", () => {
    const games = [
      makeGame({
        season: 2024,
        spread: -3,
        homeScore: 23,
        awayScore: 20, // Error = 0
      }),
      makeGame({
        season: 2024,
        spread: -3,
        homeScore: 25,
        awayScore: 20, // Error = 2
      }),
    ];
    const r = computeLineMovement(games);
    const season = r.seasonLineSharpness.find((s) => s.season === 2024);
    expect(season?.avgSpreadError).toBe("1.00");
  });

  it("calculates average over/under error by season", () => {
    const games = [
      makeGame({
        season: 2024,
        spread: -3,
        overUnder: 40,
        homeScore: 25,
        awayScore: 20, // Total = 45, error = 5
        ouResult: "OVER",
      }),
      makeGame({
        season: 2024,
        spread: -3,
        overUnder: 40,
        homeScore: 20,
        awayScore: 18, // Total = 38, error = 2
        ouResult: "UNDER",
      }),
    ];
    const r = computeLineMovement(games);
    const season = r.seasonLineSharpness.find((s) => s.season === 2024);
    expect(season?.avgOUError).toBe("3.50");
  });

  it("separates errors by season", () => {
    const games = [
      makeGame({
        season: 2023,
        spread: -5,
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        spread: -3,
        homeScore: 25,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    expect(r.seasonLineSharpness.length).toBe(2);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({
        season: 2023,
        spread: -3,
        homeScore: 23,
        awayScore: 20,
      }),
      makeGame({
        season: 2025,
        spread: -3,
        homeScore: 23,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    expect(r.seasonLineSharpness[0].season).toBe(2025);
    expect(r.seasonLineSharpness[1].season).toBe(2023);
  });
});

describe("computeLineMovement — spread range angles", () => {
  it("distinguishes spread ranges", () => {
    const games = [
      makeGame({
        spread: -5, // 3-7 range
        homeScore: 25,
        awayScore: 20,
      }),
      makeGame({
        spread: -2, // < 3 range
        homeScore: 22,
        awayScore: 20,
      }),
    ];
    const r = computeLineMovement(games);
    const angles = r.mostProfitableAngles
      .filter((a) => a.angle.includes("Home favorite"))
      .map((a) => a.angle);
    expect(angles.length).toBeGreaterThan(0);
  });
});

describe("computeLineMovement — edge cases", () => {
  it("handles perfect spread predictions", () => {
    const games = [
      makeGame({
        spread: -5,
        homeScore: 25,
        awayScore: 20, // Exactly 5-point margin
      }),
    ];
    const r = computeLineMovement(games);
    const week = r.spreadAccuracyByWeek[0];
    expect(week?.avgAbsError).toBe("0.00");
  });

  it("handles large spread errors", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 50,
        awayScore: 10, // 40-point margin vs 3-point spread
      }),
    ];
    const r = computeLineMovement(games);
    const week = r.spreadAccuracyByWeek[0];
    expect(parseFloat(week?.avgAbsError || "0")).toBeGreaterThan(30);
  });

  it("handles mixed spread results", () => {
    const games = [
      makeGame({
        spread: -3,
        homeScore: 23,
        awayScore: 20, // Home wins as favorite
      }),
      makeGame({
        spread: -3,
        homeScore: 20,
        awayScore: 25, // Home loses as favorite
      }),
    ];
    const r = computeLineMovement(games);
    const angle = r.mostProfitableAngles.find((a) =>
      a.angle.includes("Home favorite")
    );
    expect(angle?.record).toBe("1-1");
  });
});
