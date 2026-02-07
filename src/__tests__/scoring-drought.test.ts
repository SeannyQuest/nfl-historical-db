import { describe, it, expect } from "vitest";
import { computeScoringDroughts, type DroughtGame } from "@/lib/scoring-drought";

function makeGame(overrides: Partial<DroughtGame> = {}): DroughtGame {
  return {
    season: 2024,
    week: 1,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 15,
    ...overrides,
  };
}

describe("computeScoringDroughts — empty input", () => {
  it("returns empty arrays for no games", () => {
    const r = computeScoringDroughts([]);
    expect(r.teamDroughts).toHaveLength(0);
    expect(r.worstDroughts).toHaveLength(0);
    expect(r.shutoutFrequency).toHaveLength(0);
  });
});

describe("computeScoringDroughts — basic drought detection", () => {
  it("detects single game drought (< 14 points)", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const chiefs = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    expect(chiefs).toBeDefined();
    expect(chiefs?.longestDrought).toBe(1);
  });

  it("detects multi-game drought", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 13, awayScore: 24 }),
      makeGame({ week: 3, homeScore: 12, awayScore: 22 }),
      makeGame({ week: 4, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const chiefs = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    expect(chiefs?.longestDrought).toBe(3);
  });

  it("tracks multiple separate droughts for same team", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 13, awayScore: 24 }),
      makeGame({ week: 3, homeScore: 20, awayScore: 15 }),
      makeGame({ week: 4, homeScore: 11, awayScore: 25 }),
      makeGame({ week: 5, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const chiefs = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    expect(chiefs?.droughtGames.length).toBe(2);
  });
});

describe("computeScoringDroughts — drought tracking", () => {
  it("tracks week range for drought", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 13, awayScore: 24 }),
      makeGame({ week: 3, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const chiefs = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    const drought = chiefs?.droughtGames[0];
    expect(drought?.fromWeek).toBe(1);
    expect(drought?.toWeek).toBe(2);
    expect(drought?.gamesCount).toBe(2);
  });

  it("ends drought when team scores >= 14", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 13, awayScore: 24 }),
      makeGame({ week: 3, homeScore: 14, awayScore: 15 }), // Exactly 14 ends it
      makeGame({ week: 4, homeScore: 11, awayScore: 25 }), // New drought
    ];
    const r = computeScoringDroughts(games);
    const chiefs = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    expect(chiefs?.droughtGames.length).toBe(2);
    expect(chiefs?.droughtGames[0].gamesCount).toBe(2);
    expect(chiefs?.droughtGames[1].gamesCount).toBe(1);
  });
});

describe("computeScoringDroughts — away team droughts", () => {
  it("detects away team droughts independently", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 10 }),
      makeGame({ week: 2, homeScore: 24, awayScore: 13 }),
      makeGame({ week: 3, homeScore: 15, awayScore: 20 }),
    ];
    const r = computeScoringDroughts(games);
    const texans = r.teamDroughts.find(
      (t) => t.team === "Houston Texans" && t.season === 2024
    );
    expect(texans?.longestDrought).toBe(2);
  });

  it("tracks away team drought week ranges", () => {
    const games = [
      makeGame({ week: 1, homeScore: 25, awayScore: 10 }),
      makeGame({ week: 2, homeScore: 24, awayScore: 13 }),
      makeGame({ week: 3, homeScore: 15, awayScore: 20 }),
    ];
    const r = computeScoringDroughts(games);
    const texans = r.teamDroughts.find(
      (t) => t.team === "Houston Texans" && t.season === 2024
    );
    const drought = texans?.droughtGames[0];
    expect(drought?.fromWeek).toBe(1);
    expect(drought?.toWeek).toBe(2);
  });
});

describe("computeScoringDroughts — shutout tracking", () => {
  it("detects home team shutout (0 points)", () => {
    const games = [makeGame({ week: 1, homeScore: 0, awayScore: 20 })];
    const r = computeScoringDroughts(games);
    const freq = r.shutoutFrequency.find((f) => f.season === 2024);
    expect(freq?.shutouts).toBe(1);
  });

  it("detects away team shutout (0 points)", () => {
    const games = [makeGame({ week: 1, homeScore: 20, awayScore: 0 })];
    const r = computeScoringDroughts(games);
    const freq = r.shutoutFrequency.find((f) => f.season === 2024);
    expect(freq?.shutouts).toBe(1);
  });

  it("calculates shutout percentage", () => {
    const games = [
      makeGame({ week: 1, homeScore: 0, awayScore: 20 }),
      makeGame({ week: 2, homeScore: 20, awayScore: 0 }),
      makeGame({ week: 3, homeScore: 20, awayScore: 15 }),
      makeGame({ week: 4, homeScore: 15, awayScore: 20 }),
    ];
    const r = computeScoringDroughts(games);
    const freq = r.shutoutFrequency.find((f) => f.season === 2024);
    expect(freq?.shutoutPct).toBe("50.0");
  });

  it("handles no shutouts in season", () => {
    const games = [
      makeGame({ week: 1, homeScore: 20, awayScore: 15 }),
      makeGame({ week: 2, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const freq = r.shutoutFrequency.find((f) => f.season === 2024);
    expect(freq?.shutouts).toBe(0);
    expect(freq?.shutoutPct).toBe("0.0");
  });
});

describe("computeScoringDroughts — worst droughts", () => {
  it("returns top 10 longest droughts", () => {
    const games: DroughtGame[] = [];
    for (let i = 1; i <= 20; i++) {
      const season = 2000 + Math.floor((i - 1) / 5);
      const team = `Team${i % 5}`;
      games.push(
        makeGame({
          season,
          week: i,
          homeTeamName: team,
          homeScore: 10,
          awayScore: 20,
        })
      );
    }
    const r = computeScoringDroughts(games);
    expect(r.worstDroughts.length).toBeLessThanOrEqual(10);
  });

  it("sorts worst droughts by length descending", () => {
    const games = [
      makeGame({ week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 2, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 3, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 4, homeScore: 20, awayScore: 15 }),
      makeGame({ week: 5, homeScore: 10, awayScore: 25 }),
      makeGame({ week: 6, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    expect(r.worstDroughts[0].length).toBe(3);
  });

  it("includes team and season in worst droughts", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2023, week: 2, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2023, week: 3, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const worst = r.worstDroughts[0];
    expect(worst.team).toBe("Kansas City Chiefs");
    expect(worst.season).toBe(2023);
    expect(worst.length).toBe(2);
  });
});

describe("computeScoringDroughts — multi-season data", () => {
  it("separates droughts by season", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2023, week: 2, homeScore: 13, awayScore: 24 }),
      makeGame({ season: 2024, week: 1, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2024, week: 2, homeScore: 10, awayScore: 25 }),
      makeGame({ season: 2024, week: 3, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const chiefs2023 = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2023
    );
    const chiefs2024 = r.teamDroughts.find(
      (t) => t.team === "Kansas City Chiefs" && t.season === 2024
    );
    expect(chiefs2023?.longestDrought).toBe(2);
    expect(chiefs2024?.longestDrought).toBe(2);
  });

  it("calculates shutout frequency by season", () => {
    const games = [
      makeGame({ season: 2023, week: 1, homeScore: 0, awayScore: 20 }),
      makeGame({ season: 2023, week: 2, homeScore: 20, awayScore: 15 }),
      makeGame({ season: 2024, week: 1, homeScore: 0, awayScore: 20 }),
      makeGame({ season: 2024, week: 2, homeScore: 0, awayScore: 20 }),
      makeGame({ season: 2024, week: 3, homeScore: 20, awayScore: 15 }),
    ];
    const r = computeScoringDroughts(games);
    const freq2023 = r.shutoutFrequency.find((f) => f.season === 2023);
    const freq2024 = r.shutoutFrequency.find((f) => f.season === 2024);
    expect(freq2023?.shutoutPct).toBe("50.0");
    expect(freq2024?.shutoutPct).toBe("66.7");
  });
});
