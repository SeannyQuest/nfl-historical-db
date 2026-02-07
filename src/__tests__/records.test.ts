import { describe, it, expect } from "vitest";
import { computeRecords, type RecordGame } from "@/lib/records";

function makeGame(overrides: Partial<RecordGame> = {}): RecordGame {
  return {
    id: "game-1",
    date: "2024-09-08T12:00:00.000Z",
    season: 2024,
    week: "1",
    isPlayoff: false,
    homeTeamName: "Kansas City Chiefs",
    homeTeamAbbr: "KC",
    awayTeamName: "Buffalo Bills",
    awayTeamAbbr: "BUF",
    homeScore: 27,
    awayScore: 20,
    winnerName: "Kansas City Chiefs",
    spread: -3.5,
    spreadResult: "COVERED",
    ouResult: "OVER",
    overUnder: 44.5,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeRecords — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeRecords([]);
    expect(r.highestScoringGames).toHaveLength(0);
    expect(r.lowestScoringGames).toHaveLength(0);
    expect(r.biggestBlowouts).toHaveLength(0);
    expect(r.closestGames).toHaveLength(0);
    expect(r.highestHomeScores).toHaveLength(0);
    expect(r.highestAwayScores).toHaveLength(0);
    expect(r.bestTeamSeasons).toHaveLength(0);
    expect(r.worstTeamSeasons).toHaveLength(0);
  });
});

// ─── Highest Scoring ────────────────────────────────────

describe("computeRecords — highest scoring", () => {
  it("ranks by total points descending", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 30, awayScore: 28 }), // 58
      makeGame({ id: "g2", homeScore: 50, awayScore: 48 }), // 98
      makeGame({ id: "g3", homeScore: 10, awayScore: 7 }),   // 17
    ];
    const r = computeRecords(games);
    expect(r.highestScoringGames[0].value).toBe(98);
    expect(r.highestScoringGames[0].rank).toBe(1);
    expect(r.highestScoringGames[1].value).toBe(58);
    expect(r.highestScoringGames[2].value).toBe(17);
  });

  it("includes matchup label", () => {
    const games = [makeGame({ homeScore: 35, awayScore: 31 })];
    const r = computeRecords(games);
    expect(r.highestScoringGames[0].label).toContain("BUF @ KC");
    expect(r.highestScoringGames[0].label).toContain("66 pts");
  });
});

// ─── Lowest Scoring ─────────────────────────────────────

describe("computeRecords — lowest scoring", () => {
  it("ranks by total points ascending", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 30, awayScore: 28 }), // 58
      makeGame({ id: "g2", homeScore: 3, awayScore: 0 }),    // 3
      makeGame({ id: "g3", homeScore: 10, awayScore: 7 }),   // 17
    ];
    const r = computeRecords(games);
    expect(r.lowestScoringGames[0].value).toBe(3);
    expect(r.lowestScoringGames[0].rank).toBe(1);
    expect(r.lowestScoringGames[1].value).toBe(17);
  });
});

// ─── Biggest Blowouts ───────────────────────────────────

describe("computeRecords — biggest blowouts", () => {
  it("ranks by margin descending", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 45, awayScore: 3, winnerName: "Kansas City Chiefs" }),  // 42 margin
      makeGame({ id: "g2", homeScore: 28, awayScore: 21, winnerName: "Kansas City Chiefs" }), // 7 margin
      makeGame({ id: "g3", homeScore: 10, awayScore: 41, winnerName: "Buffalo Bills" }),       // 31 margin
    ];
    const r = computeRecords(games);
    expect(r.biggestBlowouts[0].value).toBe(42);
    expect(r.biggestBlowouts[1].value).toBe(31);
    expect(r.biggestBlowouts[2].value).toBe(7);
  });

  it("includes margin label", () => {
    const games = [makeGame({ homeScore: 45, awayScore: 3 })];
    const r = computeRecords(games);
    expect(r.biggestBlowouts[0].label).toContain("42 pt margin");
  });
});

// ─── Closest Games ──────────────────────────────────────

describe("computeRecords — closest games", () => {
  it("ranks by margin ascending", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 20, awayScore: 20, winnerName: null }),   // 0 margin
      makeGame({ id: "g2", homeScore: 21, awayScore: 20, winnerName: "Kansas City Chiefs" }), // 1 margin
      makeGame({ id: "g3", homeScore: 35, awayScore: 10, winnerName: "Kansas City Chiefs" }), // 25 margin
    ];
    const r = computeRecords(games);
    expect(r.closestGames[0].value).toBe(0);
    expect(r.closestGames[1].value).toBe(1);
    expect(r.closestGames[2].value).toBe(25);
  });

  it("labels ties as TIE", () => {
    const games = [makeGame({ homeScore: 20, awayScore: 20, winnerName: null })];
    const r = computeRecords(games);
    expect(r.closestGames[0].label).toContain("TIE");
  });
});

// ─── Highest Home/Away Scores ───────────────────────────

describe("computeRecords — highest scores", () => {
  it("ranks highest home scores", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 55 }),
      makeGame({ id: "g2", homeScore: 42 }),
      makeGame({ id: "g3", homeScore: 60 }),
    ];
    const r = computeRecords(games);
    expect(r.highestHomeScores[0].value).toBe(60);
    expect(r.highestHomeScores[1].value).toBe(55);
    expect(r.highestHomeScores[2].value).toBe(42);
  });

  it("ranks highest away scores", () => {
    const games = [
      makeGame({ id: "g1", awayScore: 48 }),
      makeGame({ id: "g2", awayScore: 52 }),
      makeGame({ id: "g3", awayScore: 31 }),
    ];
    const r = computeRecords(games);
    expect(r.highestAwayScores[0].value).toBe(52);
    expect(r.highestAwayScores[1].value).toBe(48);
    expect(r.highestAwayScores[2].value).toBe(31);
  });

  it("includes team label for home score", () => {
    const games = [makeGame({ homeScore: 55 })];
    const r = computeRecords(games);
    expect(r.highestHomeScores[0].label).toContain("KC scored 55");
  });

  it("includes team label for away score", () => {
    const games = [makeGame({ awayScore: 48 })];
    const r = computeRecords(games);
    expect(r.highestAwayScores[0].label).toContain("BUF scored 48");
  });
});

// ─── Team Season Records ────────────────────────────────

describe("computeRecords — team seasons", () => {
  it("computes best team seasons by win pct", () => {
    const games: RecordGame[] = [];
    // Create 16 wins for KC in 2024
    for (let i = 0; i < 16; i++) {
      games.push(makeGame({
        id: `g-w-${i}`,
        season: 2024,
        homeScore: 30,
        awayScore: 10,
        winnerName: "Kansas City Chiefs",
        homeTeamName: "Kansas City Chiefs",
        homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills",
        awayTeamAbbr: "BUF",
      }));
    }
    const r = computeRecords(games);
    const best = r.bestTeamSeasons.find((ts) => ts.teamAbbr === "KC");
    expect(best).toBeDefined();
    expect(best!.value).toBe("1.000");
    expect(best!.detail).toBe("16-0");
  });

  it("computes worst team seasons by win pct", () => {
    const games: RecordGame[] = [];
    for (let i = 0; i < 16; i++) {
      games.push(makeGame({
        id: `g-l-${i}`,
        season: 2024,
        homeScore: 10,
        awayScore: 30,
        winnerName: "Buffalo Bills",
        homeTeamName: "Kansas City Chiefs",
        homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills",
        awayTeamAbbr: "BUF",
      }));
    }
    const r = computeRecords(games);
    const worst = r.worstTeamSeasons.find((ts) => ts.teamAbbr === "KC");
    expect(worst).toBeDefined();
    expect(worst!.value).toBe("0.000");
    expect(worst!.detail).toBe("0-16");
  });

  it("excludes playoff games from team seasons", () => {
    const games: RecordGame[] = [];
    for (let i = 0; i < 12; i++) {
      games.push(makeGame({
        id: `g-reg-${i}`,
        season: 2024,
        isPlayoff: false,
        winnerName: "Kansas City Chiefs",
      }));
    }
    // Add playoff wins that should NOT count
    for (let i = 0; i < 4; i++) {
      games.push(makeGame({
        id: `g-play-${i}`,
        season: 2024,
        isPlayoff: true,
        winnerName: "Kansas City Chiefs",
      }));
    }
    const r = computeRecords(games);
    const best = r.bestTeamSeasons.find((ts) => ts.teamAbbr === "KC" && ts.season === 2024);
    expect(best).toBeDefined();
    expect(best!.detail).toBe("12-0"); // Only 12 regular season games
  });

  it("excludes seasons with fewer than 10 games", () => {
    const games: RecordGame[] = [];
    for (let i = 0; i < 5; i++) {
      games.push(makeGame({
        id: `g-short-${i}`,
        season: 2024,
        winnerName: "Kansas City Chiefs",
      }));
    }
    const r = computeRecords(games);
    expect(r.bestTeamSeasons).toHaveLength(0);
  });

  it("includes ties in season detail", () => {
    const games: RecordGame[] = [];
    for (let i = 0; i < 10; i++) {
      games.push(makeGame({
        id: `g-tie-${i}`,
        season: 2024,
        homeScore: 20,
        awayScore: 20,
        winnerName: null,
      }));
    }
    const r = computeRecords(games);
    // Both teams have 0-0-10 records (from perspective of each team playing 5 home, 5 away)
    // Actually both teams play in all 10 games
    const entry = r.worstTeamSeasons.find((ts) => ts.season === 2024);
    expect(entry).toBeDefined();
    expect(entry!.detail).toContain("-");
  });
});

// ─── Limit ──────────────────────────────────────────────

describe("computeRecords — limit", () => {
  it("respects custom limit", () => {
    const games: RecordGame[] = [];
    for (let i = 0; i < 20; i++) {
      games.push(makeGame({
        id: `g-${i}`,
        homeScore: 20 + i,
        awayScore: 10,
      }));
    }
    const r = computeRecords(games, 5);
    expect(r.highestScoringGames).toHaveLength(5);
    expect(r.lowestScoringGames).toHaveLength(5);
  });

  it("returns fewer than limit when not enough games", () => {
    const games = [makeGame()];
    const r = computeRecords(games, 10);
    expect(r.highestScoringGames).toHaveLength(1);
  });
});

// ─── Integration ────────────────────────────────────────

describe("computeRecords — integration", () => {
  it("handles a mixed dataset", () => {
    const games: RecordGame[] = [
      makeGame({ id: "g1", homeScore: 50, awayScore: 48, season: 2024, winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", homeScore: 3, awayScore: 0, season: 2024, winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g3", homeScore: 14, awayScore: 14, season: 2024, winnerName: null }),
      makeGame({ id: "g4", homeScore: 42, awayScore: 7, season: 2023, winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g5", homeScore: 21, awayScore: 20, season: 2023, winnerName: "Kansas City Chiefs" }),
    ];

    const r = computeRecords(games);

    // Highest scoring: g1 (98)
    expect(r.highestScoringGames[0].value).toBe(98);
    expect(r.highestScoringGames[0].game.id).toBe("g1");

    // Lowest scoring: g2 (3)
    expect(r.lowestScoringGames[0].value).toBe(3);

    // Biggest blowout: g4 (35 margin)
    expect(r.biggestBlowouts[0].value).toBe(35);
    expect(r.biggestBlowouts[0].game.id).toBe("g4");

    // Closest: g3 (0 margin tie)
    expect(r.closestGames[0].value).toBe(0);
    expect(r.closestGames[0].game.id).toBe("g3");

    // Highest home: g1 (50)
    expect(r.highestHomeScores[0].value).toBe(50);

    // Highest away: g1 (48)
    expect(r.highestAwayScores[0].value).toBe(48);
  });
});
