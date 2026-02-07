import { describe, it, expect } from "vitest";
import { computeWeeklyPower, type WeeklyGame } from "@/lib/weekly-power";

function makeGame(overrides: Partial<WeeklyGame> = {}): WeeklyGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeWeeklyPower — empty", () => {
  it("returns empty for no games", () => {
    const r = computeWeeklyPower([]);
    expect(r.weeklyRankings).toHaveLength(0);
    expect(r.weekOverWeek).toHaveLength(0);
  });
});

// ─── Weekly Rankings ────────────────────────────────────

describe("computeWeeklyPower — weekly rankings", () => {
  it("creates rankings per season and week", () => {
    const games = [
      makeGame({ season: 2024, week: 1, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, week: 1, homeTeamName: "CHI", homeScore: 25, awayScore: 22 }),
    ];
    const r = computeWeeklyPower(games);
    const week1 = r.weeklyRankings.find(w => w.season === 2024 && w.week === 1);
    expect(week1?.rankings.length).toBeGreaterThan(0);
  });

  it("computes team records correctly", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 30, awayScore: 20 }), // GB 1-0
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 20, awayScore: 25 }), // GB 1-1 (loss in same week, both games)
    ];
    const r = computeWeeklyPower(games);
    const week1 = r.weeklyRankings.find(w => w.week === 1);
    const gb = week1?.rankings.find(t => t.team === "GB");
    expect(gb?.wins).toBe(1);
    expect(gb?.losses).toBe(1);
  });

  it("computes point differential", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 }), // +10
      makeGame({ homeTeamName: "GB", homeScore: 28, awayScore: 25 }), // +3
    ];
    const r = computeWeeklyPower(games);
    const week1 = r.weeklyRankings.find(w => w.week === 1);
    const gb = week1?.rankings.find(t => t.team === "GB");
    // Same week games both count
    expect(gb?.pointDiff).toBe(13);
  });

  it("computes power score", () => {
    const games = [makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 })]; // 1 win, +10 diff
    const r = computeWeeklyPower(games);
    const week1 = r.weeklyRankings.find(w => w.week === 1);
    const gb = week1?.rankings.find(t => t.team === "GB");
    // 1*10 + 10/10 = 11.0
    expect(gb?.powerScore).toBe("11.00");
  });

  it("ranks by power score descending", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 35, awayScore: 20 }), // 1 win, +15 = 11.5
      makeGame({ homeTeamName: "CHI", homeScore: 20, awayScore: 28 }), // 0 wins, -8 = -0.8
    ];
    const r = computeWeeklyPower(games);
    const week1 = r.weeklyRankings.find(w => w.week === 1);
    expect(week1?.rankings[0].team).toBe("GB");
  });
});

// ─── Week Over Week ─────────────────────────────────────

describe("computeWeeklyPower — week over week", () => {
  it("tracks team power across weeks", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "GB", homeScore: 25, awayScore: 15 }),
    ];
    const r = computeWeeklyPower(games);
    const gbWeeks = r.weekOverWeek.find(w => w.team === "GB");
    expect(gbWeeks?.weeklyPower).toHaveLength(2);
    expect(gbWeeks?.weeklyPower[0].week).toBe(1);
    expect(gbWeeks?.weeklyPower[1].week).toBe(2);
  });

  it("includes rank in week over week", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 50, awayScore: 10 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 20, awayScore: 10 }),
    ];
    const r = computeWeeklyPower(games);
    const gbWeeks = r.weekOverWeek.find(w => w.team === "GB");
    expect(gbWeeks?.weeklyPower[0].rank).toBe(1);
  });

  it("separates seasons", () => {
    const games = [
      makeGame({ season: 2024, week: 1, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2023, week: 1, homeTeamName: "GB", homeScore: 25, awayScore: 15 }),
    ];
    const r = computeWeeklyPower(games);
    const gb2024 = r.weekOverWeek.find(w => w.season === 2024 && w.team === "GB");
    const gb2023 = r.weekOverWeek.find(w => w.season === 2023 && w.team === "GB");
    expect(gb2024).toBeDefined();
    expect(gb2023).toBeDefined();
  });
});

// ─── Biggest Risers ─────────────────────────────────────

describe("computeWeeklyPower — biggest risers", () => {
  it("identifies teams improving rank week-to-week", () => {
    const games = [
      // Week 1: GB dead last (rank 6), 5 other teams ahead
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 3, awayTeamName: "X1", awayScore: 40 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 35, awayTeamName: "X2", awayScore: 15 }),
      makeGame({ week: 1, homeTeamName: "DET", homeScore: 28, awayTeamName: "X3", awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "MIN", homeScore: 30, awayTeamName: "X4", awayScore: 17 }),
      makeGame({ week: 1, homeTeamName: "SF", homeScore: 27, awayTeamName: "X5", awayScore: 14 }),

      // Week 2: GB wins huge, others lose
      makeGame({ week: 2, homeTeamName: "GB", homeScore: 50, awayTeamName: "X1", awayScore: 0 }),
      makeGame({ week: 2, homeTeamName: "CHI", homeScore: 10, awayTeamName: "X2", awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "DET", homeScore: 10, awayTeamName: "X3", awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "MIN", homeScore: 10, awayTeamName: "X4", awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "SF", homeScore: 10, awayTeamName: "X5", awayScore: 30 }),
    ];
    const r = computeWeeklyPower(games);
    const gbRise = r.biggestRisers.find(x => x.team === "GB");
    expect(gbRise?.rankChange).toBeGreaterThan(0);
  });

  it("filters risers with rank change > 3", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 10, awayScore: 30 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 35, awayScore: 15 }),
      makeGame({ week: 1, homeTeamName: "DET", homeScore: 28, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "GB", homeScore: 40, awayScore: 10 }),
      makeGame({ week: 2, homeTeamName: "CHI", homeScore: 20, awayScore: 18 }),
      makeGame({ week: 2, homeTeamName: "DET", homeScore: 15, awayScore: 10 }),
    ];
    const r = computeWeeklyPower(games);
    // All risers should have rank change > 3, or there are no risers (which is ok)
    expect(r.biggestRisers.length === 0 || r.biggestRisers.every(x => x.rankChange > 3)).toBe(true);
  });

  it("tracks from/to weeks", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 10, awayScore: 30 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 35, awayScore: 15 }),
      makeGame({ week: 1, homeTeamName: "DET", homeScore: 28, awayScore: 20 }),
      makeGame({ week: 3, homeTeamName: "GB", homeScore: 40, awayScore: 10 }),
      makeGame({ week: 3, homeTeamName: "CHI", homeScore: 20, awayScore: 18 }),
      makeGame({ week: 3, homeTeamName: "DET", homeScore: 15, awayScore: 10 }),
    ];
    const r = computeWeeklyPower(games);
    const gbRise = r.biggestRisers.find(x => x.team === "GB");
    if (gbRise) {
      expect(gbRise.weekFrom).toBe(1);
      expect(gbRise.weekTo).toBe(3);
    }
  });
});

// ─── Biggest Fallers ────────────────────────────────────

describe("computeWeeklyPower — biggest fallers", () => {
  it("identifies teams dropping in rank", () => {
    const games = [
      // Week 1: GB is #1
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 50, awayTeamName: "X1", awayScore: 0 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 10, awayTeamName: "X2", awayScore: 30 }),
      makeGame({ week: 1, homeTeamName: "DET", homeScore: 10, awayTeamName: "X3", awayScore: 30 }),
      makeGame({ week: 1, homeTeamName: "MIN", homeScore: 10, awayTeamName: "X4", awayScore: 30 }),
      makeGame({ week: 1, homeTeamName: "SF", homeScore: 10, awayTeamName: "X5", awayScore: 30 }),

      // Week 2: GB gets destroyed, others win big
      makeGame({ week: 2, homeTeamName: "GB", homeScore: 3, awayTeamName: "X1", awayScore: 40 }),
      makeGame({ week: 2, homeTeamName: "CHI", homeScore: 35, awayTeamName: "X2", awayScore: 15 }),
      makeGame({ week: 2, homeTeamName: "DET", homeScore: 28, awayTeamName: "X3", awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "MIN", homeScore: 30, awayTeamName: "X4", awayScore: 17 }),
      makeGame({ week: 2, homeTeamName: "SF", homeScore: 27, awayTeamName: "X5", awayScore: 14 }),
    ];
    const r = computeWeeklyPower(games);
    const gbFall = r.biggestFallers.find(x => x.team === "GB");
    expect(gbFall?.rankChange).toBeGreaterThan(0);
  });

  it("filters fallers with rank change > 3", () => {
    const games = [
      makeGame({ week: 1, homeTeamName: "GB", homeScore: 40, awayScore: 10 }),
      makeGame({ week: 1, homeTeamName: "CHI", homeScore: 15, awayScore: 20 }),
      makeGame({ week: 1, homeTeamName: "DET", homeScore: 28, awayScore: 20 }),
      makeGame({ week: 2, homeTeamName: "GB", homeScore: 10, awayScore: 30 }),
      makeGame({ week: 2, homeTeamName: "CHI", homeScore: 35, awayScore: 15 }),
      makeGame({ week: 2, homeTeamName: "DET", homeScore: 15, awayScore: 10 }),
    ];
    const r = computeWeeklyPower(games);
    expect(r.biggestFallers.every(x => x.rankChange > 3)).toBe(true);
  });
});

// ─── Sorting ─────────────────────────────────────────────

describe("computeWeeklyPower — sorting", () => {
  it("sorts weekly rankings by season then week", () => {
    const games = [
      makeGame({ season: 2024, week: 2, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2023, week: 1, homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ season: 2024, week: 1, homeTeamName: "CHI", homeScore: 25, awayScore: 20 }),
    ];
    const r = computeWeeklyPower(games);
    expect(r.weeklyRankings[0].season).toBe(2023);
    expect(r.weeklyRankings[1].season).toBe(2024);
    expect(r.weeklyRankings[1].week).toBe(1);
    expect(r.weeklyRankings[2].week).toBe(2);
  });
});
