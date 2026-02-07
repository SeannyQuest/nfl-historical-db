import { describe, it, expect } from "vitest";
import { computeStreakMomentum, type StreakGame } from "@/lib/streak-momentum";

function makeGame(overrides: Partial<StreakGame> = {}): StreakGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 15,
    spread: null,
    spreadResult: null,
    ...overrides,
  };
}

describe("computeStreakMomentum — empty input", () => {
  it("returns empty arrays for no games", () => {
    const r = computeStreakMomentum([]);
    expect(r.streakPerformance).toHaveLength(0);
    expect(r.teamStreakATS).toHaveLength(0);
    expect(r.bestStreakATS).toHaveLength(0);
  });
});

describe("computeStreakMomentum — basic streak tracking", () => {
  it("identifies winning streaks", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", homeScore: 20, awayScore: 15 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", homeScore: 25, awayScore: 10 }),
      makeGame({ week: 3, homeTeamName: "Chiefs", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeStreakMomentum(games);
    expect(r.streakPerformance.length).toBeGreaterThan(0);
  });

  it("identifies losing streaks", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "Chiefs", homeScore: 10, awayScore: 15 }),
      makeGame({ week: 2, homeTeamName: "Chiefs", homeScore: 12, awayScore: 20 }),
      makeGame({ week: 3, homeTeamName: "Chiefs", homeScore: 15, awayScore: 25 }),
    ];
    const r = computeStreakMomentum(games);
    expect(r.streakPerformance.length).toBeGreaterThan(0);
  });
});

describe("computeStreakMomentum — streak performance ATS", () => {
  it("calculates winning streak ATS performance", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    const perf = r.streakPerformance.find((p) => p.streakLength.includes("w"));
    expect(perf).toBeDefined();
    expect(perf?.atsRecord.wins).toBeGreaterThan(0);
  });

  it("calculates losing streak ATS performance", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 15,
        spread: -3,
        spreadResult: "LOST",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 12,
        awayScore: 20,
        spread: -2,
        spreadResult: "LOST",
      }),
    ];
    const r = computeStreakMomentum(games);
    const perf = r.streakPerformance.find((p) => p.streakLength.includes("l"));
    expect(perf).toBeDefined();
    expect(perf?.atsRecord.losses).toBeGreaterThan(0);
  });
});

describe("computeStreakMomentum — team streak ATS tracking", () => {
  it("tracks team ATS on winning streaks", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 15,
        spread: -3,
        spreadResult: "LOST",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.teamStreakATS.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
    expect(chiefs?.winStreakATSWins).toBeGreaterThan(0);
  });

  it("tracks team ATS on losing streaks", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 15,
        spread: -3,
        spreadResult: "LOST",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 12,
        awayScore: 20,
        spread: -2,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.teamStreakATS.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
    expect(chiefs?.lossStreakATSLosses).toBeGreaterThan(0);
  });

  it("calculates win streak ATS percentage", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 15,
        spread: -3,
        spreadResult: "LOST",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.teamStreakATS.find((t) => t.team === "Chiefs");
    expect(chiefs?.onWinStreakATSPct).toBe("1.000");
  });
});

describe("computeStreakMomentum — best streak ATS", () => {
  it("includes only 3+ game winning streaks", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 20,
        spread: -7,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.bestStreakATS.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
    expect(chiefs?.winStreakLength).toBeGreaterThanOrEqual(3);
  });

  it("excludes 1-2 game winning streaks", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 15,
        spread: -3,
        spreadResult: "LOST",
      }),
    ];
    const r = computeStreakMomentum(games);
    expect(r.bestStreakATS.length).toBe(0);
  });

  it("sorts by ATS percentage descending", () => {
    const games = [
      // Chiefs: 3-game win streak, 2/3 ATS
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "LOST",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 20,
        spread: -7,
        spreadResult: "COVERED",
      }),
      // Ravens: 3-game win streak, 3/3 ATS
      makeGame({
        week: 1,
        homeTeamName: "Ravens",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        homeTeamName: "Ravens",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Ravens",
        homeScore: 30,
        awayScore: 20,
        spread: -7,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    expect(r.bestStreakATS[0].team).toBe("Ravens");
  });

  it("limits to top 10 teams", () => {
    const games: StreakGame[] = [];
    for (let i = 1; i <= 15; i++) {
      const team = `Team${i}`;
      games.push(
        makeGame({
          week: 1,
          homeTeamName: team,
          homeScore: 20,
          awayScore: 15,
          spread: -3,
          spreadResult: "COVERED",
        })
      );
      games.push(
        makeGame({
          week: 2,
          homeTeamName: team,
          homeScore: 25,
          awayScore: 10,
          spread: -5,
          spreadResult: "COVERED",
        })
      );
      games.push(
        makeGame({
          week: 3,
          homeTeamName: team,
          homeScore: 30,
          awayScore: 20,
          spread: -7,
          spreadResult: "COVERED",
        })
      );
    }
    const r = computeStreakMomentum(games);
    expect(r.bestStreakATS.length).toBeLessThanOrEqual(10);
  });
});

describe("computeStreakMomentum — away team streaks", () => {
  it("tracks away team winning streaks", () => {
    const games = [
      makeGame({
        week: 1,
        awayTeamName: "Chiefs",
        homeScore: 15,
        awayScore: 20,
        spread: 3,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 2,
        awayTeamName: "Chiefs",
        homeScore: 10,
        awayScore: 25,
        spread: 5,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.teamStreakATS.find((t) => t.team === "Chiefs");
    expect(chiefs).toBeDefined();
  });
});

describe("computeStreakMomentum — null spread handling", () => {
  it("ignores games with null spreadResult", () => {
    const games = [
      makeGame({
        week: 1,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 15,
        spread: -3,
        spreadResult: null,
      }),
      makeGame({
        week: 2,
        homeTeamName: "Chiefs",
        homeScore: 25,
        awayScore: 10,
        spread: -5,
        spreadResult: "COVERED",
      }),
      makeGame({
        week: 3,
        homeTeamName: "Chiefs",
        homeScore: 30,
        awayScore: 20,
        spread: -7,
        spreadResult: "COVERED",
      }),
    ];
    const r = computeStreakMomentum(games);
    const chiefs = r.teamStreakATS.find((t) => t.team === "Chiefs");
    // Wins without ATS data should still be counted in streak
    expect(chiefs).toBeDefined();
  });
});
