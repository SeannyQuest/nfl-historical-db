import { describe, it, expect } from "vitest";
import {
  computePlayoffStats,
  roundLabel,
  type PlayoffGame,
} from "@/lib/playoff-stats";

function makeGame(overrides: Partial<PlayoffGame> = {}): PlayoffGame {
  return {
    id: "pg-1",
    date: "2024-01-14T12:00:00.000Z",
    season: 2023,
    week: "WildCard",
    homeTeamName: "Kansas City Chiefs",
    homeTeamAbbr: "KC",
    awayTeamName: "Miami Dolphins",
    awayTeamAbbr: "MIA",
    homeScore: 26,
    awayScore: 7,
    winnerName: "Kansas City Chiefs",
    ...overrides,
  };
}

// ─── roundLabel ─────────────────────────────────────────

describe("roundLabel", () => {
  it("formats playoff round names", () => {
    expect(roundLabel("WildCard")).toBe("Wild Card");
    expect(roundLabel("Division")).toBe("Divisional");
    expect(roundLabel("ConfChamp")).toBe("Conf. Championship");
    expect(roundLabel("SuperBowl")).toBe("Super Bowl");
  });

  it("returns unknown round as-is", () => {
    expect(roundLabel("ProBowl")).toBe("ProBowl");
  });
});

// ─── Empty ──────────────────────────────────────────────

describe("computePlayoffStats — empty", () => {
  it("returns empty results for no games", () => {
    const r = computePlayoffStats([]);
    expect(r.teamRecords).toHaveLength(0);
    expect(r.superBowlHistory).toHaveLength(0);
    expect(r.seasonSummaries).toHaveLength(0);
    expect(r.totals.totalGames).toBe(0);
    expect(r.totals.highestScoringGame).toBeNull();
  });

  it("filters out non-playoff games", () => {
    const games = [makeGame({ week: "1" })]; // Regular season
    const r = computePlayoffStats(games);
    expect(r.teamRecords).toHaveLength(0);
  });
});

// ─── Team records ───────────────────────────────────────

describe("computePlayoffStats — team records", () => {
  it("counts wins and losses", () => {
    const games = [
      makeGame({ id: "g1", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", winnerName: "Miami Dolphins" }),
    ];
    const r = computePlayoffStats(games);
    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.totalWins).toBe(1);
    expect(kc.totalLosses).toBe(1);
    expect(kc.totalGames).toBe(2);
    expect(kc.winPct).toBe("0.500");
  });

  it("tracks round-specific records", () => {
    const games = [
      makeGame({ id: "g1", week: "WildCard", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", week: "Division", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g3", week: "ConfChamp", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g4", week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
    ];
    const r = computePlayoffStats(games);
    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.wildCardWins).toBe(1);
    expect(kc.divRoundWins).toBe(1);
    expect(kc.confChampWins).toBe(1);
    expect(kc.superBowlWins).toBe(1);
  });

  it("tracks Super Bowl losses", () => {
    const games = [
      makeGame({ week: "SuperBowl", winnerName: "Miami Dolphins" }),
    ];
    const r = computePlayoffStats(games);
    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.superBowlLosses).toBe(1);
    expect(kc.superBowlAppearances).toBe(1);
  });

  it("counts playoff seasons", () => {
    const games = [
      makeGame({ id: "g1", season: 2022, winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", season: 2023, winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g3", season: 2023, week: "Division", winnerName: "Kansas City Chiefs" }),
    ];
    const r = computePlayoffStats(games);
    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.playoffSeasons).toBe(2);
    expect(kc.lastPlayoffSeason).toBe(2023);
  });

  it("tracks SB win seasons", () => {
    const games = [
      makeGame({ id: "g1", season: 2019, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", season: 2023, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
    ];
    const r = computePlayoffStats(games);
    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.superBowlWinSeasons).toEqual([2019, 2023]);
  });

  it("sorts by SB wins desc, then total wins desc", () => {
    const games = [
      makeGame({
        id: "g1", season: 2023, week: "SuperBowl",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "San Francisco 49ers", awayTeamAbbr: "SF",
        winnerName: "Kansas City Chiefs",
      }),
      makeGame({
        id: "g2", season: 2022, week: "SuperBowl",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "Philadelphia Eagles", awayTeamAbbr: "PHI",
        winnerName: "Kansas City Chiefs",
      }),
      makeGame({
        id: "g3", season: 2021, week: "WildCard",
        homeTeamName: "Buffalo Bills", homeTeamAbbr: "BUF",
        awayTeamName: "New England Patriots", awayTeamAbbr: "NE",
        winnerName: "Buffalo Bills",
      }),
    ];
    const r = computePlayoffStats(games);
    expect(r.teamRecords[0].teamAbbr).toBe("KC"); // 2 SB wins
    expect(r.teamRecords[1].teamAbbr).toBe("BUF"); // 0 SB wins, 1 total win
  });
});

// ─── Super Bowl history ─────────────────────────────────

describe("computePlayoffStats — Super Bowl history", () => {
  it("builds Super Bowl history", () => {
    const games = [
      makeGame({
        id: "g1", season: 2023, week: "SuperBowl",
        homeScore: 25, awayScore: 22,
        winnerName: "Kansas City Chiefs",
      }),
    ];
    const r = computePlayoffStats(games);
    expect(r.superBowlHistory).toHaveLength(1);
    expect(r.superBowlHistory[0].winnerAbbr).toBe("KC");
    expect(r.superBowlHistory[0].loserAbbr).toBe("MIA");
    expect(r.superBowlHistory[0].winnerScore).toBe(25);
    expect(r.superBowlHistory[0].loserScore).toBe(22);
  });

  it("handles away team winning SB", () => {
    const games = [
      makeGame({
        id: "g1", season: 2023, week: "SuperBowl",
        winnerName: "Miami Dolphins",
        homeScore: 20, awayScore: 31,
      }),
    ];
    const r = computePlayoffStats(games);
    expect(r.superBowlHistory[0].winnerAbbr).toBe("MIA");
    expect(r.superBowlHistory[0].loserAbbr).toBe("KC");
    expect(r.superBowlHistory[0].winnerScore).toBe(31);
    expect(r.superBowlHistory[0].loserScore).toBe(20);
  });

  it("sorts SB history by season descending", () => {
    const games = [
      makeGame({ id: "g1", season: 2020, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", season: 2023, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g3", season: 2021, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
    ];
    const r = computePlayoffStats(games);
    expect(r.superBowlHistory[0].season).toBe(2023);
    expect(r.superBowlHistory[1].season).toBe(2021);
    expect(r.superBowlHistory[2].season).toBe(2020);
  });
});

// ─── Season summaries ───────────────────────────────────

describe("computePlayoffStats — season summaries", () => {
  it("computes per-season stats", () => {
    const games = [
      makeGame({ id: "g1", season: 2023, homeScore: 30, awayScore: 20 }),
      makeGame({ id: "g2", season: 2023, homeScore: 24, awayScore: 14 }),
    ];
    const r = computePlayoffStats(games);
    const s = r.seasonSummaries.find((ss) => ss.season === 2023)!;
    expect(s.totalGames).toBe(2);
    expect(s.avgTotal).toBe(44);
    expect(s.highestTotal).toBe(50);
    expect(s.lowestTotal).toBe(38);
  });

  it("tracks SB winner per season", () => {
    const games = [
      makeGame({ id: "g1", season: 2023, week: "SuperBowl", winnerName: "Kansas City Chiefs" }),
    ];
    const r = computePlayoffStats(games);
    const s = r.seasonSummaries.find((ss) => ss.season === 2023)!;
    expect(s.superBowlWinner).toBe("Kansas City Chiefs");
    expect(s.superBowlWinnerAbbr).toBe("KC");
  });

  it("tracks home/away wins per season", () => {
    const games = [
      makeGame({ id: "g1", season: 2023, winnerName: "Kansas City Chiefs" }), // home
      makeGame({ id: "g2", season: 2023, winnerName: "Miami Dolphins" }), // away
    ];
    const r = computePlayoffStats(games);
    const s = r.seasonSummaries.find((ss) => ss.season === 2023)!;
    expect(s.homeWins).toBe(1);
    expect(s.awayWins).toBe(1);
  });

  it("sorts seasons descending", () => {
    const games = [
      makeGame({ id: "g1", season: 2020 }),
      makeGame({ id: "g2", season: 2023 }),
      makeGame({ id: "g3", season: 2021 }),
    ];
    const r = computePlayoffStats(games);
    expect(r.seasonSummaries[0].season).toBe(2023);
    expect(r.seasonSummaries[1].season).toBe(2021);
    expect(r.seasonSummaries[2].season).toBe(2020);
  });

  it("returns null SB winner when no SB game", () => {
    const games = [
      makeGame({ id: "g1", season: 2023, week: "WildCard" }),
    ];
    const r = computePlayoffStats(games);
    const s = r.seasonSummaries[0];
    expect(s.superBowlWinner).toBeNull();
  });
});

// ─── Overall totals ─────────────────────────────────────

describe("computePlayoffStats — totals", () => {
  it("computes overall totals", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 30, awayScore: 20 }),
      makeGame({ id: "g2", homeScore: 28, awayScore: 24 }),
    ];
    const r = computePlayoffStats(games);
    expect(r.totals.totalGames).toBe(2);
    expect(r.totals.avgTotal).toBe(51);
  });

  it("computes home win percentage", () => {
    const games = [
      makeGame({ id: "g1", winnerName: "Kansas City Chiefs" }), // home win
      makeGame({ id: "g2", winnerName: "Kansas City Chiefs" }), // home win
      makeGame({ id: "g3", winnerName: "Miami Dolphins" }), // away win
    ];
    const r = computePlayoffStats(games);
    expect(r.totals.homeWinPct).toBe("0.667");
  });

  it("finds highest scoring game", () => {
    const games = [
      makeGame({ id: "g1", homeScore: 20, awayScore: 17 }), // 37
      makeGame({ id: "g2", homeScore: 45, awayScore: 35 }), // 80
      makeGame({ id: "g3", homeScore: 24, awayScore: 21 }), // 45
    ];
    const r = computePlayoffStats(games);
    expect(r.totals.highestScoringGame!.value).toBe(80);
    expect(r.totals.highestScoringGame!.gameId).toBe("g2");
  });

  it("counts unique seasons", () => {
    const games = [
      makeGame({ id: "g1", season: 2022 }),
      makeGame({ id: "g2", season: 2022 }),
      makeGame({ id: "g3", season: 2023 }),
    ];
    const r = computePlayoffStats(games);
    expect(r.totals.totalSeasons).toBe(2);
  });
});

// ─── Integration ────────────────────────────────────────

describe("computePlayoffStats — integration", () => {
  it("handles a full playoff bracket", () => {
    const games: PlayoffGame[] = [
      // WildCard
      makeGame({
        id: "wc1", season: 2023, week: "WildCard",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "Miami Dolphins", awayTeamAbbr: "MIA",
        homeScore: 26, awayScore: 7, winnerName: "Kansas City Chiefs",
      }),
      // Division
      makeGame({
        id: "div1", season: 2023, week: "Division",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills", awayTeamAbbr: "BUF",
        homeScore: 27, awayScore: 24, winnerName: "Kansas City Chiefs",
      }),
      // ConfChamp
      makeGame({
        id: "cc1", season: 2023, week: "ConfChamp",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "Baltimore Ravens", awayTeamAbbr: "BAL",
        homeScore: 17, awayScore: 10, winnerName: "Kansas City Chiefs",
      }),
      // SuperBowl
      makeGame({
        id: "sb1", season: 2023, week: "SuperBowl",
        homeTeamName: "Kansas City Chiefs", homeTeamAbbr: "KC",
        awayTeamName: "San Francisco 49ers", awayTeamAbbr: "SF",
        homeScore: 25, awayScore: 22, winnerName: "Kansas City Chiefs",
      }),
    ];
    const r = computePlayoffStats(games);

    const kc = r.teamRecords.find((t) => t.teamAbbr === "KC")!;
    expect(kc.totalWins).toBe(4);
    expect(kc.totalLosses).toBe(0);
    expect(kc.superBowlWins).toBe(1);
    expect(kc.superBowlAppearances).toBe(1);
    expect(kc.playoffSeasons).toBe(1);

    expect(r.superBowlHistory).toHaveLength(1);
    expect(r.superBowlHistory[0].winnerAbbr).toBe("KC");

    expect(r.seasonSummaries).toHaveLength(1);
    expect(r.seasonSummaries[0].superBowlWinnerAbbr).toBe("KC");

    expect(r.totals.totalGames).toBe(4);
  });
});
