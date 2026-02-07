import { describe, it, expect } from "vitest";
import { computeRecordBreakers, type RecordGame } from "@/lib/record-breakers";

function makeGame(overrides: Partial<RecordGame> = {}): RecordGame {
  return {
    season: 2024,
    week: "1",
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    isPlayoff: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeRecordBreakers — empty", () => {
  it("returns empty for no games", () => {
    const r = computeRecordBreakers([]);
    expect(r.highestScoringGames).toHaveLength(0);
    expect(r.lowestScoringGames).toHaveLength(0);
    expect(r.biggestBlowouts).toHaveLength(0);
  });
});

// ─── Highest Scoring Games ──────────────────────────────

describe("computeRecordBreakers — highest scoring", () => {
  it("identifies highest scoring games", () => {
    const games = [
      makeGame({ homeScore: 56, awayScore: 49 }), // 105 total
      makeGame({ homeScore: 48, awayScore: 44 }), // 92 total
      makeGame({ homeScore: 27, awayScore: 20 }), // 47 total
    ];
    const r = computeRecordBreakers(games);
    expect(r.highestScoringGames[0].totalPoints).toBe(105);
    expect(r.highestScoringGames[1].totalPoints).toBe(92);
  });

  it("caps at top 10", () => {
    const games = [];
    for (let i = 0; i < 20; i++) {
      games.push(makeGame({ homeScore: 60 - i, awayScore: 30 }));
    }
    const r = computeRecordBreakers(games);
    expect(r.highestScoringGames).toHaveLength(10);
  });
});

// ─── Lowest Scoring Games ───────────────────────────────

describe("computeRecordBreakers — lowest scoring", () => {
  it("identifies lowest scoring games (total > 0)", () => {
    const games = [
      makeGame({ homeScore: 3, awayScore: 2 }), // 5 total
      makeGame({ homeScore: 6, awayScore: 3 }), // 9 total
      makeGame({ homeScore: 27, awayScore: 20 }), // 47 total
    ];
    const r = computeRecordBreakers(games);
    expect(r.lowestScoringGames[0].totalPoints).toBe(5);
    expect(r.lowestScoringGames[1].totalPoints).toBe(9);
  });

  it("filters out games with total 0", () => {
    const games = [
      makeGame({ homeScore: 0, awayScore: 0 }),
      makeGame({ homeScore: 3, awayScore: 2 }),
    ];
    const r = computeRecordBreakers(games);
    expect(r.lowestScoringGames.every(g => g.totalPoints > 0)).toBe(true);
  });

  it("caps at 10 games", () => {
    const games = [];
    for (let i = 0; i < 20; i++) {
      games.push(makeGame({ homeScore: i, awayScore: i + 1 }));
    }
    const r = computeRecordBreakers(games);
    expect(r.lowestScoringGames).toHaveLength(10);
  });
});

// ─── Biggest Blowouts ────────────────────────────────────

describe("computeRecordBreakers — biggest blowouts", () => {
  it("ranks by margin of victory", () => {
    const games = [
      makeGame({ homeScore: 56, awayScore: 7 }), // 49 point margin
      makeGame({ homeScore: 35, awayScore: 20 }), // 15 point margin
      makeGame({ homeScore: 27, awayScore: 20 }), // 7 point margin
    ];
    const r = computeRecordBreakers(games);
    expect(r.biggestBlowouts[0].margin).toBe(49);
    expect(r.biggestBlowouts[1].margin).toBe(15);
  });

  it("caps at top 10 blowouts", () => {
    const games = [];
    for (let i = 0; i < 20; i++) {
      games.push(makeGame({ homeScore: 50 - i, awayScore: 10 }));
    }
    const r = computeRecordBreakers(games);
    expect(r.biggestBlowouts).toHaveLength(10);
  });
});

// ─── Highest Scoring Seasons ────────────────────────────

describe("computeRecordBreakers — highest scoring seasons", () => {
  it("computes average total per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 30, awayScore: 20 }), // 50
      makeGame({ season: 2024, homeScore: 40, awayScore: 30 }), // 70
      makeGame({ season: 2023, homeScore: 20, awayScore: 15 }), // 35
    ];
    const r = computeRecordBreakers(games);
    const season2024 = r.highestScoringSeasons.find(s => s.season === 2024);
    // (50 + 70) / 2 = 60
    expect(season2024?.avgTotal).toBe("60.00");
  });

  it("sorts by highest avg first", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 50, awayScore: 40 }), // 90
      makeGame({ season: 2023, homeScore: 20, awayScore: 15 }), // 35
    ];
    const r = computeRecordBreakers(games);
    expect(r.highestScoringSeasons[0].season).toBe(2024);
    expect(r.highestScoringSeasons[1].season).toBe(2023);
  });

  it("counts total games per season", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, homeScore: 40, awayScore: 30 }),
      makeGame({ season: 2023, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeRecordBreakers(games);
    const season2024 = r.highestScoringSeasons.find(s => s.season === 2024);
    const season2023 = r.highestScoringSeasons.find(s => s.season === 2023);
    expect(season2024?.totalGames).toBe(2);
    expect(season2023?.totalGames).toBe(1);
  });
});

// ─── Win Streaks ────────────────────────────────────────

describe("computeRecordBreakers — win streaks", () => {
  it("detects win streaks", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 30, awayScore: 20 }), // GB wins
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 28, awayScore: 20 }), // GB wins
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 25, awayScore: 30 }), // GB loses
    ];
    const r = computeRecordBreakers(games);
    const gbStreak = r.longestWinStreaks.find(s => s.team === "GB");
    expect(gbStreak?.streak).toBe(2);
  });

  it("tracks away team win streaks", () => {
    const games = [
      makeGame({ homeTeamName: "GB", awayTeamName: "CHI", homeScore: 20, awayScore: 30 }), // CHI wins
      makeGame({ homeTeamName: "DET", awayTeamName: "CHI", homeScore: 10, awayScore: 27 }), // CHI wins
    ];
    const r = computeRecordBreakers(games);
    const chiStreak = r.longestWinStreaks.find(s => s.team === "CHI");
    expect(chiStreak?.streak).toBe(2);
  });

  it("records start and end season", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 28, awayScore: 20 }),
    ];
    const r = computeRecordBreakers(games);
    const gbStreak = r.longestWinStreaks.find(s => s.team === "GB");
    expect(gbStreak?.startSeason).toBe(2024);
    expect(gbStreak?.endSeason).toBe(2024);
  });

  it("sorts by streak length descending", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "GB", homeScore: 28, awayScore: 20 }),
      makeGame({ homeTeamName: "CHI", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeRecordBreakers(games);
    expect(r.longestWinStreaks[0].streak).toBeGreaterThanOrEqual(r.longestWinStreaks[1]?.streak || 0);
  });
});

// ─── Loss Streaks ───────────────────────────────────────

describe("computeRecordBreakers — loss streaks", () => {
  it("detects loss streaks", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 20, awayScore: 30 }), // GB loses
      makeGame({ homeTeamName: "GB", homeScore: 15, awayScore: 25 }), // GB loses
      makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 }), // GB wins
    ];
    const r = computeRecordBreakers(games);
    const gbLosses = r.longestLossStreaks.find(s => s.team === "GB");
    expect(gbLosses?.streak).toBe(2);
  });

  it("tracks away team loss streaks", () => {
    const games = [
      makeGame({ homeTeamName: "GB", awayTeamName: "CHI", homeScore: 30, awayScore: 20 }), // CHI loses
      makeGame({ homeTeamName: "DET", awayTeamName: "CHI", homeScore: 27, awayScore: 10 }), // CHI loses
    ];
    const r = computeRecordBreakers(games);
    const chiLosses = r.longestLossStreaks.find(s => s.team === "CHI");
    expect(chiLosses?.streak).toBe(2);
  });

  it("sorts by streak length descending", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 20, awayScore: 30 }),
      makeGame({ homeTeamName: "GB", homeScore: 15, awayScore: 25 }),
      makeGame({ homeTeamName: "CHI", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeRecordBreakers(games);
    expect(r.longestLossStreaks[0].streak).toBeGreaterThanOrEqual(r.longestLossStreaks[1]?.streak || 0);
  });
});

// ─── Playoff Games ──────────────────────────────────────

describe("computeRecordBreakers — playoff handling", () => {
  it("includes playoff games in records", () => {
    const games = [
      makeGame({ isPlayoff: true, homeScore: 56, awayScore: 49 }), // 105 total
      makeGame({ isPlayoff: false, homeScore: 48, awayScore: 44 }), // 92 total
    ];
    const r = computeRecordBreakers(games);
    expect(r.highestScoringGames.some(g => g.isPlayoff === true)).toBe(true);
  });
});
