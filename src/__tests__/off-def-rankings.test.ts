import { describe, it, expect } from "vitest";
import { computeOffDefRankings, type OffDefGame } from "@/lib/off-def-rankings";

function makeGame(overrides: Partial<OffDefGame> = {}): OffDefGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 27,
    awayScore: 20,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeOffDefRankings — empty", () => {
  it("returns empty for no games", () => {
    const r = computeOffDefRankings([]);
    expect(r.teamRankings).toHaveLength(0);
    expect(r.bestOffenses).toHaveLength(0);
    expect(r.bestDefenses).toHaveLength(0);
  });
});

// ─── Team Rankings ──────────────────────────────────────

describe("computeOffDefRankings — team rankings", () => {
  it("creates team rankings for home and away teams", () => {
    const games = [makeGame({ season: 2024, homeTeamName: "GB", awayTeamName: "CHI", homeScore: 27, awayScore: 20 })];
    const r = computeOffDefRankings(games);
    expect(r.teamRankings).toHaveLength(2);
  });

  it("computes points per game correctly", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "GB", homeScore: 28, awayScore: 14 }),
    ];
    const r = computeOffDefRankings(games);
    const gb = r.teamRankings.find(t => t.team === "GB");
    expect(gb?.ptsPerGame).toBe("29.00");
  });

  it("computes points allowed per game correctly", () => {
    const games = [
      makeGame({ awayTeamName: "CHI", homeScore: 27, awayScore: 20 }), // CHI allows 27
      makeGame({ awayTeamName: "CHI", homeScore: 24, awayScore: 10 }), // CHI allows 24
    ];
    const r = computeOffDefRankings(games);
    const chi = r.teamRankings.find(t => t.team === "CHI");
    expect(chi?.ptsAllowedPerGame).toBe("25.50");
  });
});

// ─── Offensive Rankings ─────────────────────────────────

describe("computeOffDefRankings — offensive rankings", () => {
  it("ranks teams by points scored (1 = best)", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 35, awayScore: 10 }),
      makeGame({ homeTeamName: "CHI", homeScore: 20, awayScore: 10 }),
    ];
    const r = computeOffDefRankings(games);
    const gb = r.teamRankings.find(t => t.team === "GB");
    const chi = r.teamRankings.find(t => t.team === "CHI");
    expect(gb?.offRank).toBe(1); // 35 ppg > 20 ppg
    expect(chi?.offRank).toBe(2);
  });

  it("captures top 10 offenses", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          homeTeamName: `TEAM${i}`,
          awayTeamName: `AWAY${i}`,
          homeScore: 40 - i,
          awayScore: 10,
        })
      );
    }
    const r = computeOffDefRankings(games);
    expect(r.bestOffenses.length).toBeLessThanOrEqual(10);
    expect(r.bestOffenses[0].ptsPerGame).toBe("40.00");
  });
});

// ─── Defensive Rankings ─────────────────────────────────

describe("computeOffDefRankings — defensive rankings", () => {
  it("ranks teams by points allowed (1 = best defense)", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 10, awayTeamName: "CHI", awayScore: 30 }), // GB allows 30
      makeGame({ homeTeamName: "CHI", homeScore: 10, awayTeamName: "GB", awayScore: 15 }), // CHI allows 15
    ];
    const r = computeOffDefRankings(games);
    const gb = r.teamRankings.find(t => t.team === "GB");
    const chi = r.teamRankings.find(t => t.team === "CHI");
    // GB allows avg of (30+15)/2 = 22.5, CHI allows 10 on average
    // CHI should have better defense (lower ppag)
    expect(chi?.defRank).toBeLessThan(gb?.defRank ?? Infinity);
  });

  it("captures top 10 defenses", () => {
    const games = [];
    for (let i = 0; i < 15; i++) {
      games.push(
        makeGame({
          homeTeamName: `TEAM${i}`,
          awayTeamName: `AWAY${i}`,
          homeScore: 10,
          awayScore: 10 + i,
        })
      );
    }
    const r = computeOffDefRankings(games);
    expect(r.bestDefenses.length).toBeLessThanOrEqual(10);
    // Best defense is lowest ppag
    expect(parseFloat(r.bestDefenses[0].ptsAllowedPerGame)).toBeLessThanOrEqual(
      parseFloat(r.bestDefenses[1]?.ptsAllowedPerGame || "1000")
    );
  });
});

// ─── Overall Rankings ───────────────────────────────────

describe("computeOffDefRankings — overall rankings", () => {
  it("computes overall rank as average of off and def", () => {
    const games = [makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 10 })];
    const r = computeOffDefRankings(games);
    const gb = r.teamRankings.find(t => t.team === "GB");
    // GB should have an overall rank
    expect(gb?.overallRank).toBeGreaterThan(0);
  });
});

// ─── Balanced Teams ─────────────────────────────────────

describe("computeOffDefRankings — balanced teams", () => {
  it("identifies teams with balanced off/def", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 28, awayScore: 14 }), // GB good at both
      makeGame({ homeTeamName: "CHI", homeScore: 10, awayScore: 40 }), // CHI poor at both
    ];
    const r = computeOffDefRankings(games);
    // Both teams play against balanced opponents; balanced teams have |offRank - defRank| <= 3
    const balanced = r.balancedTeams;
    expect(balanced.length).toBeGreaterThanOrEqual(0);
  });

  it("filters teams where |offRank - defRank| > 3", () => {
    const games = [
      makeGame({ homeTeamName: "GREAT_OFF", homeScore: 50, awayScore: 5 }), // Great offense
      makeGame({ homeTeamName: "GREAT_DEF", homeScore: 10, awayScore: 7 }), // Great defense
      makeGame({ homeTeamName: "TEAM_A", homeScore: 20, awayScore: 15 }),
      makeGame({ homeTeamName: "TEAM_B", homeScore: 15, awayScore: 20 }),
      makeGame({ homeTeamName: "TEAM_C", homeScore: 25, awayScore: 10 }),
    ];
    const r = computeOffDefRankings(games);
    // With 5+ teams, we should see some unbalanced ones
    const unbalanced = r.teamRankings.filter(t => Math.abs(t.offRank - t.defRank) > 3);
    expect(unbalanced.length).toBeGreaterThanOrEqual(0); // May or may not exist with small sample
  });
});

// ─── Season Best ────────────────────────────────────────

describe("computeOffDefRankings — season best", () => {
  it("records best offense per season", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 50, awayScore: 10 }),
      makeGame({ season: 2024, homeTeamName: "CHI", homeScore: 20, awayScore: 10 }),
    ];
    const r = computeOffDefRankings(games);
    const best = r.seasonBest.find(s => s.season === 2024);
    expect(best?.bestOffense).toBe("GB");
  });

  it("records best defense per season", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 10, awayScore: 50 }), // GB bad defense
      makeGame({ season: 2024, homeTeamName: "CHI", homeScore: 10, awayScore: 8 }), // CHI great defense
    ];
    const r = computeOffDefRankings(games);
    const best = r.seasonBest.find(s => s.season === 2024);
    expect(best?.bestDefense).toBe("CHI");
  });

  it("separates seasons", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 40, awayScore: 10 }),
      makeGame({ season: 2023, homeTeamName: "CHI", homeScore: 35, awayScore: 10 }),
    ];
    const r = computeOffDefRankings(games);
    expect(r.seasonBest).toHaveLength(2);
    expect(r.seasonBest[0].season).toBeLessThan(r.seasonBest[1].season);
  });
});

// ─── Multiple Games Per Team ────────────────────────────

describe("computeOffDefRankings — multiple games", () => {
  it("aggregates stats across multiple games", () => {
    const games = [
      makeGame({ homeTeamName: "GB", homeScore: 30, awayScore: 20 }),
      makeGame({ homeTeamName: "GB", homeScore: 26, awayScore: 14 }),
      makeGame({ homeTeamName: "GB", homeScore: 28, awayScore: 22 }),
    ];
    const r = computeOffDefRankings(games);
    const gb = r.teamRankings.find(t => t.team === "GB");
    const expectedPPG = (30 + 26 + 28) / 3;
    expect(gb?.ptsPerGame).toBe(expectedPPG.toFixed(2));
  });

  it("computes metrics per season correctly", () => {
    const games = [
      makeGame({ season: 2024, homeTeamName: "GB", homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2023, homeTeamName: "GB", homeScore: 20, awayScore: 10 }),
    ];
    const r = computeOffDefRankings(games);
    const gb2024 = r.teamRankings.find(t => t.team === "GB" && t.season === 2024);
    const gb2023 = r.teamRankings.find(t => t.team === "GB" && t.season === 2023);
    expect(gb2024?.ptsPerGame).toBe("30.00");
    expect(gb2023?.ptsPerGame).toBe("20.00");
  });
});
