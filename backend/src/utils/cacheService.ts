/**
 * Application cache store.
 * Supports synchronous in-memory access for fast lookups and backward compatibility,
 * with zero external dependency (replacing legacy node-cache).
 */

interface CacheItem<T = unknown> {
  value: T;
  expiresAt: number;
}

class MemoryCacheStore {
  private readonly store = new Map<string, CacheItem>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlSeconds = 300) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  get<T = unknown>(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  set<T = unknown>(key: string, value: T, ttlSeconds?: number): void {
    const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(keys: string | string[]): void {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      this.store.delete(key);
    }
  }

  keys(): string[] {
    const now = Date.now();
    const activeKeys: string[] = [];
    for (const [key, item] of this.store.entries()) {
      if (now <= item.expiresAt) {
        activeKeys.push(key);
      } else {
        this.store.delete(key);
      }
    }
    return activeKeys;
  }

  flushAll(): void {
    this.store.clear();
  }
}

export const appCache = new MemoryCacheStore(300);

/**
 * Invalidate cache entries by key prefix.
 * Call this after admin creates/updates/deletes products, sales, vouchers, etc.
 * Example: invalidateCacheByPrefix('products') clears all product-related cache.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  const keys = appCache.keys().filter((key: string) => key.startsWith(prefix));
  if (keys.length > 0) {
    appCache.del(keys);
  }
}

/** Flush the entire cache. Use sparingly. */
export function invalidateAllCache(): void {
  appCache.flushAll();
}
