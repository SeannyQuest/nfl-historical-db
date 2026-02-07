import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCfbHierarchy,
  getCfbSeasonSchedule,
  getCfbWeeklySchedule,
  getCfbStandings,
} from "@/lib/sportsradar/cfb";
import {
  mapWeekTitle,
  getDayOfWeek,
  formatKickoffTime,
  fetchCfbSchedule,
  fetchCfbScores,
} from "@/lib/sportsradar/sync-cfb";

// ─── Mock sportsradarFetch ──────────────────────────────

vi.mock("@/lib/sportsradar/client", () => ({
  sportsradarFetch: vi.fn(),
  getNcaafbApiKey: vi.fn(() => "test-cfb-key"),
  getNflApiKey: vi.fn(),
  getNcaambApiKey: vi.fn(),
}));

import { sportsradarFetch } from "@/lib/sportsradar/client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── CFB API endpoint tests ─────────────────────────────

describe("CFB API endpoints", () => {
  it("getCfbHierarchy calls sportsradarFetch with correct URL", async () => {
    const mockHierarchy = {
      id: "cfb-1",
      name: "NCAA Football",
      alias: "cfb",
      conferences: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockHierarchy);

    const result = await getCfbHierarchy();

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("league/hierarchy.json"),
      { sport: "ncaafb", endpoint: "hierarchy" }
    );
    expect(result).toEqual(mockHierarchy);
  });

  it("getCfbSeasonSchedule calls sportsradarFetch with correct parameters", async () => {
    const mockSchedule = {
      id: "cfb-2024",
      year: 2024,
      type: "REG",
      weeks: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    const result = await getCfbSeasonSchedule(2024, "REG");

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("games/2024/REG/schedule.json"),
      { sport: "ncaafb", endpoint: "season_schedule" }
    );
    expect(result).toEqual(mockSchedule);
  });

  it("getCfbWeeklySchedule calls sportsradarFetch with correct parameters", async () => {
    const mockWeekly = {
      id: "cfb-w5",
      year: 2024,
      type: "REG",
      week: {
        id: "w5",
        sequence: 5,
        title: "5",
        games: [],
      },
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockWeekly);

    const result = await getCfbWeeklySchedule(2024, "REG", 5);

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("games/2024/REG/5/schedule.json"),
      { sport: "ncaafb", endpoint: "weekly_schedule" }
    );
    expect(result).toEqual(mockWeekly);
  });

  it("getCfbStandings calls sportsradarFetch with correct parameters", async () => {
    const mockStandings = {
      id: "cfb-standings",
      year: 2024,
      type: "REG",
      conferences: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockStandings);

    const result = await getCfbStandings(2024, "REG");

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("seasons/2024/REG/standings.json"),
      { sport: "ncaafb", endpoint: "standings" }
    );
    expect(result).toEqual(mockStandings);
  });
});

// ─── CFB sync mapping tests ─────────────────────────────

describe("CFB sync mapping", () => {
  describe("mapWeekTitle", () => {
    it("returns regular season week as-is", () => {
      expect(mapWeekTitle("1", false)).toBe("1");
      expect(mapWeekTitle("15", false)).toBe("15");
    });

    it("maps playoff titles", () => {
      expect(mapWeekTitle("Playoff", true)).toBe("Playoff");
      expect(mapWeekTitle("playoff", true)).toBe("Playoff");
    });

    it("maps bowl titles", () => {
      expect(mapWeekTitle("Bowl", true)).toBe("Bowl");
      expect(mapWeekTitle("Cotton Bowl", true)).toBe("Bowl");
    });

    it("returns unknown titles as-is", () => {
      expect(mapWeekTitle("Preseason", false)).toBe("Preseason");
    });
  });

  describe("getDayOfWeek", () => {
    it("returns correct day for Saturday", () => {
      // 2024-09-07 is a Saturday
      expect(getDayOfWeek("2024-09-07T20:30:00Z")).toBe("Sat");
    });

    it("returns correct day for Thursday", () => {
      // 2024-09-05 is a Thursday
      expect(getDayOfWeek("2024-09-05T23:00:00Z")).toBe("Thu");
    });

    it("returns correct day for Monday", () => {
      // 2024-09-09 is a Monday
      expect(getDayOfWeek("2024-09-09T01:00:00Z")).toBe("Mon");
    });
  });

  describe("formatKickoffTime", () => {
    it("formats afternoon ET game", () => {
      // 17:00 UTC = 1:00 PM ET
      const result = formatKickoffTime("2024-09-08T17:00:00Z");
      expect(result).toContain("1:00");
      expect(result).toContain("PM");
    });

    it("formats evening ET game", () => {
      // 00:30 UTC = 8:30 PM ET (previous day)
      const result = formatKickoffTime("2024-09-06T00:30:00Z");
      expect(result).toContain("8:30");
      expect(result).toContain("PM");
    });

    it("returns valid string or null for bad dates", () => {
      const result = formatKickoffTime("not-a-date");
      expect(typeof result === "string" || result === null).toBe(true);
    });
  });
});

// ─── CFB fetch and parse tests ──────────────────────────

describe("CFB schedule fetching", () => {
  it("fetchCfbSchedule returns prepared games", async () => {
    const mockSchedule = {
      id: "cfb-2024",
      year: 2024,
      type: "REG",
      weeks: [
        {
          id: "w1",
          sequence: 1,
          title: "1",
          games: [
            {
              id: "game-1",
              status: "complete",
              scheduled: "2024-09-07T23:00:00Z",
              home: {
                id: "kansas",
                name: "Kansas",
                alias: "KAN",
                market: "Kansas",
                points: 35,
              },
              away: {
                id: "howardun",
                name: "Howard University",
                alias: "HU",
                market: "Howard",
                points: 23,
              },
              scoring: {
                home_points: 35,
                away_points: 23,
              },
            },
          ],
        },
      ],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    const result = await fetchCfbSchedule(2024, "REG");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      srId: "game-1",
      homeAlias: "KAN",
      awayAlias: "HU",
      weekTitle: "1",
      isClosed: true,
      homePoints: 35,
      awayPoints: 23,
    });
  });

  it("fetchCfbScores returns prepared games for a specific week", async () => {
    const mockWeekly = {
      id: "cfb-w5",
      year: 2024,
      type: "REG",
      week: {
        id: "w5",
        sequence: 5,
        title: "5",
        games: [
          {
            id: "game-5a",
            status: "complete",
            scheduled: "2024-10-05T22:00:00Z",
            home: {
              id: "texas",
              name: "Texas",
              alias: "TEX",
              market: "Texas",
              points: 38,
            },
            away: {
              id: "ou",
              name: "Oklahoma",
              alias: "OK",
              market: "Oklahoma",
              points: 24,
            },
            scoring: {
              home_points: 38,
              away_points: 24,
            },
          },
        ],
      },
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockWeekly);

    const result = await fetchCfbScores(2024, "REG", 5);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      srId: "game-5a",
      homeAlias: "TEX",
      awayAlias: "OK",
      isClosed: true,
    });
  });

  it("handles postseason type correctly", async () => {
    const mockSchedule = {
      id: "cfb-2024-pst",
      year: 2024,
      type: "PST",
      weeks: [
        {
          id: "playoff-1",
          sequence: 1,
          title: "Playoff",
          games: [],
        },
      ],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    await fetchCfbSchedule(2024, "PST");

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("games/2024/PST/schedule.json"),
      { sport: "ncaafb", endpoint: "season_schedule" }
    );
  });
});
