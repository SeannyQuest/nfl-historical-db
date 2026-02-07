import { describe, it, expect } from "vitest";
import { computeTeamStats, type GameForStats } from "@/lib/team-stats";

// ─── Helpers ────────────────────────────────────────────

function makeGame(overrides: Partial<GameForStats> = {}): GameForStats {
  return {
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Baltimore Ravens",
    homeScore: 27,
    awayScore: 20,
    winnerName: "Kansas City Chiefs",
    season: 2024,
    isPlayoff: false,
    spreadResult: "COVERED",
    ouResult: "OVER",
    spread: -3.5,
    overUnder: 47.5,
    ...overrides,
  };
}

const TEAM = "Kansas City Chiefs";
const OPP = "Baltimore Ravens";

// ─── All-time Record ────────────────────────────────────

describe("computeTeamStats — all-time record", () => {
  it("returns zeroes for empty games", () => {
    const result = computeTeamStats([], TEAM);
    expect(result.allTime).toEqual({ wins: 0, losses: 0, ties: 0, pct: ".000" });
  });

  it("counts a home win", () => {
    const result = computeTeamStats([makeGame()], TEAM);
    expect(result.allTime).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
  });

  it("counts a home loss", () => {
    const game = makeGame({ homeScore: 10, awayScore: 24, winnerName: OPP });
    const result = computeTeamStats([game], TEAM);
    expect(result.allTime).toEqual({ wins: 0, losses: 1, ties: 0, pct: "0.000" });
  });

  it("counts a tie", () => {
    const game = makeGame({ homeScore: 20, awayScore: 20, winnerName: null });
    const result = computeTeamStats([game], TEAM);
    expect(result.allTime).toEqual({ wins: 0, losses: 0, ties: 1, pct: "0.000" });
  });

  it("counts an away win", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      homeScore: 14,
      awayScore: 28,
      winnerName: TEAM,
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.allTime).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
  });

  it("counts an away loss", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      homeScore: 31,
      awayScore: 17,
      winnerName: OPP,
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.allTime).toEqual({ wins: 0, losses: 1, ties: 0, pct: "0.000" });
  });

  it("computes correct win pct for mixed results", () => {
    const games = [
      makeGame({ winnerName: TEAM }),
      makeGame({ winnerName: TEAM }),
      makeGame({ homeScore: 10, awayScore: 24, winnerName: OPP }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.allTime.wins).toBe(2);
    expect(result.allTime.losses).toBe(1);
    expect(result.allTime.pct).toBe("0.667");
  });
});

// ─── Home / Away Record ─────────────────────────────────

describe("computeTeamStats — home/away splits", () => {
  it("tracks home record separately", () => {
    const games = [
      makeGame({ winnerName: TEAM }), // home win
      makeGame({
        homeTeamName: OPP,
        awayTeamName: TEAM,
        homeScore: 30,
        awayScore: 20,
        winnerName: OPP,
      }), // away loss
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.homeRecord).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
    expect(result.awayRecord).toEqual({ wins: 0, losses: 1, ties: 0, pct: "0.000" });
  });

  it("tracks away win correctly", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      homeScore: 10,
      awayScore: 35,
      winnerName: TEAM,
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.awayRecord).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });
    expect(result.homeRecord).toEqual({ wins: 0, losses: 0, ties: 0, pct: ".000" });
  });
});

// ─── Playoff Record ─────────────────────────────────────

describe("computeTeamStats — playoff record", () => {
  it("only counts playoff games in playoff record", () => {
    const games = [
      makeGame({ winnerName: TEAM, isPlayoff: false }),
      makeGame({ winnerName: TEAM, isPlayoff: true }),
      makeGame({ homeScore: 10, awayScore: 24, winnerName: OPP, isPlayoff: true }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.playoffRecord).toEqual({ wins: 1, losses: 1, ties: 0, pct: "0.500" });
  });

  it("returns zeroes for no playoff games", () => {
    const result = computeTeamStats([makeGame()], TEAM);
    expect(result.playoffRecord).toEqual({ wins: 0, losses: 0, ties: 0, pct: ".000" });
  });
});

// ─── ATS Record ─────────────────────────────────────────

describe("computeTeamStats — ATS record", () => {
  it("counts home team COVERED as covered", () => {
    const result = computeTeamStats([makeGame({ spreadResult: "COVERED" })], TEAM);
    expect(result.ats.covered).toBe(1);
    expect(result.ats.lost).toBe(0);
  });

  it("counts home team LOST as lost", () => {
    const result = computeTeamStats([makeGame({ spreadResult: "LOST" })], TEAM);
    expect(result.ats.covered).toBe(0);
    expect(result.ats.lost).toBe(1);
  });

  it("counts home team PUSH as push", () => {
    const result = computeTeamStats([makeGame({ spreadResult: "PUSH" })], TEAM);
    expect(result.ats.push).toBe(1);
  });

  it("flips perspective for away team — home COVERED means away LOST", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      spreadResult: "COVERED",
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.ats.covered).toBe(0);
    expect(result.ats.lost).toBe(1);
  });

  it("flips perspective for away team — home LOST means away COVERED", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      spreadResult: "LOST",
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.ats.covered).toBe(1);
    expect(result.ats.lost).toBe(0);
  });

  it("skips games without spread result", () => {
    const result = computeTeamStats([makeGame({ spreadResult: null })], TEAM);
    expect(result.ats.total).toBe(0);
  });

  it("computes cover pct correctly", () => {
    const games = [
      makeGame({ spreadResult: "COVERED" }),
      makeGame({ spreadResult: "COVERED" }),
      makeGame({ spreadResult: "LOST" }),
      makeGame({ spreadResult: "PUSH" }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.ats.covered).toBe(2);
    expect(result.ats.lost).toBe(1);
    expect(result.ats.push).toBe(1);
    expect(result.ats.total).toBe(4);
    expect(result.ats.coverPct).toBe("0.500");
  });
});

// ─── O/U Record ─────────────────────────────────────────

describe("computeTeamStats — O/U record", () => {
  it("counts OVER correctly", () => {
    const result = computeTeamStats([makeGame({ ouResult: "OVER" })], TEAM);
    expect(result.ou.over).toBe(1);
    expect(result.ou.under).toBe(0);
  });

  it("counts UNDER correctly", () => {
    const result = computeTeamStats([makeGame({ ouResult: "UNDER" })], TEAM);
    expect(result.ou.under).toBe(1);
  });

  it("counts O/U PUSH correctly", () => {
    const result = computeTeamStats([makeGame({ ouResult: "PUSH" })], TEAM);
    expect(result.ou.push).toBe(1);
  });

  it("skips games without O/U result", () => {
    const result = computeTeamStats([makeGame({ ouResult: null })], TEAM);
    expect(result.ou.total).toBe(0);
  });
});

// ─── Points For / Against ───────────────────────────────

describe("computeTeamStats — scoring averages", () => {
  it("computes avg points for and against (home)", () => {
    const games = [
      makeGame({ homeScore: 30, awayScore: 10 }),
      makeGame({ homeScore: 20, awayScore: 14 }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.avgPointsFor).toBe("25.0");
    expect(result.avgPointsAgainst).toBe("12.0");
  });

  it("flips scoring for away games", () => {
    const game = makeGame({
      homeTeamName: OPP,
      awayTeamName: TEAM,
      homeScore: 10,
      awayScore: 28,
      winnerName: TEAM,
    });
    const result = computeTeamStats([game], TEAM);
    expect(result.avgPointsFor).toBe("28.0");
    expect(result.avgPointsAgainst).toBe("10.0");
  });

  it("returns 0.0 for no games", () => {
    const result = computeTeamStats([], TEAM);
    expect(result.avgPointsFor).toBe("0.0");
    expect(result.avgPointsAgainst).toBe("0.0");
  });
});

// ─── Season Breakdown ───────────────────────────────────

describe("computeTeamStats — season breakdown", () => {
  it("groups games by season", () => {
    const games = [
      makeGame({ season: 2024, winnerName: TEAM }),
      makeGame({ season: 2024, winnerName: TEAM }),
      makeGame({ season: 2023, homeScore: 10, awayScore: 24, winnerName: OPP }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.seasons).toHaveLength(2);
  });

  it("sorts seasons descending (most recent first)", () => {
    const games = [
      makeGame({ season: 2020 }),
      makeGame({ season: 2024 }),
      makeGame({ season: 2022 }),
    ];
    const result = computeTeamStats(games, TEAM);
    expect(result.seasons.map((s) => s.season)).toEqual([2024, 2022, 2020]);
  });

  it("computes per-season record", () => {
    const games = [
      makeGame({ season: 2024, winnerName: TEAM }),
      makeGame({ season: 2024, homeScore: 10, awayScore: 24, winnerName: OPP }),
      makeGame({ season: 2024, homeScore: 17, awayScore: 17, winnerName: null }),
    ];
    const result = computeTeamStats(games, TEAM);
    const s2024 = result.seasons.find((s) => s.season === 2024)!;
    expect(s2024.record).toEqual({ wins: 1, losses: 1, ties: 1, pct: "0.333" });
  });

  it("computes per-season ATS with perspective flip", () => {
    const games = [
      makeGame({ season: 2024, spreadResult: "COVERED" }), // home covered
      makeGame({
        season: 2024,
        homeTeamName: OPP,
        awayTeamName: TEAM,
        spreadResult: "COVERED", // home covered → away LOST
      }),
    ];
    const result = computeTeamStats(games, TEAM);
    const s2024 = result.seasons.find((s) => s.season === 2024)!;
    expect(s2024.ats.covered).toBe(1);
    expect(s2024.ats.lost).toBe(1);
  });

  it("tracks per-season points", () => {
    const games = [
      makeGame({ season: 2024, homeScore: 30, awayScore: 10 }),
      makeGame({ season: 2024, homeScore: 24, awayScore: 14 }),
    ];
    const result = computeTeamStats(games, TEAM);
    const s2024 = result.seasons.find((s) => s.season === 2024)!;
    expect(s2024.pointsFor).toBe(54);
    expect(s2024.pointsAgainst).toBe(24);
  });
});

// ─── Integration ────────────────────────────────────────

describe("computeTeamStats — full integration", () => {
  it("handles a realistic multi-game dataset", () => {
    const games: GameForStats[] = [
      // 2024 home win, covered
      makeGame({ season: 2024, homeScore: 27, awayScore: 20, winnerName: TEAM, spreadResult: "COVERED", ouResult: "UNDER" }),
      // 2024 home loss, lost spread
      makeGame({ season: 2024, homeScore: 17, awayScore: 24, winnerName: OPP, spreadResult: "LOST", ouResult: "OVER" }),
      // 2024 away win, home team lost spread (so KC covered)
      makeGame({ season: 2024, homeTeamName: OPP, awayTeamName: TEAM, homeScore: 14, awayScore: 31, winnerName: TEAM, spreadResult: "LOST", ouResult: "OVER" }),
      // 2023 home win, playoff
      makeGame({ season: 2023, homeScore: 27, awayScore: 24, winnerName: TEAM, isPlayoff: true, spreadResult: "COVERED", ouResult: "OVER" }),
      // 2023 away loss, no spread data
      makeGame({ season: 2023, homeTeamName: OPP, awayTeamName: TEAM, homeScore: 28, awayScore: 14, winnerName: OPP, spreadResult: null, ouResult: null }),
    ];

    const result = computeTeamStats(games, TEAM);

    // All-time: 3W-2L-0T
    expect(result.allTime).toEqual({ wins: 3, losses: 2, ties: 0, pct: "0.600" });

    // Home: 2W-1L (games 1,2,4)
    expect(result.homeRecord).toEqual({ wins: 2, losses: 1, ties: 0, pct: "0.667" });

    // Away: 1W-1L (games 3,5)
    expect(result.awayRecord).toEqual({ wins: 1, losses: 1, ties: 0, pct: "0.500" });

    // Playoff: 1W-0L (game 4)
    expect(result.playoffRecord).toEqual({ wins: 1, losses: 0, ties: 0, pct: "1.000" });

    // ATS: KC covered in games 1 (home COVERED), 3 (away, home LOST → KC covered), 4 (home COVERED) = 3
    //       KC lost in game 2 (home LOST) = 1
    //       Game 5 skipped (null)
    expect(result.ats.covered).toBe(3);
    expect(result.ats.lost).toBe(1);
    expect(result.ats.total).toBe(4);

    // O/U: UNDER=1, OVER=3, null=1 → total=4
    expect(result.ou.over).toBe(3);
    expect(result.ou.under).toBe(1);
    expect(result.ou.total).toBe(4);

    // Seasons: 2024 first (descending)
    expect(result.seasons).toHaveLength(2);
    expect(result.seasons[0].season).toBe(2024);
    expect(result.seasons[1].season).toBe(2023);
  });
});
