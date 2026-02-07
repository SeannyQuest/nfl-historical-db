import { describe, it, expect } from "vitest";
import { computeRosterContinuity, type RosterTeam } from "@/lib/roster-continuity";

function makeTeam(overrides: Partial<RosterTeam> = {}): RosterTeam {
  return {
    team: "Kansas City Chiefs",
    season: 2024,
    wins: 11,
    losses: 6,
    returningSalaryPct: 0.65,
    ...overrides,
  };
}

describe("computeRosterContinuity — empty", () => {
  it("returns zeroes for no teams", () => {
    const r = computeRosterContinuity([]);
    expect(r.continuityImpact.highContinuity).toBe(0);
    expect(r.continuityImpact.medContinuity).toBe(0);
    expect(r.continuityImpact.lowContinuity).toBe(0);
    expect(r.teamContinuity).toHaveLength(0);
    expect(r.bestRetention).toHaveLength(0);
    expect(r.correlation).toBe(0);
  });
});

describe("computeRosterContinuity — continuity impact", () => {
  it("categorizes as high continuity (>0.7)", () => {
    const teams = [
      makeTeam({ team: "Chiefs", returningSalaryPct: 0.75, wins: 12 }),
      makeTeam({ team: "Ravens", returningSalaryPct: 0.78, wins: 10 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.continuityImpact.highContinuity).toBe(11);
  });

  it("categorizes as medium continuity (0.4-0.7)", () => {
    const teams = [
      makeTeam({ team: "Chiefs", returningSalaryPct: 0.65, wins: 10 }),
      makeTeam({ team: "Ravens", returningSalaryPct: 0.40, wins: 8 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.continuityImpact.medContinuity).toBe(9);
  });

  it("categorizes as low continuity (<0.4)", () => {
    const teams = [
      makeTeam({ team: "Chiefs", returningSalaryPct: 0.39, wins: 5 }),
      makeTeam({ team: "Ravens", returningSalaryPct: 0.20, wins: 3 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.continuityImpact.lowContinuity).toBe(4);
  });

  it("shows high continuity advantage", () => {
    const teams = [
      makeTeam({ team: "HighContinuity1", returningSalaryPct: 0.80, wins: 13 }),
      makeTeam({ team: "HighContinuity2", returningSalaryPct: 0.75, wins: 12 }),
      makeTeam({ team: "LowContinuity1", returningSalaryPct: 0.30, wins: 4 }),
      makeTeam({ team: "LowContinuity2", returningSalaryPct: 0.35, wins: 5 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.continuityImpact.highContinuity).toBeGreaterThan(r.continuityImpact.lowContinuity);
  });

  it("calculates exact average wins per continuity level", () => {
    const teams = [
      makeTeam({ team: "HC1", returningSalaryPct: 0.75, wins: 10 }),
      makeTeam({ team: "HC2", returningSalaryPct: 0.80, wins: 12 }),
      makeTeam({ team: "HC3", returningSalaryPct: 0.85, wins: 14 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.continuityImpact.highContinuity).toBe(12);
  });
});

describe("computeRosterContinuity — team continuity data", () => {
  it("stores all team continuity information", () => {
    const teams = [
      makeTeam({ team: "Chiefs", season: 2024, returningSalaryPct: 0.70, wins: 11, losses: 6 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.teamContinuity).toHaveLength(1);
    const chiefs = r.teamContinuity[0];
    expect(chiefs.team).toBe("Chiefs");
    expect(chiefs.season).toBe(2024);
    expect(chiefs.returningSalaryPct).toBe(0.70);
    expect(chiefs.wins).toBe(11);
    expect(chiefs.losses).toBe(6);
  });
});

describe("computeRosterContinuity — best retention", () => {
  it("returns top 10 by returning salary percentage", () => {
    const teams = Array.from({ length: 15 }, (_, i) =>
      makeTeam({
        team: `Team${i}`,
        returningSalaryPct: 0.5 + (i * 0.02),
        wins: 8 + i,
      })
    );
    const r = computeRosterContinuity(teams);
    expect(r.bestRetention.length).toBeLessThanOrEqual(10);
  });

  it("sorts by returningSalaryPct descending", () => {
    const teams = [
      makeTeam({ team: "HighRetention", returningSalaryPct: 0.85, wins: 12 }),
      makeTeam({ team: "MedRetention", returningSalaryPct: 0.70, wins: 10 }),
      makeTeam({ team: "LowRetention", returningSalaryPct: 0.40, wins: 6 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.bestRetention[0].team).toBe("HighRetention");
    expect(r.bestRetention[1].team).toBe("MedRetention");
  });
});

describe("computeRosterContinuity — Pearson correlation", () => {
  it("returns positive correlation for positive relationship", () => {
    const teams = [
      makeTeam({ team: "Team1", returningSalaryPct: 0.80, wins: 13 }),
      makeTeam({ team: "Team2", returningSalaryPct: 0.70, wins: 10 }),
      makeTeam({ team: "Team3", returningSalaryPct: 0.50, wins: 6 }),
      makeTeam({ team: "Team4", returningSalaryPct: 0.30, wins: 3 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.correlation).toBeGreaterThan(0.8);
  });

  it("handles perfect positive correlation", () => {
    const teams = [
      makeTeam({ team: "Team1", returningSalaryPct: 0.30, wins: 3 }),
      makeTeam({ team: "Team2", returningSalaryPct: 0.50, wins: 5 }),
      makeTeam({ team: "Team3", returningSalaryPct: 0.70, wins: 7 }),
      makeTeam({ team: "Team4", returningSalaryPct: 0.90, wins: 9 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.correlation).toBeCloseTo(1, 2);
  });

  it("returns zero correlation for no relationship", () => {
    const teams = [
      makeTeam({ team: "Team1", returningSalaryPct: 0.30, wins: 13 }),
      makeTeam({ team: "Team2", returningSalaryPct: 0.50, wins: 5 }),
      makeTeam({ team: "Team3", returningSalaryPct: 0.70, wins: 3 }),
      makeTeam({ team: "Team4", returningSalaryPct: 0.90, wins: 10 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(Math.abs(r.correlation)).toBeLessThan(0.5);
  });

  it("returns bounded value between -1 and 1", () => {
    const teams = Array.from({ length: 10 }, (_, i) =>
      makeTeam({
        team: `Team${i}`,
        returningSalaryPct: 0.3 + (i * 0.07),
        wins: 3 + (i * 1.2),
      })
    );
    const r = computeRosterContinuity(teams);
    expect(r.correlation).toBeGreaterThanOrEqual(-1);
    expect(r.correlation).toBeLessThanOrEqual(1);
  });

  it("handles single team (no variance)", () => {
    const teams = [makeTeam({ team: "Team1", returningSalaryPct: 0.65, wins: 10 })];
    const r = computeRosterContinuity(teams);
    expect(r.correlation).toBe(0);
  });
});

describe("computeRosterContinuity — multi-season tracking", () => {
  it("includes multiple seasons", () => {
    const teams = [
      makeTeam({ team: "Chiefs", season: 2023, wins: 11 }),
      makeTeam({ team: "Chiefs", season: 2024, wins: 12 }),
    ];
    const r = computeRosterContinuity(teams);
    expect(r.teamContinuity).toHaveLength(2);
  });
});
