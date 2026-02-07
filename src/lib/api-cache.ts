interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_FRESH_MS = 60 * 1000; // 1 minute fresh
const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutes stale

export function getFromCache<T>(
  key: string,
  options?: { freshMs?: number; staleMs?: number }
): { data: T; fresh: boolean } | null {
  const entry = apiCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const now = Date.now();
  const staleMs = options?.staleMs ?? DEFAULT_STALE_MS;

  // Expired completely
  if (now - entry.timestamp > staleMs) {
    apiCache.delete(key);
    return null;
  }

  const freshMs = options?.freshMs ?? DEFAULT_FRESH_MS;
  const fresh = now - entry.timestamp < freshMs;
  return { data: entry.data, fresh };
}

export function setInCache<T>(key: string, data: T): void {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    staleAt: Date.now() + DEFAULT_STALE_MS,
  });

  // Evict if too large
  if (apiCache.size > 500) {
    const entries = Array.from(apiCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    const toRemove = entries.slice(0, 50);
    for (const [k] of toRemove) {
      apiCache.delete(k);
    }
  }
}

export function invalidateCache(keyPattern?: string): void {
  if (!keyPattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(keyPattern)) {
      apiCache.delete(key);
    }
  }
}

export function getCacheSize(): number {
  return apiCache.size;
}
