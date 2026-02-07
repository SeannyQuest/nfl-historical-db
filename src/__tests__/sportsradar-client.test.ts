import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sportsradarFetch,
  logApiCall,
  getApiUsage,
  getNflApiKey,
  getNcaafbApiKey,
  getNcaambApiKey,
  resetRateLimiter,
} from "@/lib/sportsradar/client";

// ─── Mock Prisma ────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiUsage: {
      create: vi.fn().mockResolvedValue({ id: "test-id" }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

// ─── Mock fetch ─────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimiter();
});

// ─── Key helpers ────────────────────────────────────────

describe("API key helpers", () => {
  it("getNflApiKey throws if env var is not set", () => {
    delete process.env.SPORTSRADAR_NFL_KEY;
    expect(() => getNflApiKey()).toThrow("SPORTSRADAR_NFL_KEY");
  });

  it("getNflApiKey returns the key when set", () => {
    process.env.SPORTSRADAR_NFL_KEY = "test-nfl-key";
    expect(getNflApiKey()).toBe("test-nfl-key");
    delete process.env.SPORTSRADAR_NFL_KEY;
  });

  it("getNcaafbApiKey throws if env var is not set", () => {
    delete process.env.SPORTSRADAR_NCAAFB_KEY;
    expect(() => getNcaafbApiKey()).toThrow("SPORTSRADAR_NCAAFB_KEY");
  });

  it("getNcaambApiKey throws if env var is not set", () => {
    delete process.env.SPORTSRADAR_NCAAMB_KEY;
    expect(() => getNcaambApiKey()).toThrow("SPORTSRADAR_NCAAMB_KEY");
  });
});

// ─── logApiCall ─────────────────────────────────────────

describe("logApiCall", () => {
  it("creates an ApiUsage record", async () => {
    const { prisma } = await import("@/lib/prisma");
    await logApiCall("nfl", "season_schedule");
    expect(prisma.apiUsage.create).toHaveBeenCalledWith({
      data: { sport: "nfl", endpoint: "season_schedule" },
    });
  });
});

// ─── getApiUsage ────────────────────────────────────────

describe("getApiUsage", () => {
  it("returns usage with correct structure", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.apiUsage.count).mockResolvedValueOnce(150);

    const result = await getApiUsage("nfl");
    expect(result).toEqual({
      used: 150,
      quota: 1000,
      remaining: 850,
      warning: false,
    });
  });

  it("returns warning=true when above 80% usage", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.apiUsage.count).mockResolvedValueOnce(850);

    const result = await getApiUsage("nfl");
    expect(result.warning).toBe(true);
    expect(result.remaining).toBe(150);
  });

  it("returns remaining=0 when over quota", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.apiUsage.count).mockResolvedValueOnce(1050);

    const result = await getApiUsage("nfl");
    expect(result.remaining).toBe(0);
    expect(result.warning).toBe(true);
  });
});

// ─── sportsradarFetch ───────────────────────────────────

describe("sportsradarFetch", () => {
  it("returns parsed JSON on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ teams: ["KC", "BUF"] }),
      headers: new Headers(),
    });

    const result = await sportsradarFetch<{ teams: string[] }>(
      "https://api.sportradar.com/nfl/test.json",
      { sport: "nfl", endpoint: "test" }
    );
    expect(result).toEqual({ teams: ["KC", "BUF"] });
  });

  it("logs the API call to usage tracking", async () => {
    const { prisma } = await import("@/lib/prisma");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });

    await sportsradarFetch("https://api.sportradar.com/nfl/test.json", {
      sport: "nfl",
      endpoint: "hierarchy",
    });

    expect(prisma.apiUsage.create).toHaveBeenCalledWith({
      data: { sport: "nfl", endpoint: "hierarchy" },
    });
  });

  it("throws on non-ok, non-429 responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: new Headers(),
    });

    await expect(
      sportsradarFetch("https://api.sportradar.com/nfl/test.json", {
        sport: "nfl",
        endpoint: "test",
      })
    ).rejects.toThrow("403");
  });

  it("retries on 429 status", async () => {
    // First call returns 429, second succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "1" }),
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ retried: true }),
        headers: new Headers(),
      });

    const result = await sportsradarFetch<{ retried: boolean }>(
      "https://api.sportradar.com/nfl/test.json",
      { sport: "nfl", endpoint: "test" }
    );
    expect(result).toEqual({ retried: true });
    // Called twice: original + retry
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
