import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFromCache,
  setInCache,
  invalidateCache,
  getCacheSize,
} from "@/lib/api-cache";

describe("API Cache", () => {
  beforeEach(() => {
    // Clear cache before each test
    invalidateCache();
  });

  describe("getFromCache", () => {
    it("returns null for uncached keys", () => {
      const result = getFromCache("non-existent-key");
      expect(result).toBeNull();
    });

    it("returns cached data and fresh status", () => {
      setInCache("test-key", { value: "test-data" });
      const result = getFromCache("test-key");

      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ value: "test-data" });
      expect(result?.fresh).toBe(true);
    });

    it("returns fresh=true within fresh window", () => {
      setInCache("test-key", { value: "data" });
      const result = getFromCache("test-key", { freshMs: 1000 });

      expect(result?.fresh).toBe(true);
    });

    it("returns fresh=false within stale window", () => {
      setInCache("test-key", { value: "data" });

      // Wait past the fresh window but within stale window
      vi.useFakeTimers();
      const startTime = Date.now();
      vi.setSystemTime(startTime + 100 * 1000); // 100 seconds later

      const result = getFromCache("test-key", {
        freshMs: 60 * 1000,
        staleMs: 120 * 1000,
      });

      vi.useRealTimers();
      expect(result?.fresh).toBe(false);
    });

    it("returns null after stale window expires", () => {
      vi.useFakeTimers();
      const startTime = Date.now();

      setInCache("test-key", { value: "data" });

      // Move time beyond stale window
      vi.setSystemTime(startTime + 6 * 60 * 1000); // 6 minutes later

      const result = getFromCache("test-key", { staleMs: 5 * 60 * 1000 });

      vi.useRealTimers();
      expect(result).toBeNull();
    });

    it("removes expired entries from cache", () => {
      vi.useFakeTimers();
      const startTime = Date.now();

      setInCache("test-key", { value: "data" });
      expect(getCacheSize()).toBe(1);

      // Move time beyond stale window
      vi.setSystemTime(startTime + 6 * 60 * 1000);

      getFromCache("test-key", { staleMs: 5 * 60 * 1000 });

      vi.useRealTimers();
      expect(getCacheSize()).toBe(0);
    });
  });

  describe("setInCache", () => {
    it("stores data in cache", () => {
      setInCache("key-1", { id: 1, name: "Test" });

      const result = getFromCache("key-1");
      expect(result?.data).toEqual({ id: 1, name: "Test" });
    });

    it("overwrites existing cache entries", () => {
      setInCache("key-1", { value: "old" });
      setInCache("key-1", { value: "new" });

      const result = getFromCache("key-1");
      expect(result?.data).toEqual({ value: "new" });
    });

    it("stores multiple independent entries", () => {
      setInCache("key-1", { data: "value1" });
      setInCache("key-2", { data: "value2" });
      setInCache("key-3", { data: "value3" });

      expect(getFromCache("key-1")?.data).toEqual({ data: "value1" });
      expect(getFromCache("key-2")?.data).toEqual({ data: "value2" });
      expect(getFromCache("key-3")?.data).toEqual({ data: "value3" });
    });

    it("handles large objects", () => {
      const largeObject = {
        teams: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Team ${i}`,
          stats: { wins: Math.floor(Math.random() * 17) },
        })),
      };

      setInCache("large-key", largeObject);
      const result = getFromCache("large-key");

      expect(result?.data).toEqual(largeObject);
      expect((result?.data as typeof largeObject).teams).toHaveLength(100);
    });
  });

  describe("invalidateCache", () => {
    it("clears all cache with no pattern", () => {
      setInCache("key-1", { data: "value1" });
      setInCache("key-2", { data: "value2" });
      setInCache("key-3", { data: "value3" });

      expect(getCacheSize()).toBe(3);

      invalidateCache();

      expect(getCacheSize()).toBe(0);
      expect(getFromCache("key-1")).toBeNull();
      expect(getFromCache("key-2")).toBeNull();
      expect(getFromCache("key-3")).toBeNull();
    });

    it("clears matching keys with pattern", () => {
      setInCache("user:1:profile", { name: "Alice" });
      setInCache("user:1:settings", { theme: "dark" });
      setInCache("user:2:profile", { name: "Bob" });
      setInCache("post:1", { title: "Test" });

      invalidateCache("user:1");

      expect(getFromCache("user:1:profile")).toBeNull();
      expect(getFromCache("user:1:settings")).toBeNull();
      expect(getFromCache("user:2:profile")).not.toBeNull();
      expect(getFromCache("post:1")).not.toBeNull();
    });

    it("clears multiple matching keys with pattern", () => {
      setInCache("api:teams:all", { data: [] });
      setInCache("api:teams:2024", { data: [] });
      setInCache("api:players:all", { data: [] });
      setInCache("cache:other", { data: [] });

      invalidateCache("api:teams");

      expect(getFromCache("api:teams:all")).toBeNull();
      expect(getFromCache("api:teams:2024")).toBeNull();
      expect(getFromCache("api:players:all")).not.toBeNull();
      expect(getFromCache("cache:other")).not.toBeNull();
    });

    it("is case-sensitive for pattern matching", () => {
      setInCache("User:1", { name: "Alice" });
      setInCache("user:2", { name: "Bob" });

      invalidateCache("user:");

      expect(getFromCache("User:1")).not.toBeNull();
      expect(getFromCache("user:2")).toBeNull();
    });
  });

  describe("getCacheSize", () => {
    it("returns 0 for empty cache", () => {
      expect(getCacheSize()).toBe(0);
    });

    it("returns correct number of entries", () => {
      setInCache("key-1", { data: 1 });
      expect(getCacheSize()).toBe(1);

      setInCache("key-2", { data: 2 });
      expect(getCacheSize()).toBe(2);

      setInCache("key-3", { data: 3 });
      expect(getCacheSize()).toBe(3);
    });

    it("counts overwritten entries as one", () => {
      setInCache("key-1", { data: "old" });
      expect(getCacheSize()).toBe(1);

      setInCache("key-1", { data: "new" });
      expect(getCacheSize()).toBe(1);
    });
  });

  describe("cache eviction", () => {
    it("evicts oldest entries when cache exceeds 500 entries", () => {
      // Add 501 entries
      for (let i = 0; i < 501; i++) {
        setInCache(`key-${i}`, { index: i });
      }

      // After eviction, cache size should be around 451 (500 - 50 evicted + new 1)
      const size = getCacheSize();
      expect(size).toBeLessThanOrEqual(500);
      expect(size).toBeGreaterThan(450);

      // The oldest entries should be gone
      expect(getFromCache("key-0")).toBeNull();
      expect(getFromCache("key-1")).toBeNull();
    });

    it("preserves newer entries during eviction", () => {
      // Add 550 entries
      for (let i = 0; i < 550; i++) {
        setInCache(`key-${i}`, { index: i });
      }

      // Newer entries should still be cached
      expect(getFromCache("key-549")).not.toBeNull();
      expect(getFromCache("key-548")).not.toBeNull();
    });
  });

  describe("generic type support", () => {
    it("supports different data types", () => {
      setInCache("string-key", "simple string");
      setInCache("number-key", 42);
      setInCache("array-key", [1, 2, 3]);
      setInCache("object-key", { a: 1, b: 2 });

      expect(getFromCache<string>("string-key")?.data).toBe("simple string");
      expect(getFromCache<number>("number-key")?.data).toBe(42);
      expect(getFromCache<number[]>("array-key")?.data).toEqual([1, 2, 3]);
      expect(getFromCache<{ a: number; b: number }>("object-key")?.data).toEqual(
        { a: 1, b: 2 }
      );
    });
  });
});
