import { describe, it, expect } from "vitest";
import { computeSchedule, weekLabel, type ScheduleGame } from "@/lib/schedule";

function makeGame(overrides: Partial<ScheduleGame> = {}): ScheduleGame {
  return {
    id: "game-1",
    date: "2024-09-08T12:00:00.000Z",
    season: 2024,
    week: "1",
    time: "1:00 PM",
    dayOfWeek: "Sun",
    isPlayoff: false,
    primetime: null,
    homeTeamName: "Kansas City Chiefs",
    homeTeamAbbr: "KC",
    homeTeamCity: "Kansas City",
    awayTeamName: "Buffalo Bills",
    awayTeamAbbr: "BUF",
    awayTeamCity: "Buffalo",
    homeScore: 27,
    awayScore: 20,
    winnerName: "Kansas City Chiefs",
    spread: -3.5,
    overUnder: 44.5,
    spreadResult: "COVERED",
    ouResult: "OVER",
    ...overrides,
  };
}

// ─── weekLabel ──────────────────────────────────────────

describe("weekLabel", () => {
  it("formats numeric weeks", () => {
    expect(weekLabel("1")).toBe("Week 1");
    expect(weekLabel("18")).toBe("Week 18");
  });

  it("formats playoff rounds", () => {
    expect(weekLabel("WildCard")).toBe("Wild Card");
    expect(weekLabel("Division")).toBe("Divisional");
    expect(weekLabel("ConfChamp")).toBe("Conference Championship");
    expect(weekLabel("SuperBowl")).toBe("Super Bowl");
  });

  it("returns unknown week as-is", () => {
    expect(weekLabel("ProBowl")).toBe("ProBowl");
  });
});

// ─── Empty ──────────────────────────────────────────────

describe("computeSchedule — empty", () => {
  it("returns empty results for no games", () => {
    const r = computeSchedule([]);
    expect(r.weeks).toHaveLength(0);
    expect(r.availableSeasons).toHaveLength(0);
    expect(r.availableWeeks).toHaveLength(0);
  });
});

// ─── Season filtering ───────────────────────────────────

describe("computeSchedule — season filter", () => {
  it("returns all seasons when no filter", () => {
    const games = [
      makeGame({ id: "g1", season: 2024 }),
      makeGame({ id: "g2", season: 2023 }),
    ];
    const r = computeSchedule(games);
    expect(r.availableSeasons).toEqual([2024, 2023]);
  });

  it("filters games to requested season", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1" }),
      makeGame({ id: "g2", season: 2023, week: "1" }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.weeks).toHaveLength(1);
    expect(r.weeks[0].season).toBe(2024);
  });

  it("still includes all seasons in availableSeasons", () => {
    const games = [
      makeGame({ id: "g1", season: 2024 }),
      makeGame({ id: "g2", season: 2023 }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.availableSeasons).toEqual([2024, 2023]);
  });
});

// ─── Week filtering ─────────────────────────────────────

describe("computeSchedule — week filter", () => {
  it("filters to requested week", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1" }),
      makeGame({ id: "g2", season: 2024, week: "2" }),
      makeGame({ id: "g3", season: 2024, week: "3" }),
    ];
    const r = computeSchedule(games, 2024, "2");
    expect(r.weeks).toHaveLength(1);
    expect(r.weeks[0].week).toBe("2");
  });

  it("returns available weeks for filtered season", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1" }),
      makeGame({ id: "g2", season: 2024, week: "2" }),
      makeGame({ id: "g3", season: 2024, week: "WildCard", isPlayoff: true }),
    ];
    const r = computeSchedule(games, 2024, "1");
    expect(r.availableWeeks).toEqual(["1", "2", "WildCard"]);
  });
});

// ─── Week grouping ──────────────────────────────────────

describe("computeSchedule — week grouping", () => {
  it("groups games by week", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1" }),
      makeGame({ id: "g2", season: 2024, week: "1", homeTeamName: "Denver Broncos", homeTeamAbbr: "DEN" }),
      makeGame({ id: "g3", season: 2024, week: "2" }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.weeks).toHaveLength(2);
    expect(r.weeks[0].games).toHaveLength(2);
    expect(r.weeks[1].games).toHaveLength(1);
  });

  it("orders weeks ascending within a season", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "3" }),
      makeGame({ id: "g2", season: 2024, week: "1" }),
      makeGame({ id: "g3", season: 2024, week: "2" }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.weeks[0].week).toBe("1");
    expect(r.weeks[1].week).toBe("2");
    expect(r.weeks[2].week).toBe("3");
  });

  it("orders playoff weeks after regular season", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "SuperBowl", isPlayoff: true }),
      makeGame({ id: "g2", season: 2024, week: "18" }),
      makeGame({ id: "g3", season: 2024, week: "WildCard", isPlayoff: true }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.weeks[0].week).toBe("18");
    expect(r.weeks[1].week).toBe("WildCard");
    expect(r.weeks[2].week).toBe("SuperBowl");
  });

  it("applies correct weekLabel", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "5" }),
    ];
    const r = computeSchedule(games, 2024);
    expect(r.weeks[0].weekLabel).toBe("Week 5");
  });
});

// ─── Game sorting within week ───────────────────────────

describe("computeSchedule — game sorting", () => {
  it("sorts by day order (Thu before Sun before Mon)", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", dayOfWeek: "Mon", time: "8:15 PM" }),
      makeGame({ id: "g2", season: 2024, week: "1", dayOfWeek: "Thu", time: "8:20 PM" }),
      makeGame({ id: "g3", season: 2024, week: "1", dayOfWeek: "Sun", time: "1:00 PM" }),
    ];
    const r = computeSchedule(games, 2024, "1");
    expect(r.weeks[0].games[0].game.dayOfWeek).toBe("Thu");
    expect(r.weeks[0].games[1].game.dayOfWeek).toBe("Sun");
    expect(r.weeks[0].games[2].game.dayOfWeek).toBe("Mon");
  });

  it("sorts by time within same day", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", dayOfWeek: "Sun", time: "4:25 PM" }),
      makeGame({ id: "g2", season: 2024, week: "1", dayOfWeek: "Sun", time: "1:00 PM" }),
      makeGame({ id: "g3", season: 2024, week: "1", dayOfWeek: "Sun", time: "8:20 PM" }),
    ];
    const r = computeSchedule(games, 2024, "1");
    expect(r.weeks[0].games[0].game.time).toBe("1:00 PM");
    expect(r.weeks[0].games[1].game.time).toBe("4:25 PM");
    expect(r.weeks[0].games[2].game.time).toBe("8:20 PM");
  });
});

// ─── Status label ───────────────────────────────────────

describe("computeSchedule — status labels", () => {
  it("shows Final for completed games", () => {
    const games = [makeGame({ homeScore: 27, awayScore: 20, winnerName: "Kansas City Chiefs" })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].statusLabel).toBe("Final");
  });

  it("shows TIE for tied games", () => {
    const games = [makeGame({ homeScore: 20, awayScore: 20, winnerName: null })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].statusLabel).toBe("TIE");
  });

  it("shows time for unplayed games", () => {
    const games = [makeGame({ homeScore: 0, awayScore: 0, winnerName: null, time: "4:25 PM" })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].statusLabel).toBe("4:25 PM ET");
  });

  it("shows TBD for unplayed games without time", () => {
    const games = [makeGame({ homeScore: 0, awayScore: 0, winnerName: null, time: null })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].statusLabel).toBe("TBD");
  });
});

// ─── Team records ───────────────────────────────────────

describe("computeSchedule — team records", () => {
  it("computes team records from regular season games", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", season: 2024, week: "2", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g3", season: 2024, week: "3", winnerName: "Buffalo Bills" }),
    ];
    const r = computeSchedule(games, 2024, "3");
    const entry = r.weeks[0].games[0];
    expect(entry.homeRecord).toBe("2-1");
    expect(entry.awayRecord).toBe("1-2");
  });

  it("excludes playoff games from records", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", winnerName: "Kansas City Chiefs" }),
      makeGame({ id: "g2", season: 2024, week: "WildCard", isPlayoff: true, winnerName: "Kansas City Chiefs" }),
    ];
    const r = computeSchedule(games, 2024, "WildCard");
    const entry = r.weeks[0].games[0];
    expect(entry.homeRecord).toBe("1-0");
    expect(entry.awayRecord).toBe("0-1");
  });

  it("includes ties in record format", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", homeScore: 20, awayScore: 20, winnerName: null }),
    ];
    const r = computeSchedule(games, 2024);
    const entry = r.weeks[0].games[0];
    expect(entry.homeRecord).toBe("0-0-1");
    expect(entry.awayRecord).toBe("0-0-1");
  });

  it("returns 0-0 for teams with no played games", () => {
    const games = [
      makeGame({ id: "g1", season: 2024, week: "1", homeScore: 0, awayScore: 0, winnerName: null }),
    ];
    const r = computeSchedule(games, 2024);
    const entry = r.weeks[0].games[0];
    expect(entry.homeRecord).toBe("0-0");
    expect(entry.awayRecord).toBe("0-0");
  });
});

// ─── Betting data passthrough ───────────────────────────

describe("computeSchedule — betting data", () => {
  it("preserves spread and overUnder on scorebug", () => {
    const games = [makeGame({ spread: -7, overUnder: 48.5 })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].game.spread).toBe(-7);
    expect(r.weeks[0].games[0].game.overUnder).toBe(48.5);
  });

  it("handles null betting data", () => {
    const games = [makeGame({ spread: null, overUnder: null })];
    const r = computeSchedule(games);
    expect(r.weeks[0].games[0].game.spread).toBeNull();
    expect(r.weeks[0].games[0].game.overUnder).toBeNull();
  });
});

// ─── Multi-season ───────────────────────────────────────

describe("computeSchedule — multi-season", () => {
  it("orders seasons descending when no filter", () => {
    const games = [
      makeGame({ id: "g1", season: 2022, week: "1" }),
      makeGame({ id: "g2", season: 2024, week: "1" }),
      makeGame({ id: "g3", season: 2023, week: "1" }),
    ];
    const r = computeSchedule(games);
    expect(r.weeks[0].season).toBe(2024);
    expect(r.weeks[1].season).toBe(2023);
    expect(r.weeks[2].season).toBe(2022);
  });
});
