import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCbbHierarchy,
  getCbbSeasonSchedule,
  getCbbDailySchedule,
  getCbbStandings,
} from "@/lib/sportsradar/cbb";
import {
  getDayOfWeek,
  formatGameTime,
  fetchCbbSeasonSchedule,
  fetchCbbDailySchedule,
} from "@/lib/sportsradar/sync-cbb";

// ─── Mock sportsradarFetch ──────────────────────────────

vi.mock("@/lib/sportsradar/client", () => ({
  sportsradarFetch: vi.fn(),
  getNcaambApiKey: vi.fn(() => "test-cbb-key"),
  getNflApiKey: vi.fn(),
  getNcaafbApiKey: vi.fn(),
}));

import { sportsradarFetch } from "@/lib/sportsradar/client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── CBB API endpoint tests ─────────────────────────────

describe("CBB API endpoints", () => {
  it("getCbbHierarchy calls sportsradarFetch with correct URL", async () => {
    const mockHierarchy = {
      id: "cbb-1",
      name: "NCAA Basketball",
      alias: "cbb",
      conferences: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockHierarchy);

    const result = await getCbbHierarchy();

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("league/hierarchy.json"),
      { sport: "ncaamb", endpoint: "hierarchy" }
    );
    expect(result).toEqual(mockHierarchy);
  });

  it("getCbbSeasonSchedule calls sportsradarFetch with correct parameters", async () => {
    const mockSchedule = {
      id: "cbb-2024",
      year: 2024,
      games: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    const result = await getCbbSeasonSchedule(2024);

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("games/2024/schedule.json"),
      { sport: "ncaamb", endpoint: "season_schedule" }
    );
    expect(result).toEqual(mockSchedule);
  });

  it("getCbbDailySchedule calls sportsradarFetch with correct parameters", async () => {
    const mockDaily = {
      id: "cbb-daily",
      date: "2024-01-15",
      games: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockDaily);

    const result = await getCbbDailySchedule(2024, "2024-01-15");

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("games/2024/2024-01-15/schedule.json"),
      { sport: "ncaamb", endpoint: "daily_schedule" }
    );
    expect(result).toEqual(mockDaily);
  });

  it("getCbbStandings calls sportsradarFetch with correct parameters", async () => {
    const mockStandings = {
      id: "cbb-standings",
      year: 2024,
      conferences: [],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockStandings);

    const result = await getCbbStandings(2024);

    expect(sportsradarFetch).toHaveBeenCalledWith(
      expect.stringContaining("seasons/2024/standings.json"),
      { sport: "ncaamb", endpoint: "standings" }
    );
    expect(result).toEqual(mockStandings);
  });
});

// ─── CBB sync mapping tests ─────────────────────────────

describe("CBB sync mapping", () => {
  describe("getDayOfWeek", () => {
    it("returns correct day for Monday", () => {
      // 2024-01-15 is a Monday
      expect(getDayOfWeek("2024-01-15T20:00:00Z")).toBe("Mon");
    });

    it("returns correct day for Wednesday", () => {
      // 2024-01-17 is a Wednesday
      expect(getDayOfWeek("2024-01-17T22:00:00Z")).toBe("Wed");
    });

    it("returns correct day for Saturday", () => {
      // 2024-01-20 is a Saturday
      expect(getDayOfWeek("2024-01-20T19:00:00Z")).toBe("Sat");
    });

    it("returns correct day for Sunday", () => {
      // 2024-01-21 is a Sunday
      expect(getDayOfWeek("2024-01-21T15:00:00Z")).toBe("Sun");
    });
  });

  describe("formatGameTime", () => {
    it("formats evening ET game", () => {
      // 00:00 UTC = 7:00 PM ET (previous day)
      const result = formatGameTime("2024-01-15T00:00:00Z");
      expect(result).toContain("7:00");
      expect(result).toContain("PM");
    });

    it("formats afternoon ET game", () => {
      // 19:00 UTC = 2:00 PM ET
      const result = formatGameTime("2024-01-15T19:00:00Z");
      expect(result).toContain("2:00");
      expect(result).toContain("PM");
    });

    it("formats morning ET game", () => {
      // 13:00 UTC = 8:00 AM ET
      const result = formatGameTime("2024-01-15T13:00:00Z");
      expect(result).toContain("8:00");
      expect(result).toContain("AM");
    });

    it("returns valid string or null for bad dates", () => {
      const result = formatGameTime("invalid-date");
      expect(typeof result === "string" || result === null).toBe(true);
    });
  });
});

// ─── CBB fetch and parse tests ──────────────────────────

describe("CBB schedule fetching", () => {
  it("fetchCbbSeasonSchedule returns prepared games", async () => {
    const mockSchedule = {
      id: "cbb-2024",
      year: 2024,
      games: [
        {
          id: "game-1",
          status: "complete",
          scheduled: "2024-11-04T23:30:00Z",
          home: {
            id: "duke",
            name: "Duke",
            alias: "DUK",
            market: "Duke",
            points: 76,
          },
          away: {
            id: "maine",
            name: "Maine",
            alias: "MAINE",
            market: "Maine",
            points: 55,
          },
          scoring: {
            home_points: 76,
            away_points: 55,
          },
        },
      ],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    const result = await fetchCbbSeasonSchedule(2024);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      srId: "game-1",
      homeAlias: "DUK",
      awayAlias: "MAINE",
      isClosed: true,
      homePoints: 76,
      awayPoints: 55,
    });
    expect(result[0].time).toContain("PM");
  });

  it("fetchCbbDailySchedule returns prepared games for a specific date", async () => {
    const mockDaily = {
      id: "cbb-daily",
      date: "2024-01-15",
      games: [
        {
          id: "game-mon-1",
          status: "complete",
          scheduled: "2024-01-15T23:30:00Z",
          home: {
            id: "kentucky",
            name: "Kentucky",
            alias: "KY",
            market: "Kentucky",
            points: 72,
          },
          away: {
            id: "florida",
            name: "Florida",
            alias: "FL",
            market: "Florida",
            points: 68,
          },
          scoring: {
            home_points: 72,
            away_points: 68,
          },
        },
        {
          id: "game-mon-2",
          status: "scheduled",
          scheduled: "2024-01-15T01:30:00Z",
          home: {
            id: "kansas",
            name: "Kansas",
            alias: "KAN",
            market: "Kansas",
          },
          away: {
            id: "iowa",
            name: "Iowa",
            alias: "IA",
            market: "Iowa",
          },
        },
      ],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockDaily);

    const result = await fetchCbbDailySchedule(2024, "2024-01-15");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      srId: "game-mon-1",
      isClosed: true,
    });
    expect(result[1]).toMatchObject({
      srId: "game-mon-2",
      isClosed: false,
      homePoints: undefined,
      awayPoints: undefined,
    });
  });

  it("handles games with only home.points field", async () => {
    const mockSchedule = {
      id: "cbb-2024",
      year: 2024,
      games: [
        {
          id: "game-alt",
          status: "complete",
          scheduled: "2024-11-04T23:30:00Z",
          home: {
            id: "unc",
            name: "North Carolina",
            alias: "UNC",
            market: "North Carolina",
            points: 88,
          },
          away: {
            id: "pitt",
            name: "Pittsburgh",
            alias: "PITT",
            market: "Pittsburgh",
            points: 81,
          },
        },
      ],
    };
    vi.mocked(sportsradarFetch).mockResolvedValueOnce(mockSchedule);

    const result = await fetchCbbSeasonSchedule(2024);

    expect(result[0]).toMatchObject({
      homePoints: 88,
      awayPoints: 81,
    });
  });
});
