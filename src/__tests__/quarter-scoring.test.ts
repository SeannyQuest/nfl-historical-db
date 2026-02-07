import { describe, it, expect } from "vitest";
import { computeQuarterScoring, type QuarterGame } from "@/lib/quarter-scoring";

function makeGame(overrides: Partial<QuarterGame> = {}): QuarterGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeQ1: 3,
    homeQ2: 7,
    homeQ3: 3,
    homeQ4: 7,
    awayQ1: 3,
    awayQ2: 0,
    awayQ3: 7,
    awayQ4: 9,
    ...overrides,
  };
}

describe("computeQuarterScoring — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeQuarterScoring([]);
    expect(r.leagueByQuarter).toHaveLength(0);
    expect(r.teamByQuarter).toHaveLength(0);
    expect(r.fastStarters).toHaveLength(0);
    expect(r.closers).toHaveLength(0);
    expect(r.comebackTeams).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeQuarterScoring — league by quarter", () => {
  it("calculates average points per quarter", () => {
    const games = [makeGame({ homeQ1: 7, awayQ1: 3 })];
    const r = computeQuarterScoring(games);
    const q1 = r.leagueByQuarter.find((q) => q.quarter === "Q1");
    expect(q1?.avgPoints).toBe("5.00");
  });

  it("includes all quarters", () => {
    const games = [makeGame()];
    const r = computeQuarterScoring(games);
    expect(r.leagueByQuarter.length).toBeGreaterThanOrEqual(4);
    const quarters = r.leagueByQuarter.map((q) => q.quarter);
    expect(quarters).toContain("Q1");
    expect(quarters).toContain("Q2");
    expect(quarters).toContain("Q3");
    expect(quarters).toContain("Q4");
  });

  it("calculates percentage of total points", () => {
    const games = [
      makeGame({
        homeQ1: 10,
        homeQ2: 10,
        homeQ3: 10,
        homeQ4: 10,
        awayQ1: 10,
        awayQ2: 10,
        awayQ3: 10,
        awayQ4: 10,
      }),
    ];
    const r = computeQuarterScoring(games);
    const q1 = r.leagueByQuarter.find((q) => q.quarter === "Q1");
    expect(q1?.pctOfTotal).toBe("25.0");
  });

  it("includes OT if present", () => {
    const games = [makeGame({ homeOT: 3, awayOT: 0 })];
    const r = computeQuarterScoring(games);
    const ot = r.leagueByQuarter.find((q) => q.quarter === "OT");
    expect(ot).toBeDefined();
  });
});

describe("computeQuarterScoring — team by quarter", () => {
  it("calculates team average per quarter", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 7, homeQ2: 3, homeQ3: 3, homeQ4: 7 }),
      makeGame({ homeTeamName: "Chiefs", homeQ1: 3, homeQ2: 7, homeQ3: 7, homeQ4: 3 }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.teamByQuarter.find((t) => t.team === "Chiefs");
    expect(chiefs?.q1Avg).toBe("5.00");
    expect(chiefs?.q2Avg).toBe("5.00");
    expect(chiefs?.q3Avg).toBe("5.00");
    expect(chiefs?.q4Avg).toBe("5.00");
  });

  it("identifies best quarter for team", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 3, homeQ2: 7, homeQ3: 3, homeQ4: 10 }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.teamByQuarter.find((t) => t.team === "Chiefs");
    expect(chiefs?.bestQuarter).toBe("Q4");
  });

  it("identifies worst quarter for team", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 7, homeQ3: 7, homeQ4: 7 }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.teamByQuarter.find((t) => t.team === "Chiefs");
    expect(chiefs?.worstQuarter).toBe("Q1");
  });

  it("includes away team stats", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", awayQ1: 10, awayQ2: 7, awayQ3: 3, awayQ4: 3 }),
    ];
    const r = computeQuarterScoring(games);
    const ravens = r.teamByQuarter.find((t) => t.team === "Ravens");
    expect(ravens?.bestQuarter).toBe("Q1");
  });
});

describe("computeQuarterScoring — fast starters", () => {
  it("identifies top 10 teams by Q1 scoring", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 14 }),
      makeGame({ homeTeamName: "Ravens", homeQ1: 7 }),
      makeGame({ homeTeamName: "Texans", homeQ1: 10 }),
    ];
    const r = computeQuarterScoring(games);
    expect(r.fastStarters[0].team).toBe("Chiefs");
    expect(r.fastStarters[0].q1Avg).toBe("14.00");
  });

  it("limits to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      return makeGame({
        homeTeamName: `Team${i}`,
        homeQ1: 7 + (i % 10),
      });
    });
    const r = computeQuarterScoring(games);
    expect(r.fastStarters.length).toBeLessThanOrEqual(10);
  });
});

describe("computeQuarterScoring — closers", () => {
  it("identifies top 10 teams by Q4 scoring", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ4: 14 }),
      makeGame({ homeTeamName: "Ravens", homeQ4: 7 }),
      makeGame({ homeTeamName: "Texans", homeQ4: 10 }),
    ];
    const r = computeQuarterScoring(games);
    expect(r.closers[0].team).toBe("Chiefs");
    expect(r.closers[0].q4Avg).toBe("14.00");
  });

  it("limits to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      return makeGame({
        homeTeamName: `Team${i}`,
        homeQ4: 7 + (i % 10),
      });
    });
    const r = computeQuarterScoring(games);
    expect(r.closers.length).toBeLessThanOrEqual(10);
  });
});

describe("computeQuarterScoring — comeback teams", () => {
  it("calculates first half vs second half differential", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeQ1: 0,
        homeQ2: 0,
        homeQ3: 7,
        homeQ4: 7,
      }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.comebackTeams.find((t) => t.team === "Chiefs");
    expect(chiefs?.firstHalfAvg).toBe("0.00");
    expect(chiefs?.secondHalfAvg).toBe("7.00");
    expect(chiefs?.differential).toBe("7.00");
  });

  it("includes negative differentials for fast starters", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeQ1: 14,
        homeQ2: 14,
        homeQ3: 0,
        homeQ4: 0,
      }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.comebackTeams.find((t) => t.team === "Chiefs");
    expect(parseFloat(chiefs?.differential || "0")).toBeLessThan(0);
  });

  it("limits to top 10", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      return makeGame({
        homeTeamName: `Team${i}`,
        homeQ1: 3,
        homeQ2: 3,
        homeQ3: 7 + (i % 5),
        homeQ4: 7 + (i % 5),
      });
    });
    const r = computeQuarterScoring(games);
    expect(r.comebackTeams.length).toBeLessThanOrEqual(10);
  });

  it("sorts by differential descending", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        homeQ1: 0,
        homeQ2: 0,
        homeQ3: 10,
        homeQ4: 10,
      }),
      makeGame({
        homeTeamName: "Ravens",
        homeQ1: 0,
        homeQ2: 0,
        homeQ3: 3,
        homeQ4: 3,
      }),
    ];
    const r = computeQuarterScoring(games);
    expect(r.comebackTeams[0].team).toBe("Chiefs");
  });
});

describe("computeQuarterScoring — season trends", () => {
  it("calculates league average by quarter by season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeQ1: 7,
        homeQ2: 7,
        homeQ3: 7,
        homeQ4: 7,
        awayQ1: 3,
        awayQ2: 3,
        awayQ3: 3,
        awayQ4: 3,
      }),
    ];
    const r = computeQuarterScoring(games);
    const s2024 = r.seasonTrends.find((s) => s.season === 2024);
    expect(s2024?.q1Avg).toBe("5.00");
    expect(s2024?.q2Avg).toBe("5.00");
  });

  it("sorts by season ascending", () => {
    const games = [
      makeGame({ season: 2023 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2022 }),
    ];
    const r = computeQuarterScoring(games);
    expect(r.seasonTrends[0].season).toBe(2022);
    expect(r.seasonTrends[1].season).toBe(2023);
    expect(r.seasonTrends[2].season).toBe(2024);
  });
});

describe("computeQuarterScoring — integration", () => {
  it("handles multiple teams in same game", () => {
    const games = [makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens" })];
    const r = computeQuarterScoring(games);
    expect(r.teamByQuarter.length).toBe(2);
  });

  it("accumulates stats across multiple games", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 7 }),
      makeGame({ homeTeamName: "Chiefs", homeQ1: 3 }),
    ];
    const r = computeQuarterScoring(games);
    const chiefs = r.teamByQuarter.find((t) => t.team === "Chiefs");
    expect(chiefs?.q1Avg).toBe("5.00");
  });
});
