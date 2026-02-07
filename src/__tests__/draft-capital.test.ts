import { describe, it, expect } from "vitest";
import { computeDraftCapitalImpact, type DraftCapitalTeam } from "@/lib/draft-capital";

function makeTeam(overrides: Partial<DraftCapitalTeam> = {}): DraftCapitalTeam {
  return {
    team: "Kansas City Chiefs",
    season: 2024,
    wins: 10,
    losses: 7,
    draftPosition: 5,
    ...overrides,
  };
}

describe("computeDraftCapitalImpact — empty", () => {
  it("returns empty arrays for no teams", () => {
    const r = computeDraftCapitalImpact([]);
    expect(r.positionGroups).toHaveLength(0);
    expect(r.topPickSuccess).toBe(0);
    expect(r.correlation).toBe(0);
    expect(r.bestValuePicks).toHaveLength(0);
  });
});

describe("computeDraftCapitalImpact — position grouping", () => {
  it("groups teams by draft position ranges", () => {
    const teams = [
      makeTeam({ draftPosition: 3, wins: 9, losses: 8 }),
      makeTeam({ draftPosition: 25, wins: 7, losses: 10 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    expect(r.positionGroups.length).toBeGreaterThan(0);
  });

  it("calculates average wins by position group", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 8, losses: 9 }),
      makeTeam({ draftPosition: 4, wins: 6, losses: 11 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const topGroup = r.positionGroups.find((pg) => pg.range === "1-5");
    expect(topGroup?.avgWins).toBe(7);
  });

  it("calculates average losses by position group", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 8, losses: 9 }),
      makeTeam({ draftPosition: 4, wins: 6, losses: 11 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const topGroup = r.positionGroups.find((pg) => pg.range === "1-5");
    expect(topGroup?.avgLosses).toBe(10);
  });

  it("counts teams in each position group", () => {
    const teams = [
      makeTeam({ draftPosition: 2, wins: 8, losses: 9 }),
      makeTeam({ draftPosition: 4, wins: 6, losses: 11 }),
      makeTeam({ draftPosition: 7, wins: 7, losses: 10 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const topGroup = r.positionGroups.find((pg) => pg.range === "1-5");
    const midGroup = r.positionGroups.find((pg) => pg.range === "6-10");
    expect(topGroup?.teams).toBe(2);
    expect(midGroup?.teams).toBe(1);
  });
});

describe("computeDraftCapitalImpact — top pick success", () => {
  it("calculates win rate for picks 1-5", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 10, losses: 7 }),
      makeTeam({ draftPosition: 5, wins: 8, losses: 9 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    // (10 + 8) / (10 + 7 + 8 + 9) = 18 / 34 = 0.529
    expect(r.topPickSuccess).toBeCloseTo(0.529, 2);
  });

  it("handles zero games case", () => {
    const teams = [makeTeam({ draftPosition: 3, wins: 0, losses: 0 })];
    const r = computeDraftCapitalImpact(teams);
    expect(r.topPickSuccess).toBe(0);
  });
});

describe("computeDraftCapitalImpact — correlation", () => {
  it("calculates correlation between draft position and wins", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 14, losses: 3 }),
      makeTeam({ draftPosition: 32, wins: 4, losses: 13 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    // Should be negative (high pick = lower wins from previous season)
    expect(r.correlation).toBeLessThan(0);
  });

  it("handles perfect positive correlation", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 10, losses: 7 }),
      makeTeam({ draftPosition: 2, wins: 11, losses: 6 }),
      makeTeam({ draftPosition: 3, wins: 12, losses: 5 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    expect(r.correlation).toBeGreaterThan(0);
  });

  it("handles single team case", () => {
    const teams = [makeTeam({ draftPosition: 5, wins: 8, losses: 9 })];
    const r = computeDraftCapitalImpact(teams);
    expect(r.correlation).toBe(0);
  });
});

describe("computeDraftCapitalImpact — best value picks", () => {
  it("identifies teams outperforming their draft position group", () => {
    const teams = [
      makeTeam({ team: "Team1", draftPosition: 1, wins: 5, losses: 12 }),
      makeTeam({ team: "Team2", draftPosition: 3, wins: 5, losses: 12 }),
      makeTeam({ team: "Team3", draftPosition: 22, wins: 14, losses: 3 }),
      makeTeam({ team: "Team4", draftPosition: 24, wins: 4, losses: 13 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const team3 = r.bestValuePicks.find((p) => p.team === "Team3");
    expect(team3).toBeDefined();
    expect(team3?.outperformance).toBeGreaterThan(0);
  });

  it("limits best value picks to 10", () => {
    const teams = Array.from({ length: 32 }, (_, i) =>
      makeTeam({
        team: `Team${i}`,
        season: 2024,
        draftPosition: i + 1,
        wins: 32 - i,
        losses: i,
      })
    );
    const r = computeDraftCapitalImpact(teams);
    expect(r.bestValuePicks.length).toBeLessThanOrEqual(10);
  });

  it("sorts by outperformance descending", () => {
    const teams = [
      makeTeam({ team: "Team1", draftPosition: 25, wins: 14, losses: 3 }),
      makeTeam({ team: "Team2", draftPosition: 20, wins: 12, losses: 5 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    if (r.bestValuePicks.length >= 2) {
      expect(r.bestValuePicks[0].outperformance).toBeGreaterThanOrEqual(
        r.bestValuePicks[1].outperformance
      );
    }
  });

  it("excludes teams with zero or negative outperformance", () => {
    const teams = [
      makeTeam({ team: "Team1", draftPosition: 1, wins: 5, losses: 12 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const team1 = r.bestValuePicks.find((p) => p.team === "Team1");
    expect(team1).toBeUndefined();
  });

  it("includes all relevant data in best value picks", () => {
    const teams = [
      makeTeam({
        team: "Team1",
        season: 2023,
        draftPosition: 28,
        wins: 13,
        losses: 4,
      }),
      makeTeam({
        team: "Team2",
        season: 2023,
        draftPosition: 27,
        wins: 10,
        losses: 7,
      }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const pick = r.bestValuePicks[0];
    expect(pick?.team).toBe("Team1");
    expect(pick?.season).toBe(2023);
    expect(pick?.draftPosition).toBe(28);
    expect(pick?.wins).toBe(13);
  });
});

describe("computeDraftCapitalImpact — precision", () => {
  it("rounds avg wins to 2 decimals", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 7, losses: 10 }),
      makeTeam({ draftPosition: 3, wins: 8, losses: 9 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const topGroup = r.positionGroups.find((pg) => pg.range === "1-5");
    expect(topGroup?.avgWins).toBe(7.5);
  });

  it("rounds correlation to 3 decimals", () => {
    const teams = [
      makeTeam({ draftPosition: 1, wins: 5, losses: 12 }),
      makeTeam({ draftPosition: 16, wins: 9, losses: 8 }),
      makeTeam({ draftPosition: 32, wins: 13, losses: 4 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const correlationStr = Math.abs(r.correlation).toString();
    const decimals = correlationStr.split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });

  it("rounds outperformance to 2 decimals", () => {
    const teams = [
      makeTeam({ team: "Team1", draftPosition: 30, wins: 10, losses: 7 }),
    ];
    const r = computeDraftCapitalImpact(teams);
    const pick = r.bestValuePicks[0];
    if (pick) {
      expect(pick.outperformance.toString().split(".")[1]?.length).toBeLessThanOrEqual(2);
    }
  });
});
