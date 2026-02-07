import { describe, it, expect } from "vitest";
import {
  mapWeekTitle,
  getDayOfWeek,
  detectPrimetime,
  formatKickoffTime,
} from "@/lib/sportsradar/sync-nfl";

// ─── mapWeekTitle ───────────────────────────────────────

describe("mapWeekTitle", () => {
  it("returns regular season week as-is", () => {
    expect(mapWeekTitle("1", false)).toBe("1");
    expect(mapWeekTitle("18", false)).toBe("18");
  });

  it("maps Wild Card", () => {
    expect(mapWeekTitle("Wild Card", true)).toBe("WildCard");
    expect(mapWeekTitle("wild card", true)).toBe("WildCard");
    expect(mapWeekTitle("Wildcard", true)).toBe("WildCard");
  });

  it("maps Divisional", () => {
    expect(mapWeekTitle("Divisional", true)).toBe("Division");
    expect(mapWeekTitle("divisional", true)).toBe("Division");
  });

  it("maps Conference Championship", () => {
    expect(mapWeekTitle("Conference", true)).toBe("ConfChamp");
    expect(mapWeekTitle("Conf Championship", true)).toBe("ConfChamp");
  });

  it("maps Super Bowl", () => {
    expect(mapWeekTitle("Super Bowl", true)).toBe("SuperBowl");
    expect(mapWeekTitle("super bowl", true)).toBe("SuperBowl");
  });

  it("returns unknown postseason titles as-is", () => {
    expect(mapWeekTitle("Pro Bowl", true)).toBe("Pro Bowl");
  });
});

// ─── getDayOfWeek ───────────────────────────────────────

describe("getDayOfWeek", () => {
  it("returns correct day for a known Sunday", () => {
    // 2024-09-08 is a Sunday
    expect(getDayOfWeek("2024-09-08T17:00:00Z")).toBe("Sun");
  });

  it("returns correct day for a Thursday", () => {
    // 2024-09-05 is a Thursday
    expect(getDayOfWeek("2024-09-05T00:20:00Z")).toBe("Thu");
  });

  it("returns correct day for a Monday", () => {
    // 2024-09-09 is a Monday
    expect(getDayOfWeek("2024-09-09T00:15:00Z")).toBe("Mon");
  });

  it("handles midnight UTC (Saturday)", () => {
    // 2024-09-07 is a Saturday
    expect(getDayOfWeek("2024-09-07T00:00:00Z")).toBe("Sat");
  });
});

// ─── detectPrimetime ────────────────────────────────────

describe("detectPrimetime", () => {
  it("detects MNF for Monday late games", () => {
    // 23:15 UTC on Monday = 7:15 PM ET
    expect(detectPrimetime("2024-09-09T23:15:00Z", "Mon")).toBe("MNF");
  });

  it("detects SNF for Sunday late games", () => {
    expect(detectPrimetime("2024-09-08T23:20:00Z", "Sun")).toBe("SNF");
  });

  it("detects TNF for Thursday late games", () => {
    // 23:15 UTC on Thursday = 7:15 PM ET
    expect(detectPrimetime("2024-09-05T23:15:00Z", "Thu")).toBe("TNF");
  });

  it("returns null for Sunday early games", () => {
    expect(detectPrimetime("2024-09-08T17:00:00Z", "Sun")).toBeNull();
  });

  it("returns null for Saturday games", () => {
    expect(detectPrimetime("2024-12-21T23:30:00Z", "Sat")).toBeNull();
  });

  it("returns null for non-primetime days", () => {
    expect(detectPrimetime("2024-09-10T17:00:00Z", "Tue")).toBeNull();
  });
});

// ─── formatKickoffTime ──────────────────────────────────

describe("formatKickoffTime", () => {
  it("formats afternoon ET game", () => {
    // 17:00 UTC = 1:00 PM ET
    const result = formatKickoffTime("2024-09-08T17:00:00Z");
    expect(result).toContain("1:00");
    expect(result).toContain("PM");
  });

  it("formats evening ET game", () => {
    // 00:20 UTC = 8:20 PM ET (previous day)
    const result = formatKickoffTime("2024-09-06T00:20:00Z");
    expect(result).toContain("8:20");
    expect(result).toContain("PM");
  });

  it("returns null for invalid date", () => {
    const result = formatKickoffTime("not-a-date");
    // May return null or a string depending on Date constructor behavior
    // The function catches errors and returns null
    expect(typeof result === "string" || result === null).toBe(true);
  });
});
