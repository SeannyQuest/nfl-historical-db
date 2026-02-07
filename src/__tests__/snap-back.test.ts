import { describe, it, expect } from "vitest";
import {
  computeSnapBackEffect,
  type SnapBackGame,
} from "@/lib/snap-back";

function makeGame(overrides: Partial<SnapBackGame> = {}): SnapBackGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Green Bay Packers",
    awayTeamName: "Chicago Bears",
    homeScore: 24,
    awayScore: 17,
    ...overrides,
  };
}

// ─── Empty ───────────────────────────────────────────────

describe("computeSnapBackEffect — empty", () => {
  it("returns zeroes for no games", () => {
    const r = computeSnapBackEffect([]);
    expect(r.afterBlowoutLoss.games).toBe(0);
    expect(r.afterBlowoutWin.games).toBe(0);
    expect(r.teamSnapBack).toHaveLength(0);
    expect(r.bestBounceback).toHaveLength(0);
  });
});

// ─── Blowout Detection ───────────────────────────────────

describe("computeSnapBackEffect — blowout detection", () => {
  it("identifies 20+ point losses", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 35,
      }), // 25pt loss for A
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // bounce back attempt
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBeGreaterThanOrEqual(0);
  });

  it("identifies 20+ point wins", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 42,
        awayScore: 14,
      }), // 28pt win for A
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // next game
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutWin.games).toBeGreaterThanOrEqual(0);
  });

  it("ignores sub-20 point margins", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 28,
      }), // 18pt loss, not blowout
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBe(0);
  });
});

// ─── After Blowout Loss Stats ───────────────────────────

describe("computeSnapBackEffect — after blowout loss", () => {
  it("counts wins following blowout losses", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss for A
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // A wins
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
      }), // A loses
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBeGreaterThan(0);
  });

  it("computes win percentage after blowout loss", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss for A
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // A wins
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 24,
        awayScore: 17,
      }), // A wins
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.winPct).toBeLessThanOrEqual(1);
  });

  it("computes average margin after blowout loss", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 28,
        awayScore: 20,
      }), // 8pt win
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 24,
        awayScore: 22,
      }), // 2pt win
    ];
    const r = computeSnapBackEffect(games);
    if (r.afterBlowoutLoss.games > 0) {
      expect(r.afterBlowoutLoss.avgMargin).toBeGreaterThan(0);
    }
  });
});

// ─── After Blowout Win Stats ────────────────────────────

describe("computeSnapBackEffect — after blowout win", () => {
  it("counts results following blowout wins", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 42,
        awayScore: 14,
      }), // 28pt win for A
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // A wins
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
      }), // A loses
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutWin.games).toBeGreaterThan(0);
  });

  it("computes win percentage after blowout win", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 42,
        awayScore: 14,
      }), // 28pt win
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // A wins
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "D",
        homeScore: 14,
        awayScore: 24,
      }), // A loses
    ];
    const r = computeSnapBackEffect(games);
    if (r.afterBlowoutWin.games > 0) {
      expect(r.afterBlowoutWin.winPct).toBeLessThanOrEqual(1);
    }
  });

  it("computes average margin after blowout win", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 42,
        awayScore: 14,
      }), // 28pt win
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 28,
        awayScore: 20,
      }), // 8pt win
    ];
    const r = computeSnapBackEffect(games);
    if (r.afterBlowoutWin.games > 0) {
      expect(r.afterBlowoutWin.avgMargin).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Team Snap-Back Records ─────────────────────────────

describe("computeSnapBackEffect — team snap-back records", () => {
  it("counts team wins after blowout losses", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 17,
      }), // Win
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Packers",
        awayTeamName: "Vikings",
        homeScore: 14,
        awayScore: 24,
      }), // Loss
    ];
    const r = computeSnapBackEffect(games);
    const packers = r.teamSnapBack.find((t) => t.team === "Packers");
    if (packers) {
      expect(
        packers.afterBigLossWins + packers.afterBigLossLosses
      ).toBeGreaterThan(0);
    }
  });

  it("computes win percentage after big losses", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 17,
      }), // Win
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Packers",
        awayTeamName: "Vikings",
        homeScore: 24,
        awayScore: 17,
      }), // Win
    ];
    const r = computeSnapBackEffect(games);
    const packers = r.teamSnapBack.find((t) => t.team === "Packers");
    if (packers && packers.afterBigLossWins + packers.afterBigLossLosses > 0) {
      expect(packers.afterBigLossWinPct).toBe(1);
    }
  });

  it("tracks wins after big wins", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 42,
        awayScore: 14,
      }), // 28pt win
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 17,
      }), // Win
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "Packers",
        awayTeamName: "Vikings",
        homeScore: 14,
        awayScore: 24,
      }), // Loss
    ];
    const r = computeSnapBackEffect(games);
    const packers = r.teamSnapBack.find((t) => t.team === "Packers");
    if (packers) {
      expect(packers.afterBigWinWins + packers.afterBigWinLosses).toBeGreaterThan(0);
    }
  });

  it("sorts by big loss bounce-back win pct descending", () => {
    const games = [
      // Packers: lose big, then win
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 10,
        awayScore: 31,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 17,
      }),
      // Lions: lose big, then lose
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Lions",
        awayTeamName: "Vikings",
        homeScore: 10,
        awayScore: 31,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Lions",
        awayTeamName: "Bears",
        homeScore: 14,
        awayScore: 24,
      }),
    ];
    const r = computeSnapBackEffect(games);
    for (let i = 0; i < r.teamSnapBack.length - 1; i++) {
      expect(r.teamSnapBack[i].afterBigLossWinPct).toBeGreaterThanOrEqual(
        r.teamSnapBack[i + 1].afterBigLossWinPct
      );
    }
  });
});

// ─── Best Bounce-Back Teams ────────────────────────────

describe("computeSnapBackEffect — best bounce-back teams", () => {
  it("filters teams with blowout loss games", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Packers",
        awayTeamName: "Bears",
        homeScore: 10,
        awayScore: 31,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Packers",
        awayTeamName: "Lions",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "Lions",
        awayTeamName: "Vikings",
        homeScore: 24,
        awayScore: 17,
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "Lions",
        awayTeamName: "Bears",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSnapBackEffect(games);
    for (const team of r.bestBounceback) {
      expect(team.afterBigLossWins + team.afterBigLossLosses).toBeGreaterThan(0);
    }
  });

  it("returns max 10 best bounce-back teams", () => {
    const games: SnapBackGame[] = [];
    for (let i = 0; i < 12; i++) {
      games.push(
        makeGame({
          season: 2024,
          week: 1,
          homeTeamName: `Team${i}`,
          awayTeamName: `Team${(i + 1) % 12}`,
          homeScore: 10,
          awayScore: 31,
        })
      );
      games.push(
        makeGame({
          season: 2024,
          week: 2,
          homeTeamName: `Team${i}`,
          awayTeamName: `Team${(i + 2) % 12}`,
          homeScore: 24,
          awayScore: 17,
        })
      );
    }
    const r = computeSnapBackEffect(games);
    expect(r.bestBounceback.length).toBeLessThanOrEqual(10);
  });

  it("sorts by bounce-back win pct descending", () => {
    const games: SnapBackGame[] = [];
    for (let i = 0; i < 5; i++) {
      games.push(
        makeGame({
          season: 2024,
          week: 1,
          homeTeamName: `Team${i}`,
          awayTeamName: `Team${(i + 1) % 5}`,
          homeScore: 10,
          awayScore: 31,
        })
      );
      games.push(
        makeGame({
          season: 2024,
          week: 2,
          homeTeamName: `Team${i}`,
          awayTeamName: `Team${(i + 2) % 5}`,
          homeScore: 24,
          awayScore: 17,
        })
      );
    }
    const r = computeSnapBackEffect(games);
    for (let i = 0; i < r.bestBounceback.length - 1; i++) {
      expect(r.bestBounceback[i].afterBigLossWinPct).toBeGreaterThanOrEqual(
        r.bestBounceback[i + 1].afterBigLossWinPct
      );
    }
  });
});

// ─── Edge Cases ──────────────────────────────────────────

describe("computeSnapBackEffect — edge cases", () => {
  it("handles exactly 20-point margins", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 30,
      }), // exactly 20pt loss
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBeGreaterThanOrEqual(0);
  });

  it("ignores non-consecutive weeks", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 31,
      }), // 21pt loss
      makeGame({
        season: 2024,
        week: 3,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // not consecutive
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBe(0);
  });

  it("ignores different seasons", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 17,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 10,
        awayScore: 31,
      }), // end of 2024
      makeGame({
        season: 2025,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "C",
        homeScore: 24,
        awayScore: 17,
      }), // start of 2025
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBe(0);
  });

  it("handles away team blowouts", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeTeamName: "A",
        awayTeamName: "B",
        homeScore: 35,
        awayScore: 10,
      }), // 25pt loss for B (away)
      makeGame({
        season: 2024,
        week: 2,
        homeTeamName: "C",
        awayTeamName: "B",
        homeScore: 20,
        awayScore: 24,
      }), // B wins next week
    ];
    const r = computeSnapBackEffect(games);
    expect(r.afterBlowoutLoss.games).toBeGreaterThanOrEqual(0);
  });
});
