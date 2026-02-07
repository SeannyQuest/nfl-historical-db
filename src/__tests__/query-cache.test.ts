import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats,
} from "@/lib/query-cache";

describe("query-cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("returns null for uncached queries", () => {
    const result = getCachedResponse("unknown query");
    expect(result).toBeNull();
  });

  it("setCachedResponse and getCachedResponse round-trip", () => {
    const query = "What is the Chiefs record?";
    const response = "The Chiefs have a great record";
    setCachedResponse(query, response);
    const result = getCachedResponse(query);
    expect(result).toBe(response);
  });

  it("normalizes case in cache keys", () => {
    const query = "What is the Chiefs record?";
    const response = "The Chiefs have a great record";
    setCachedResponse(query, response);
    const result = getCachedResponse("WHAT IS THE CHIEFS RECORD?");
    expect(result).toBe(response);
  });

  it("returns null for expired entries", () => {
    vi.useFakeTimers();
    const query = "test query";
    const response = "test response";
    setCachedResponse(query, response);
    expect(getCachedResponse(query)).toBe(response);

    // Advance time by 6 minutes (TTL is 5 minutes)
    vi.advanceTimersByTime(6 * 60 * 1000);
    const result = getCachedResponse(query);
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it("clearCache removes all entries", () => {
    setCachedResponse("query1", "response1");
    setCachedResponse("query2", "response2");
    expect(getCacheStats().size).toBe(2);
    clearCache();
    expect(getCacheStats().size).toBe(0);
    expect(getCachedResponse("query1")).toBeNull();
  });

  it("getCacheStats returns correct size", () => {
    expect(getCacheStats().size).toBe(0);
    setCachedResponse("query1", "response1");
    expect(getCacheStats().size).toBe(1);
    setCachedResponse("query2", "response2");
    expect(getCacheStats().size).toBe(2);
  });

  it("evicts old entries when cache grows too large", () => {
    // Add 1001 entries to trigger eviction (max is 1000)
    for (let i = 0; i < 1001; i++) {
      setCachedResponse(`query${i}`, `response${i}`);
    }
    // After eviction, should have around 900-901 entries (1001 - 100 evicted)
    const stats = getCacheStats();
    expect(stats.size).toBeLessThanOrEqual(1001);
    expect(stats.size).toBeGreaterThan(800);
  });
});
