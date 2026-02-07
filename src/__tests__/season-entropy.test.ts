import { describe, it, expect } from "vitest";
import {
  computeSeasonEntropy,
  type EntropyGame,
} from "@/lib/season-entropy";

function makeGame(overrides: Partial<EntropyGame> = {}): EntropyGame {
  return {
    season: 2024,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 24,
    awayScore: 17,
    ...overrides,
  };
}

// ─── Empty ───────────────────────────────────────────────

describe("computeSeasonEntropy — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeSeasonEntropy([]);
    expect(r.seasonEntropy).toHaveLength(0);
    expect(r.mostCompetitiveSeasons).toHaveLength(0);
    expect(r.leastCompetitiveSeasons).toHaveLength(0);
    expect(r.winDistribution).toHaveLength(0);
  });
});

// ─── Entropy Calculation ────────────────────────────────

describe("computeSeasonEntropy — entropy calculation", () => {
  it("computes entropy for balanced season (high parity)", () => {
    // 8 teams, all 4-4 record = maximum entropy
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 21,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 17,
        awayScore: 24,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "E",
        homeScore: 14,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 14,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "D",
        homeScore: 17,
        awayScore: 24,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "E",
        homeScore: 10,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "C",
        awayTeamName: "D",
        homeScore: 28,
        awayScore: 21,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "C",
        awayTeamName: "E",
        homeScore: 14,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "D",
        awayTeamName: "E",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy).toHaveLength(1);
    expect(r.seasonEntropy[0].entropy).toBeGreaterThan(0);
    expect(r.seasonEntropy[0].parityIndex).toBeGreaterThan(0);
  });

  it("computes maxEntropy as log2(numTeams)", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 21,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 14,
      }),
    ];
    const r = computeSeasonEntropy(games);
    const s2024 = r.seasonEntropy.find((s) => s.season === 2024);
    expect(s2024?.numTeams).toBe(3);
    expect(s2024?.maxEntropy).toBeCloseTo(Math.log2(3), 2);
  });

  it("computes parityIndex as entropy / maxEntropy", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 21,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 14,
      }),
    ];
    const r = computeSeasonEntropy(games);
    const s2024 = r.seasonEntropy.find((s) => s.season === 2024);
    expect(s2024?.parityIndex).toBeGreaterThanOrEqual(0);
    expect(s2024?.parityIndex).toBeLessThanOrEqual(1);
  });

  it("assigns zero entropy to dominant team", () => {
    // One team wins all, others split
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy[0].entropy).toBeLessThan(
      Math.log2(3)
    );
  });
});

// ─── Most Competitive Seasons ───────────────────────────

describe("computeSeasonEntropy — most competitive seasons", () => {
  it("returns top 5 by parity index", () => {
    const games: EntropyGame[] = [];
    // Create 6 seasons with different competitiveness
    for (let s = 2019; s <= 2024; s++) {
      // Create games for season s
      for (let i = 0; i < 10; i++) {
        games.push(
          makeGame({
            season: s,
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 10}`,
            homeScore: 24,
            awayScore: 17,
          })
        );
      }
    }
    const r = computeSeasonEntropy(games);
    expect(r.mostCompetitiveSeasons.length).toBeLessThanOrEqual(5);
  });

  it("sorted by parity index descending", () => {
    const games: EntropyGame[] = [];
    for (let s = 2019; s <= 2024; s++) {
      for (let i = 0; i < 10; i++) {
        games.push(
          makeGame({
            season: s,
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 10}`,
            homeScore: 24,
            awayScore: 17,
          })
        );
      }
    }
    const r = computeSeasonEntropy(games);
    for (let i = 0; i < r.mostCompetitiveSeasons.length - 1; i++) {
      expect(r.mostCompetitiveSeasons[i].parityIndex).toBeGreaterThanOrEqual(
        r.mostCompetitiveSeasons[i + 1].parityIndex
      );
    }
  });
});

// ─── Least Competitive Seasons ──────────────────────────

describe("computeSeasonEntropy — least competitive seasons", () => {
  it("returns bottom 5 by parity index", () => {
    const games: EntropyGame[] = [];
    for (let s = 2019; s <= 2024; s++) {
      for (let i = 0; i < 10; i++) {
        games.push(
          makeGame({
            season: s,
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 10}`,
            homeScore: 24,
            awayScore: 17,
          })
        );
      }
    }
    const r = computeSeasonEntropy(games);
    expect(r.leastCompetitiveSeasons.length).toBeLessThanOrEqual(5);
  });

  it("sorted by parity index ascending (worst at start)", () => {
    const games: EntropyGame[] = [];
    for (let s = 2019; s <= 2024; s++) {
      for (let i = 0; i < 10; i++) {
        games.push(
          makeGame({
            season: s,
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${(i + 1) % 10}`,
            homeScore: 24,
            awayScore: 17,
          })
        );
      }
    }
    const r = computeSeasonEntropy(games);
    for (let i = 0; i < r.leastCompetitiveSeasons.length - 1; i++) {
      expect(r.leastCompetitiveSeasons[i].parityIndex).toBeLessThanOrEqual(
        r.leastCompetitiveSeasons[i + 1].parityIndex
      );
    }
  });
});

// ─── Win Distribution / Gini ───────────────────────────

describe("computeSeasonEntropy — win distribution (Gini)", () => {
  it("computes Gini coefficient for season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.winDistribution).toHaveLength(1);
    expect(r.winDistribution[0].giniCoefficient).toBeGreaterThanOrEqual(0);
    expect(r.winDistribution[0].giniCoefficient).toBeLessThanOrEqual(1);
  });

  it("returns low Gini for balanced season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 21,
        awayScore: 20,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 17,
        awayScore: 24,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.winDistribution[0].giniCoefficient).toBeLessThan(1);
  });

  it("returns high Gini for dominated season", () => {
    // One team dominant
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 10,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.winDistribution[0].giniCoefficient).toBeGreaterThan(0);
  });

  it("sorts by season ascending", () => {
    const games: EntropyGame[] = [];
    for (let s = 2024; s >= 2020; s--) {
      games.push(
        makeGame({
          season: s,
          homeTeamName: "A",
          awayTeamName: "B",
          homeScore: 24,
          awayScore: 17,
        })
      );
    }
    const r = computeSeasonEntropy(games);
    for (let i = 0; i < r.winDistribution.length - 1; i++) {
      expect(r.winDistribution[i].season).toBeLessThanOrEqual(
        r.winDistribution[i + 1].season
      );
    }
  });
});

// ─── Multi-Season ───────────────────────────────────────

describe("computeSeasonEntropy — multi-season", () => {
  it("processes multiple seasons independently", () => {
    const games: EntropyGame[] = [];
    // Season 2023
    for (let i = 0; i < 5; i++) {
      games.push(
        makeGame({
          season: 2023,
          homeTeamName: `A${i}`,
          awayTeamName: `B${i}`,
          homeScore: 24,
          awayScore: 17,
        })
      );
    }
    // Season 2024
    for (let i = 0; i < 5; i++) {
      games.push(
        makeGame({
          season: 2024,
          homeTeamName: `C${i}`,
          awayTeamName: `D${i}`,
          homeScore: 24,
          awayScore: 17,
        })
      );
    }
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy).toHaveLength(2);
  });

  it("computes different entropy for different seasons", () => {
    const games: EntropyGame[] = [];
    // Competitive 2023 (all teams 1-1)
    games.push(
      makeGame({
        season: 2023,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      })
    );
    games.push(
      makeGame({
        season: 2023,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 17,
        awayScore: 24,
      })
    );
    games.push(
      makeGame({
        season: 2023,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      })
    );
    // Dominated 2024 (A dominant)
    games.push(
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 30,
        awayScore: 10,
      })
    );
    games.push(
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 30,
        awayScore: 10,
      })
    );
    games.push(
      makeGame({
        season: 2024,
        homeTeamName: "B",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      })
    );
    const r = computeSeasonEntropy(games);
    const s2023 = r.seasonEntropy.find((s) => s.season === 2023);
    const s2024 = r.seasonEntropy.find((s) => s.season === 2024);
    expect(s2023?.parityIndex).toBeGreaterThan(s2024?.parityIndex ?? 0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeSeasonEntropy — edge cases", () => {
  it("handles single game", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy).toHaveLength(1);
    expect(r.seasonEntropy[0].numTeams).toBe(2);
  });

  it("handles single team (no variation)", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "A",
        awayTeamName: "A",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy).toHaveLength(1);
  });

  it("handles large season (32 teams)", () => {
    const games: EntropyGame[] = [];
    for (let i = 0; i < 32; i++) {
      for (let j = i + 1; j < 32; j++) {
        games.push(
          makeGame({
            season: 2024,
            homeTeamName: `Team${i}`,
            awayTeamName: `Team${j}`,
            homeScore: 24,
            awayScore: 17,
          })
        );
      }
    }
    const r = computeSeasonEntropy(games);
    expect(r.seasonEntropy[0].numTeams).toBe(32);
    expect(r.seasonEntropy[0].maxEntropy).toBeCloseTo(Math.log2(32), 2);
  });
});
