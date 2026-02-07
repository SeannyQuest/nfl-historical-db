import { describe, it, expect } from "vitest";
import { computeTrapGames, type TrapGame } from "@/lib/trap-games";

function makeGame(overrides: Partial<TrapGame> = {}): TrapGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 15,
    spread: null,
    ...overrides,
  };
}

describe("computeTrapGames — empty input", () => {
  it("returns empty arrays for no games", () => {
    const r = computeTrapGames([]);
    expect(r.trapGames).toHaveLength(0);
    expect(r.trapGameFrequency).toHaveLength(0);
    expect(r.mostTrapped).toHaveLength(0);
    expect(r.bestTrappers).toHaveLength(0);
  });
});

describe("computeTrapGames — basic trap detection", () => {
  it("identifies trap game when home favorite loses", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -7.5, // Home team favored by 7.5
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(1);
    expect(r.trapGames[0].favorite).toBe("Chiefs");
    expect(r.trapGames[0].underdog).toBe("Texans");
  });

  it("identifies trap game when away favorite loses", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 25,
        awayScore: 20,
        spread: 7.5, // Away team favored by 7.5
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(1);
    expect(r.trapGames[0].favorite).toBe("Texans");
    expect(r.trapGames[0].underdog).toBe("Chiefs");
  });

  it("ignores games with spread < 7", () => {
    const games = [
      makeGame({
        homeScore: 20,
        awayScore: 25,
        spread: -5, // Only 5-point favorite, not a big favorite
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(0);
  });

  it("counts games with spread exactly 7", () => {
    const games = [
      makeGame({
        homeScore: 20,
        awayScore: 25,
        spread: -7, // Exactly 7 is a big favorite
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(1);
  });

  it("ignores games with null spread", () => {
    const games = [
      makeGame({
        homeScore: 20,
        awayScore: 25,
        spread: null,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(0);
  });
});

describe("computeTrapGames — trap game details", () => {
  it("records spread, scores, and margin", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -8,
      }),
    ];
    const r = computeTrapGames(games);
    const trap = r.trapGames[0];
    expect(trap.spread).toBe(8);
    expect(trap.favoriteScore).toBe(20);
    expect(trap.underdogScore).toBe(25);
    expect(trap.margin).toBe(5);
  });

  it("calculates margin correctly for away favorite upset", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 28,
        awayScore: 20,
        spread: 7.5,
      }),
    ];
    const r = computeTrapGames(games);
    const trap = r.trapGames[0];
    expect(trap.margin).toBe(8);
  });
});

describe("computeTrapGames — trap frequency", () => {
  it("counts trap games per season", () => {
    const games = [
      makeGame({
        season: 2024,
        week: 1,
        homeScore: 20,
        awayScore: 25,
        spread: -7, // Trap: home favorite loses
      }),
      makeGame({
        season: 2024,
        week: 2,
        homeScore: 30,
        awayScore: 20,
        spread: -7, // Not trap: home favorite wins
      }),
      makeGame({
        season: 2024,
        week: 3,
        homeScore: 25,
        awayScore: 30,
        spread: -7, // Trap: home favorite loses
      }),
    ];
    const r = computeTrapGames(games);
    const freq = r.trapGameFrequency.find((f) => f.season === 2024);
    expect(freq?.trapGames).toBe(2);
    expect(freq?.totalBigFavoriteGames).toBe(3);
  });

  it("calculates trap game percentage", () => {
    const games = [
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 30,
        awayScore: 20,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    const freq = r.trapGameFrequency.find((f) => f.season === 2024);
    expect(freq?.pct).toBe("66.7");
  });

  it("handles zero big favorite games in season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: 5, // Not a big favorite
      }),
    ];
    const r = computeTrapGames(games);
    const freq = r.trapGameFrequency.find((f) => f.season === 2024);
    // When no big favorites, the season won't have an entry in trapGameFrequency
    expect(freq).toBeUndefined();
  });
});

describe("computeTrapGames — most trapped teams", () => {
  it("tracks teams that lose most as big favorites", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 21,
        awayScore: 28,
        spread: -8,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 30,
        awayScore: 20,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    const trapped = r.mostTrapped.find((t) => t.team === "Chiefs");
    expect(trapped?.trapLosses).toBe(2);
    expect(trapped?.bigFavoriteGames).toBe(3);
  });

  it("sorts most trapped by losses descending", () => {
    const games = [
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Chiefs",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeTeamName: "Ravens",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.mostTrapped[0].team).toBe("Chiefs");
    expect(r.mostTrapped[0].trapLosses).toBe(2);
  });

  it("limits to top 10 teams", () => {
    const games: TrapGame[] = [];
    for (let i = 1; i <= 15; i++) {
      games.push(
        makeGame({
          season: 2024,
          week: i,
          homeTeamName: `Team${i}`,
          homeScore: 20,
          awayScore: 25,
          spread: -7,
        })
      );
    }
    const r = computeTrapGames(games);
    expect(r.mostTrapped.length).toBeLessThanOrEqual(10);
  });
});

describe("computeTrapGames — best trappers", () => {
  it("tracks underdogs beating big favorites", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 21,
        awayScore: 28,
        spread: -8,
      }),
    ];
    const r = computeTrapGames(games);
    const trapper = r.bestTrappers.find((t) => t.team === "Texans");
    expect(trapper?.trapWins).toBe(2);
  });

  it("sorts best trappers by wins descending", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        homeTeamName: "Ravens",
        awayTeamName: "Chargers",
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.bestTrappers[0].team).toBe("Texans");
    expect(r.bestTrappers[0].trapWins).toBe(2);
  });

  it("limits to top 10 teams", () => {
    const games: TrapGame[] = [];
    for (let i = 1; i <= 15; i++) {
      games.push(
        makeGame({
          season: 2024,
          week: i,
          awayTeamName: `Team${i}`,
          homeScore: 20,
          awayScore: 25,
          spread: -7,
        })
      );
    }
    const r = computeTrapGames(games);
    expect(r.bestTrappers.length).toBeLessThanOrEqual(10);
  });
});

describe("computeTrapGames — multi-season", () => {
  it("separates trap games by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGameFrequency).toHaveLength(2);
  });

  it("calculates per-season trap frequency", () => {
    const games = [
      makeGame({
        season: 2023,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2023,
        homeScore: 30,
        awayScore: 20,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 20,
        awayScore: 25,
        spread: -7,
      }),
      makeGame({
        season: 2024,
        homeScore: 30,
        awayScore: 20,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    const freq2023 = r.trapGameFrequency.find((f) => f.season === 2023);
    const freq2024 = r.trapGameFrequency.find((f) => f.season === 2024);
    expect(freq2023?.pct).toBe("50.0");
    expect(freq2024?.pct).toBe("66.7");
  });
});

describe("computeTrapGames — edge cases", () => {
  it("handles favorite with large margin", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 50,
        awayScore: 10,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(0);
  });

  it("handles equal scores (no favorite upset)", () => {
    const games = [
      makeGame({
        homeTeamName: "Chiefs",
        awayTeamName: "Texans",
        homeScore: 20,
        awayScore: 20,
        spread: -7,
      }),
    ];
    const r = computeTrapGames(games);
    expect(r.trapGames).toHaveLength(0);
  });
});
