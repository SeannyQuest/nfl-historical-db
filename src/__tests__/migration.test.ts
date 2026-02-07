import { describe, it, expect } from "vitest";
import {
  parseGame,
  parseAllGames,
  deduplicateGames,
  extractSeasons,
  generateReport,
  isKnownTeam,
  getUnknownTeams,
} from "../../scripts/migrate-lib";
import type { RawGame } from "../../scripts/migrate-lib";

// ─── Fixtures ───────────────────────────────────────────

const fullGame: RawGame = {
  s: 2024,
  w: "1",
  d: "Sun",
  dt: "2024-09-08",
  tm: "1:00PM",
  h: "Kansas City Chiefs",
  a: "Baltimore Ravens",
  hs: 27,
  as: 20,
  pt: "SNF",
  sp: -3.5,
  ou: 47.5,
  sr: "Covered",
  our: "Under",
  tp: 72,
  wi: "8 mph",
  cd: "Clear",
};

const minimalGame: RawGame = {
  s: 1970,
  w: "5",
  d: "Mon",
  dt: "1970-10-12",
  tm: "",
  h: "Green Bay Packers",
  a: "Chicago Bears",
  hs: 14,
  as: 10,
  pt: "",
};

const tieGame: RawGame = {
  s: 2016,
  w: "8",
  d: "Sun",
  dt: "2016-10-30",
  tm: "1:00PM",
  h: "Washington Commanders",
  a: "Cincinnati Bengals",
  hs: 27,
  as: 27,
  pt: "",
};

const playoffGame: RawGame = {
  s: 2023,
  w: "SuperBowl",
  d: "Sun",
  dt: "2024-02-11",
  tm: "6:30PM",
  h: "Las Vegas Raiders",
  a: "San Francisco 49ers",
  hs: 25,
  as: 22,
  pt: "SNF",
  sp: -1.5,
  ou: 47,
  sr: "Lost",
  our: "Over",
};

// ─── parseGame ──────────────────────────────────────────

describe("parseGame", () => {
  it("parses a full game with all fields", () => {
    const g = parseGame(fullGame);
    expect(g.season).toBe(2024);
    expect(g.week).toBe("1");
    expect(g.dayOfWeek).toBe("Sun");
    expect(g.date).toEqual(new Date("2024-09-08T12:00:00Z"));
    expect(g.time).toBe("1:00PM");
    expect(g.homeTeamName).toBe("Kansas City Chiefs");
    expect(g.awayTeamName).toBe("Baltimore Ravens");
    expect(g.homeScore).toBe(27);
    expect(g.awayScore).toBe(20);
    expect(g.scoreDiff).toBe(7);
    expect(g.winnerTeamName).toBe("Kansas City Chiefs");
    expect(g.primetime).toBe("SNF");
    expect(g.isPlayoff).toBe(false);
  });

  it("parses betting data correctly", () => {
    const g = parseGame(fullGame);
    expect(g.betting).not.toBeNull();
    expect(g.betting!.spread).toBe(-3.5);
    expect(g.betting!.overUnder).toBe(47.5);
    expect(g.betting!.spreadResult).toBe("COVERED");
    expect(g.betting!.ouResult).toBe("UNDER");
  });

  it("parses weather data correctly", () => {
    const g = parseGame(fullGame);
    expect(g.weather).not.toBeNull();
    expect(g.weather!.temperature).toBe(72);
    expect(g.weather!.wind).toBe("8 mph");
    expect(g.weather!.conditions).toBe("Clear");
  });

  it("returns null betting/weather when missing", () => {
    const g = parseGame(minimalGame);
    expect(g.betting).toBeNull();
    expect(g.weather).toBeNull();
  });

  it("converts empty string time/primetime to null", () => {
    const g = parseGame(minimalGame);
    expect(g.time).toBeNull();
    expect(g.primetime).toBeNull();
  });

  it("handles ties — winnerTeamName is null", () => {
    const g = parseGame(tieGame);
    expect(g.homeScore).toBe(27);
    expect(g.awayScore).toBe(27);
    expect(g.scoreDiff).toBe(0);
    expect(g.winnerTeamName).toBeNull();
  });

  it("picks away team as winner when away score is higher", () => {
    const g = parseGame({ ...minimalGame, hs: 10, as: 14 });
    expect(g.winnerTeamName).toBe("Chicago Bears");
  });

  it("detects playoff weeks", () => {
    expect(parseGame({ ...minimalGame, w: "WildCard" }).isPlayoff).toBe(true);
    expect(parseGame({ ...minimalGame, w: "Division" }).isPlayoff).toBe(true);
    expect(parseGame({ ...minimalGame, w: "ConfChamp" }).isPlayoff).toBe(true);
    expect(parseGame({ ...minimalGame, w: "SuperBowl" }).isPlayoff).toBe(true);
    expect(parseGame({ ...minimalGame, w: "Champ" }).isPlayoff).toBe(true);
    expect(parseGame({ ...minimalGame, w: "1" }).isPlayoff).toBe(false);
    expect(parseGame({ ...minimalGame, w: "18" }).isPlayoff).toBe(false);
  });

  it("maps all spread results", () => {
    expect(parseGame({ ...fullGame, sr: "Covered" }).betting!.spreadResult).toBe("COVERED");
    expect(parseGame({ ...fullGame, sr: "Lost" }).betting!.spreadResult).toBe("LOST");
    expect(parseGame({ ...fullGame, sr: "Push" }).betting!.spreadResult).toBe("PUSH");
    expect(parseGame({ ...fullGame, sr: undefined, sp: -3 }).betting!.spreadResult).toBeNull();
  });

  it("maps all O/U results", () => {
    expect(parseGame({ ...fullGame, our: "Over" }).betting!.ouResult).toBe("OVER");
    expect(parseGame({ ...fullGame, our: "Under" }).betting!.ouResult).toBe("UNDER");
    expect(parseGame({ ...fullGame, our: "Push" }).betting!.ouResult).toBe("PUSH");
    expect(parseGame({ ...fullGame, our: undefined, ou: 47 }).betting!.ouResult).toBeNull();
  });

  it("stores dates at noon UTC to avoid timezone shift", () => {
    const g = parseGame(fullGame);
    expect(g.date.getUTCHours()).toBe(12);
    expect(g.date.getUTCMinutes()).toBe(0);
  });
});

// ─── parseAllGames ──────────────────────────────────────

describe("parseAllGames", () => {
  it("parses an array of raw games", () => {
    const result = parseAllGames([fullGame, minimalGame]);
    expect(result).toHaveLength(2);
    expect(result[0].season).toBe(2024);
    expect(result[1].season).toBe(1970);
  });

  it("returns empty array for empty input", () => {
    expect(parseAllGames([])).toEqual([]);
  });
});

// ─── deduplicateGames ───────────────────────────────────

describe("deduplicateGames", () => {
  it("removes duplicate games with same date/home/away", () => {
    const parsed = parseAllGames([fullGame, fullGame, fullGame]);
    const unique = deduplicateGames(parsed);
    expect(unique).toHaveLength(1);
  });

  it("keeps games with different dates", () => {
    const game2 = { ...fullGame, dt: "2024-09-09" };
    const parsed = parseAllGames([fullGame, game2]);
    const unique = deduplicateGames(parsed);
    expect(unique).toHaveLength(2);
  });

  it("keeps games with same date but different teams", () => {
    const game2 = { ...fullGame, h: "Green Bay Packers" };
    const parsed = parseAllGames([fullGame, game2]);
    const unique = deduplicateGames(parsed);
    expect(unique).toHaveLength(2);
  });
});

// ─── extractSeasons ─────────────────────────────────────

describe("extractSeasons", () => {
  it("extracts unique sorted seasons", () => {
    const parsed = parseAllGames([
      { ...minimalGame, s: 2020 },
      { ...minimalGame, s: 2018 },
      { ...minimalGame, s: 2020 },
      { ...minimalGame, s: 2019 },
    ]);
    expect(extractSeasons(parsed)).toEqual([2018, 2019, 2020]);
  });
});

// ─── Team name resolution ───────────────────────────────

describe("team name resolution", () => {
  it("recognizes current teams", () => {
    expect(isKnownTeam("Kansas City Chiefs")).toBe(true);
    expect(isKnownTeam("Green Bay Packers")).toBe(true);
  });

  it("recognizes historical teams", () => {
    expect(isKnownTeam("Oakland Raiders")).toBe(true);
    expect(isKnownTeam("St. Louis Rams")).toBe(true);
    expect(isKnownTeam("San Diego Chargers")).toBe(true);
  });

  it("rejects unknown teams", () => {
    expect(isKnownTeam("London Silly Nannies")).toBe(false);
    expect(isKnownTeam("")).toBe(false);
  });

  it("finds unknown teams in game list", () => {
    const games: RawGame[] = [
      { ...minimalGame, h: "Fake Team", a: "Kansas City Chiefs" },
      { ...minimalGame, h: "Green Bay Packers", a: "Another Fake" },
    ];
    const unknown = getUnknownTeams(games);
    expect(unknown).toEqual(["Another Fake", "Fake Team"]);
  });

  it("returns empty array when all teams known", () => {
    expect(getUnknownTeams([fullGame, minimalGame])).toEqual([]);
  });
});

// ─── generateReport ─────────────────────────────────────

describe("generateReport", () => {
  const testGames: RawGame[] = [
    fullGame,
    minimalGame,
    tieGame,
    playoffGame,
    { ...fullGame, dt: "2024-09-15" }, // different date = unique game
    fullGame, // duplicate of first game
  ];

  it("counts total and unique games", () => {
    const report = generateReport(testGames);
    expect(report.totalGames).toBe(6);
    expect(report.uniqueGames).toBe(5);
    expect(report.duplicatesRemoved).toBe(1);
  });

  it("calculates season range", () => {
    const report = generateReport(testGames);
    expect(report.seasonRange).toEqual([1970, 2024]);
  });

  it("counts seasons", () => {
    const report = generateReport(testGames);
    expect(report.seasonCount).toBe(4); // 1970, 2016, 2023, 2024
  });

  it("counts ties", () => {
    const report = generateReport(testGames);
    expect(report.tieCount).toBe(1);
  });

  it("counts betting and weather data", () => {
    const report = generateReport(testGames);
    expect(report.bettingCount).toBe(3); // fullGame, playoffGame, duplicate fullGame's unique copy, and the different-date fullGame copy
    expect(report.weatherCount).toBe(2); // fullGame + different-date copy
  });

  it("counts playoff games", () => {
    const report = generateReport(testGames);
    expect(report.playoffCount).toBe(1);
  });

  it("reports unknown teams", () => {
    const gamesWithFake = [...testGames, { ...minimalGame, h: "Mars Martians" }];
    const report = generateReport(gamesWithFake);
    expect(report.unknownTeams).toContain("Mars Martians");
  });

  it("tracks games per season", () => {
    const report = generateReport(testGames);
    expect(report.gamesPerSeason[2024]).toBe(2); // fullGame + different date
    expect(report.gamesPerSeason[1970]).toBe(1);
    expect(report.gamesPerSeason[2016]).toBe(1);
    expect(report.gamesPerSeason[2023]).toBe(1);
  });
});
