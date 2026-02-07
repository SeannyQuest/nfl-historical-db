interface CacheEntry {
  response: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedResponse(query: string): string | null {
  const normalized = query.toLowerCase().trim();
  const entry = cache.get(normalized);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(normalized);
    return null;
  }
  return entry.response;
}

export function setCachedResponse(query: string, response: string): void {
  const normalized = query.toLowerCase().trim();
  cache.set(normalized, { response, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 1000) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100);
    for (const [key] of oldest) {
      cache.delete(key);
    }
  }
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; maxSize: number } {
  return { size: cache.size, maxSize: 1000 };
}
