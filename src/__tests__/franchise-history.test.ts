import { describe, it, expect } from "vitest";
import { computeFranchiseHistory, type FranchiseGame, type Team } from "@/lib/franchise-history";

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: "1",
    name: "Green Bay Packers",
    abbreviation: "GB",
    city: "Green Bay",
    nickname: "Packers",
    conference: "NFC",
    division: "North",
    franchiseKey: "GB",
    isActive: true,
    ...overrides,
  };
}

function makeGame(overrides: Partial<FranchiseGame> = {}): FranchiseGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    homeTeamFranchiseKey: "GB",
    awayTeamName: "Chicago Bears",
    awayTeamFranchiseKey: "CHI",
    homeScore: 27,
    awayScore: 20,
    isPlayoff: false,
    isSuperBowl: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeFranchiseHistory — empty", () => {
  it("returns zero franchises for no games", () => {
    const r = computeFranchiseHistory([], []);
    expect(r.totalFranchises).toBe(0);
    expect(r.franchises).toHaveLength(0);
  });

  it("returns zero franchises with games but no teams", () => {
    const games = [makeGame()];
    const r = computeFranchiseHistory(games, []);
    expect(r.totalFranchises).toBe(0);
    expect(r.franchises).toHaveLength(0);
  });
});

// ─── Franchise Aggregation ──────────────────────────────

describe("computeFranchiseHistory — franchise aggregation", () => {
  it("aggregates all team names for franchise", () => {
    const teams = [
      makeTeam({ name: "Oakland Raiders", abbreviation: "OAK", franchiseKey: "LV" }),
      makeTeam({ name: "Los Angeles Raiders", abbreviation: "LA", franchiseKey: "LV" }),
      makeTeam({ name: "Las Vegas Raiders", abbreviation: "LV", franchiseKey: "LV" }),
    ];
    const games = [
      makeGame({ homeTeamFranchiseKey: "LV", homeTeamName: "Oakland Raiders", awayTeamFranchiseKey: "CHI" }),
      makeGame({ homeTeamFranchiseKey: "LV", homeTeamName: "Los Angeles Raiders", awayTeamFranchiseKey: "CHI" }),
      makeGame({ homeTeamFranchiseKey: "LV", homeTeamName: "Las Vegas Raiders", awayTeamFranchiseKey: "CHI" }),
    ];
    const r = computeFranchiseHistory(games, teams);
    const lv = r.franchises.find((f) => f.franchiseKey === "LV");
    expect(lv?.allNames).toContain("Oakland Raiders");
    expect(lv?.allNames).toContain("Los Angeles Raiders");
    expect(lv?.allNames).toContain("Las Vegas Raiders");
  });

  it("counts total franchises", () => {
    const teams = [
      makeTeam({ franchiseKey: "GB" }),
      makeTeam({ name: "Chicago Bears", franchiseKey: "CHI" }),
      makeTeam({ name: "Detroit Lions", franchiseKey: "DET" }),
    ];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", awayTeamFranchiseKey: "CHI" }),
      makeGame({ homeTeamFranchiseKey: "DET", awayTeamFranchiseKey: "GB" }),
    ];
    const r = computeFranchiseHistory(games, teams);
    expect(r.totalFranchises).toBe(3);
  });
});

// ─── Cumulative Records ──────────────────────────────────

describe("computeFranchiseHistory — cumulative records", () => {
  it("computes total wins", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 22 }), // win
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // loss
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.totalWins).toBe(2);
  });

  it("computes total losses", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // loss
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 10, awayScore: 25 }), // loss
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.totalLosses).toBe(2);
  });

  it("computes total ties", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 20 }), // tie
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 25 }), // tie
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.totalTies).toBe(2);
  });

  it("computes win pct", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // loss
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 10, awayScore: 25 }), // loss
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.winPct).toBe("50.0%");
  });
});

// ─── Season Records ─────────────────────────────────────

describe("computeFranchiseHistory — season records", () => {
  it("groups records by season", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }),
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 22 }),
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 30, awayScore: 10 }),
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.seasonRecords).toHaveLength(2);
    expect(gb?.seasonRecords[0].season).toBe(2024);
    expect(gb?.seasonRecords[1].season).toBe(2023);
  });

  it("computes season win/loss/tie counts", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // win
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 22 }), // win
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // loss
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    const season2024 = gb?.seasonRecords.find((s) => s.season === 2024);
    expect(season2024?.wins).toBe(2);
    expect(season2024?.losses).toBe(1);
    expect(season2024?.ties).toBe(0);
  });
});

// ─── Best/Worst Seasons ─────────────────────────────────

describe("computeFranchiseHistory — best/worst seasons", () => {
  it("identifies best season by win pct", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // 1-0
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // 1-0
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 22 }), // 2-0
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // 2-1
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.bestSeason?.season).toBe(2024);
    expect(gb?.bestSeason?.wins).toBe(1);
  });

  it("identifies worst season by win pct", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ season: 2024, homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // 1-0
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 20, awayScore: 24 }), // 0-1
      makeGame({ season: 2023, homeTeamFranchiseKey: "GB", homeScore: 10, awayScore: 25 }), // 0-2
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.worstSeason?.season).toBe(2023);
    expect(gb?.worstSeason?.losses).toBe(2);
  });
});

// ─── Super Bowl History ──────────────────────────────────

describe("computeFranchiseHistory — Super Bowl history", () => {
  it("counts Super Bowl wins", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ isSuperBowl: true, homeTeamFranchiseKey: "GB", homeScore: 35, awayScore: 10 }), // win
      makeGame({ isSuperBowl: true, homeTeamFranchiseKey: "GB", homeScore: 24, awayScore: 20 }), // win
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.superBowlWins).toBe(2);
  });

  it("counts Super Bowl appearances", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ isSuperBowl: true, homeTeamFranchiseKey: "GB", homeScore: 35, awayScore: 10 }), // win
      makeGame({ isSuperBowl: true, homeTeamFranchiseKey: "GB", homeScore: 10, awayScore: 20 }), // loss
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.superBowlAppearances).toBe(2);
  });

  it("counts Super Bowl wins for away team", () => {
    const teams = [makeTeam({ franchiseKey: "GB" })];
    const games = [
      makeGame({ isSuperBowl: true, awayTeamFranchiseKey: "GB", homeScore: 20, awayScore: 31 }), // away win
    ];
    const r = computeFranchiseHistory(games, teams);
    const gb = r.franchises.find((f) => f.franchiseKey === "GB");
    expect(gb?.superBowlWins).toBe(1);
  });
});

// ─── Sorting ─────────────────────────────────────────────

describe("computeFranchiseHistory — sorting", () => {
  it("sorts franchises by total wins descending", () => {
    const teams = [
      makeTeam({ franchiseKey: "GB" }),
      makeTeam({ name: "Chicago Bears", franchiseKey: "CHI" }),
    ];
    const games = [
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 27, awayScore: 20 }), // GB +1
      makeGame({ homeTeamFranchiseKey: "GB", homeScore: 25, awayScore: 22 }), // GB +2
      makeGame({ homeTeamFranchiseKey: "CHI", homeScore: 24, awayScore: 20 }), // CHI +1
    ];
    const r = computeFranchiseHistory(games, teams);
    expect(r.franchises[0].franchiseKey).toBe("GB");
    expect(r.franchises[0].totalWins).toBe(2);
    expect(r.franchises[1].franchiseKey).toBe("CHI");
    expect(r.franchises[1].totalWins).toBe(1);
  });
});
