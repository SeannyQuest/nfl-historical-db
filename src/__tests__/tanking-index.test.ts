import { describe, it, expect } from "vitest";
import {
  computeTankingIndex,
  type TankingGame,
} from "@/lib/tanking-index";

function makeGame(overrides: Partial<TankingGame> = {}): TankingGame {
  return {
    season: 2024,
    week: 5,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeTankingIndex — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeTankingIndex([]);
    expect(r.teamTankingScores).toHaveLength(0);
    expect(r.suspectedTankers).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

// ─── First Half vs Second Half ───────────────────────────

describe("computeTankingIndex — first half vs second half", () => {
  it("splits games by week (< 10 vs >= 10)", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 27,
        awayScore: 20,
      }), // first half, Packers win
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        awayTeamName: "Vikings",
        homeScore: 20,
        awayScore: 24,
      }), // second half, Packers loss
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    expect(packers?.firstHalfWins).toBe(1);
    expect(packers?.secondHalfLosses).toBe(1);
  });

  it("counts correct wins/losses in first half", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // Packers win
      makeGame({
        season: 2024,
        week: 8,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // Packers loss
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Bears",
        awayTeamName: "Packers",
        homeScore: 20,
        awayScore: 27,
      }), // Packers win away
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    expect(packers?.firstHalfWins).toBe(2);
    expect(packers?.firstHalfLosses).toBe(1);
  });

  it("counts correct wins/losses in second half", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 10,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // Packers win
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // Packers loss
      makeGame({
        season: 2024,
        week: 15,
        homeTeamName: "Packers",
        homeScore: 30,
        awayScore: 25,
      }), // Packers win
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    expect(packers?.secondHalfWins).toBe(2);
    expect(packers?.secondHalfLosses).toBe(1);
  });
});

// ─── Tanking Score Calculation ───────────────────────────

describe("computeTankingIndex — tanking score", () => {
  it("computes tanking score as second half loss rate - first half loss rate", () => {
    const games = [
      // First half: 2-1 (loss rate 1/3 = 0.333)
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // win
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // win
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // loss
      // Second half: 0-2 (loss rate 2/2 = 1.0)
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // loss
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 18,
        awayScore: 27,
      }), // loss
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    // 1.0 - 0.3333 = 0.6667
    expect(packers?.tankingScore).toBeCloseTo(0.6667, 3);
  });

  it("returns zero tanking score for no tank pattern", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // first half win
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // second half win
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    expect(packers?.tankingScore).toBe(0);
  });

  it("returns negative tanking score for improved performance", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // first half loss
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }), // first half loss
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }), // second half win
    ];
    const r = computeTankingIndex(games);
    const packers = r.teamTankingScores.find((x) => x.team === "Packers");
    // 0 - 1.0 = -1.0
    expect(packers?.tankingScore).toBe(-1);
  });
});

// ─── Suspected Tankers ───────────────────────────────────

describe("computeTankingIndex — suspected tankers", () => {
  it("filters to only positive tanking scores", () => {
    const games = [
      // Team A: tanks (high tanking score)
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Team A",
        awayTeamName: "Neutral",
        homeScore: 27,
        awayScore: 20,
      }), // first half win
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Team A",
        awayTeamName: "Neutral",
        homeScore: 20,
        awayScore: 24,
      }), // second half loss
      // Team B: improves (negative tanking score)
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Team B",
        awayTeamName: "Neutral",
        homeScore: 20,
        awayScore: 24,
      }), // first half loss
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Team B",
        awayTeamName: "Neutral",
        homeScore: 27,
        awayScore: 20,
      }), // second half win
    ];
    const r = computeTankingIndex(games);
    expect(r.suspectedTankers.every((x) => x.tankingScore > 0)).toBe(true);
  });

  it("includes top 10 tankers only", () => {
    const games: TankingGame[] = [];
    for (let i = 0; i < 15; i++) {
      const score1 = i < 10 ? 27 : 20; // first half wins for all
      const score2 = i < 10 ? 20 : 24; // second half losses for all
      games.push(
        makeGame({
          season: 2024,
          week: 5,
          homeTeamName: `Team${i}`,
          awayTeamName: "Neutral",
          homeScore: score1,
          awayScore: 20,
        })
      );
      games.push(
        makeGame({
          season: 2024,
          week: 12,
          homeTeamName: `Team${i}`,
          awayTeamName: "Neutral",
          homeScore: score2,
          awayScore: 24,
        })
      );
    }
    const r = computeTankingIndex(games);
    expect(r.suspectedTankers.length).toBeLessThanOrEqual(10);
  });

  it("sorts tankers by tanking score descending", () => {
    const games = [
      // High tanker
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "High",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "High",
        homeScore: 20,
        awayScore: 24,
      }),
      // Low tanker
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Low",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Low",
        homeScore: 24,
        awayScore: 26,
      }),
    ];
    const r = computeTankingIndex(games);
    if (r.suspectedTankers.length > 1) {
      expect(r.suspectedTankers[0].tankingScore).toBeGreaterThanOrEqual(
        r.suspectedTankers[1].tankingScore
      );
    }
  });

  it("includes first and second half records in tankers", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }),
    ];
    const r = computeTankingIndex(games);
    const packers = r.suspectedTankers.find((x) => x.team === "Packers");
    expect(packers?.firstHalfRecord).toBe("1-0");
    expect(packers?.secondHalfRecord).toBe("0-1");
  });
});

// ─── Season Trends ──────────────────────────────────────

describe("computeTankingIndex — season trends", () => {
  it("groups tanking scores by season", () => {
    const games = [
      makeGame({ season: 2024, week: 5, homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: 12, homeScore: 20, awayScore: 24 }),
      makeGame({ season: 2023, week: 5, homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2023, week: 12, homeScore: 20, awayScore: 24 }),
    ];
    const r = computeTankingIndex(games);
    expect(r.seasonTrends).toHaveLength(2);
  });

  it("computes avg tanking score per season", () => {
    const games = [
      // Team A: 1-0 first half, 0-1 second half, tanking = 1 - 0 = 1.0
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "A",
        awayTeamName: "W",
        homeScore: 27,
        awayScore: 20,
      }), // A wins first half
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "A",
        awayTeamName: "X",
        homeScore: 20,
        awayScore: 24,
      }), // A loses second half
      // Team B: 0-1 first half, 1-0 second half, tanking = 0 - 1 = -1.0
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "B",
        awayTeamName: "Y",
        homeScore: 20,
        awayScore: 24,
      }), // B loses first half
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "B",
        awayTeamName: "Z",
        homeScore: 27,
        awayScore: 20,
      }), // B wins second half
    ];
    const r = computeTankingIndex(games);
    const s2024 = r.seasonTrends.find((x) => x.season === 2024);
    // A has tanking score 1.0, B has tanking score -1.0
    // Average = (1.0 + (-1.0)) / 2 = 0.0
    // But we only count teams with games, so average = 0 / 2 = 0.0 or actual average should be 0
    // Actually let me check: (1.0 - 1.0) / 2 = 0
    // Since both teams contribute, average = (1.0 + (-1.0)) / 2 = 0
    // But actually, looking at the code, it sums all tanking scores for the season
    // Tank score A: (1/1) - (0/1) = 1 - 0 = 1
    // Tank score B: (1/1) - (0/1) = 0 - 1 = -1
    // Average = (1 + (-1)) / 2 = 0
    expect(s2024?.avgTankingScore).toBe(0);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ season: 2020, week: 5, homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2020, week: 12, homeScore: 20, awayScore: 24 }),
      makeGame({ season: 2024, week: 5, homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, week: 12, homeScore: 20, awayScore: 24 }),
    ];
    const r = computeTankingIndex(games);
    expect(r.seasonTrends[0].season).toBe(2024);
    expect(r.seasonTrends[1].season).toBe(2020);
  });
});

// ─── Multiple Seasons ───────────────────────────────────

describe("computeTankingIndex — multiple seasons", () => {
  it("tracks tanking per team per season", () => {
    const games = [
      // Packers 2024: tank
      makeGame({
        season: 2024,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 20,
        awayScore: 24,
      }),
      // Packers 2023: no tank
      makeGame({
        season: 2023,
        week: 5,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }),
      makeGame({
        season: 2023,
        week: 12,
        homeTeamName: "Packers",
        homeScore: 27,
        awayScore: 20,
      }),
    ];
    const r = computeTankingIndex(games);
    const packers2024 = r.teamTankingScores.find(
      (x) => x.team === "Packers" && x.season === 2024
    );
    const packers2023 = r.teamTankingScores.find(
      (x) => x.team === "Packers" && x.season === 2023
    );
    expect(packers2024?.tankingScore).toBe(1);
    expect(packers2023?.tankingScore).toBe(0);
  });
});
