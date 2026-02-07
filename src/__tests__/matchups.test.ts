import { describe, it, expect } from "vitest";
import { computeMatchup, type MatchupGame } from "@/lib/matchups";

const T1 = "Kansas City Chiefs";
const T2 = "Buffalo Bills";

function makeGame(overrides: Partial<MatchupGame> = {}): MatchupGame {
  return {
    date: "2024-01-21T12:00:00.000Z",
    week: "1",
    season: 2024,
    isPlayoff: false,
    homeTeamName: T1,
    awayTeamName: T2,
    homeScore: 27,
    awayScore: 20,
    winnerName: T1,
    spreadResult: "COVERED",
    ouResult: "OVER",
    spread: -3.5,
    overUnder: 47.5,
    ...overrides,
  };
}

// ─── Empty games ────────────────────────────────────────

describe("computeMatchup — empty", () => {
  it("returns zeroes for no games", () => {
    const result = computeMatchup([], T1, T2);
    expect(result.totalGames).toBe(0);
    expect(result.team1Record).toEqual({ wins: 0, losses: 0, ties: 0, pct: ".000" });
    expect(result.team2Record).toEqual({ wins: 0, losses: 0, ties: 0, pct: ".000" });
    expect(result.streakTeam).toBeNull();
    expect(result.streakCount).toBe(0);
  });
});

// ─── W-L-T Records ─────────────────────────────────────

describe("computeMatchup — records", () => {
  it("counts team1 home win", () => {
    const result = computeMatchup([makeGame()], T1, T2);
    expect(result.team1Record).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
    expect(result.team2Record).toEqual({ wins: 0, losses: 1, ties: 0, pct: "0.000" });
  });

  it("counts team1 away win", () => {
    const game = makeGame({
      homeTeamName: T2,
      awayTeamName: T1,
      homeScore: 14,
      awayScore: 31,
      winnerName: T1,
    });
    const result = computeMatchup([game], T1, T2);
    expect(result.team1Record.wins).toBe(1);
    expect(result.team2Record.losses).toBe(1);
  });

  it("counts team2 win", () => {
    const game = makeGame({ homeScore: 17, awayScore: 24, winnerName: T2 });
    const result = computeMatchup([game], T1, T2);
    expect(result.team1Record).toEqual({ wins: 0, losses: 1, ties: 0, pct: "0.000" });
    expect(result.team2Record).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
  });

  it("counts a tie", () => {
    const game = makeGame({ homeScore: 20, awayScore: 20, winnerName: null });
    const result = computeMatchup([game], T1, T2);
    expect(result.team1Record.ties).toBe(1);
    expect(result.team2Record.ties).toBe(1);
  });

  it("computes correct pct for mixed results", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", homeScore: 10, awayScore: 24, winnerName: T2 }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.team1Record.pct).toBe("0.667");
    expect(result.team2Record.pct).toBe("0.333");
  });
});

// ─── Scoring Trends ─────────────────────────────────────

describe("computeMatchup — scoring", () => {
  it("computes avg total and margin", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", homeScore: 30, awayScore: 10, winnerName: T1 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 20, awayScore: 24, winnerName: T2 }),
    ];
    const result = computeMatchup(games, T1, T2);
    // Totals: 40, 44 → avg 42.0
    expect(result.scoring.avgTotal).toBe("42.0");
    // T1 margins: +20, -4 → net +16, avg |16|/2 = 8.0
    expect(result.scoring.avgMargin).toBe("8.0");
  });

  it("tracks highest and lowest totals", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", homeScore: 45, awayScore: 42 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 7 }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.scoring.highestTotal).toBe(87);
    expect(result.scoring.lowestTotal).toBe(17);
  });

  it("handles away perspective for margin", () => {
    // T1 is away, scores 35, T2 is home scores 14
    const game = makeGame({
      homeTeamName: T2,
      awayTeamName: T1,
      homeScore: 14,
      awayScore: 35,
      winnerName: T1,
    });
    const result = computeMatchup([game], T1, T2);
    // T1 scored 35, T2 scored 14, margin = |21|/1 = 21.0
    expect(result.scoring.avgMargin).toBe("21.0");
  });
});

// ─── Betting Trends ─────────────────────────────────────

describe("computeMatchup — betting", () => {
  it("tracks favorite with home team favored", () => {
    // T1 home, spread -3.5 → T1 favored
    const game = makeGame({ spread: -3.5, spreadResult: "COVERED" });
    const result = computeMatchup([game], T1, T2);
    expect(result.betting.favoriteRecord).toBe(`${T1} favored 1x, covered 1`);
  });

  it("tracks favorite with away team favored", () => {
    // T1 home, spread +3.5 → T2 (away) favored
    const game = makeGame({ spread: 3.5, spreadResult: "LOST" });
    const result = computeMatchup([game], T1, T2);
    // T2 was favored, home LOST = away covered, so T2 covered
    expect(result.betting.favoriteRecord).toBe(`${T2} favored 1x, covered 1`);
  });

  it("tracks favorite when team1 is away and favored", () => {
    // T2 home, T1 away. Spread -7 means home (T2) is favored? No.
    // Wait: T2 is home, spread -7 means T2 is favored.
    // T1 is away and NOT favored here.
    // To make T1 away and favored: home spread must be positive (home is underdog)
    const game = makeGame({
      homeTeamName: T2,
      awayTeamName: T1,
      spread: 3.5, // home T2 is +3.5 underdog → T1 is favored
      spreadResult: "LOST", // home LOST → away (T1) covered
    });
    const result = computeMatchup([game], T1, T2);
    expect(result.betting.favoriteRecord).toBe(`${T1} favored 1x, covered 1`);
  });

  it("computes avg spread", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", spread: -3.5 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", spread: -7.0 }),
    ];
    const result = computeMatchup(games, T1, T2);
    // avg of |3.5| + |7.0| = 10.5 / 2 = 5.3 (rounded)
    expect(result.betting.avgSpread).toBe("5.3");
  });

  it("counts O/U results", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", ouResult: "OVER" }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", ouResult: "OVER" }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", ouResult: "UNDER" }),
      makeGame({ date: "2024-01-22T12:00:00.000Z", ouResult: "PUSH" }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.betting.overCount).toBe(2);
    expect(result.betting.underCount).toBe(1);
    expect(result.betting.pushCount).toBe(1);
    expect(result.betting.overPct).toBe("0.500");
  });

  it("shows no spread data when none available", () => {
    const game = makeGame({ spread: null, spreadResult: null });
    const result = computeMatchup([game], T1, T2);
    expect(result.betting.favoriteRecord).toBe("No spread data");
  });

  it("skips null O/U results in count", () => {
    const game = makeGame({ ouResult: null });
    const result = computeMatchup([game], T1, T2);
    expect(result.betting.overCount).toBe(0);
    expect(result.betting.underCount).toBe(0);
  });
});

// ─── Streak ─────────────────────────────────────────────

describe("computeMatchup — streak", () => {
  it("detects single-game streak", () => {
    const result = computeMatchup([makeGame({ winnerName: T1 })], T1, T2);
    expect(result.streakTeam).toBe(T1);
    expect(result.streakCount).toBe(1);
  });

  it("detects multi-game streak", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", winnerName: T2, homeScore: 10, awayScore: 24 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-22T12:00:00.000Z", winnerName: T1 }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.streakTeam).toBe(T1);
    expect(result.streakCount).toBe(3);
  });

  it("breaks streak on tie", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 20, awayScore: 20, winnerName: null }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.streakTeam).toBeNull();
    expect(result.streakCount).toBe(0);
  });

  it("handles team2 streak", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z", winnerName: T1 }),
      makeGame({ date: "2024-01-08T12:00:00.000Z", homeScore: 10, awayScore: 24, winnerName: T2 }),
      makeGame({ date: "2024-01-15T12:00:00.000Z", homeScore: 14, awayScore: 28, winnerName: T2 }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.streakTeam).toBe(T2);
    expect(result.streakCount).toBe(2);
  });
});

// ─── Recent Games ───────────────────────────────────────

describe("computeMatchup — recent games", () => {
  it("returns last 10 games most recent first", () => {
    const games = Array.from({ length: 15 }, (_, i) =>
      makeGame({
        date: `2024-${String(i + 1).padStart(2, "0")}-01T12:00:00.000Z`,
        season: 2024,
      })
    );
    const result = computeMatchup(games, T1, T2);
    expect(result.recentGames).toHaveLength(10);
    // Most recent first
    expect(result.recentGames[0].date).toBe("2024-15-01T12:00:00.000Z");
    expect(result.recentGames[9].date).toBe("2024-06-01T12:00:00.000Z");
  });

  it("returns all games when fewer than 10", () => {
    const games = [
      makeGame({ date: "2024-01-01T12:00:00.000Z" }),
      makeGame({ date: "2024-01-08T12:00:00.000Z" }),
    ];
    const result = computeMatchup(games, T1, T2);
    expect(result.recentGames).toHaveLength(2);
  });

  it("includes game details in summary", () => {
    const result = computeMatchup([makeGame()], T1, T2);
    const g = result.recentGames[0];
    expect(g.homeTeamName).toBe(T1);
    expect(g.awayTeamName).toBe(T2);
    expect(g.homeScore).toBe(27);
    expect(g.awayScore).toBe(20);
    expect(g.spread).toBe(-3.5);
    expect(g.spreadResult).toBe("COVERED");
    expect(g.ouResult).toBe("OVER");
  });
});

// ─── Integration ────────────────────────────────────────

describe("computeMatchup — integration", () => {
  it("handles a realistic multi-game rivalry", () => {
    const games: MatchupGame[] = [
      // 2021: T1 home win, covered, over
      makeGame({ date: "2021-10-10T12:00:00.000Z", season: 2021, homeScore: 38, awayScore: 20, winnerName: T1, spread: -3, spreadResult: "COVERED", ouResult: "OVER" }),
      // 2022: T2 home win (T1 away loss), home covered, under
      makeGame({ date: "2022-01-23T12:00:00.000Z", season: 2022, homeTeamName: T2, awayTeamName: T1, homeScore: 36, awayScore: 33, winnerName: T2, spread: -1.5, spreadResult: "COVERED", ouResult: "OVER", isPlayoff: true }),
      // 2023: T1 home win, lost spread, under
      makeGame({ date: "2023-12-10T12:00:00.000Z", season: 2023, homeScore: 17, awayScore: 10, winnerName: T1, spread: -3.5, spreadResult: "LOST", ouResult: "UNDER" }),
      // 2024: T1 home win, covered, over
      makeGame({ date: "2024-11-17T12:00:00.000Z", season: 2024, homeScore: 30, awayScore: 21, winnerName: T1, spread: -2.5, spreadResult: "COVERED", ouResult: "OVER" }),
    ];

    const result = computeMatchup(games, T1, T2);

    // T1: 3W-1L
    expect(result.team1Record).toEqual({ wins: 3, losses: 1, ties: 0, pct: "0.750" });
    expect(result.team2Record).toEqual({ wins: 1, losses: 3, ties: 0, pct: "0.250" });
    expect(result.totalGames).toBe(4);

    // Streak: T1 won last 2
    expect(result.streakTeam).toBe(T1);
    expect(result.streakCount).toBe(2);

    // Scoring: totals = 58+69+27+51 = 205, avg = 51.25 → 51.3
    expect(result.scoring.avgTotal).toBe("51.3");
    expect(result.scoring.highestTotal).toBe(69);
    expect(result.scoring.lowestTotal).toBe(27);

    // Recent games: most recent first
    expect(result.recentGames[0].season).toBe(2024);
    expect(result.recentGames[3].season).toBe(2021);

    // O/U: 3 over, 1 under
    expect(result.betting.overCount).toBe(3);
    expect(result.betting.underCount).toBe(1);
  });
});
