import NodeCache from 'node-cache';

// stdTTL: Default time-to-live is 5 minutes (300 seconds)
// checkperiod: Delete expired keys every 60 seconds
export const appCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * BUG #16 fix: Invalidate cache entries by key prefix.
 * Call this after admin creates/updates/deletes products, sales, vouchers, etc.
 * Example: invalidateCacheByPrefix('products') clears all product-related cache.
 */
export function invalidateCacheByPrefix(prefix: string): void {
    const keys = appCache.keys().filter(key => key.startsWith(prefix));
    if (keys.length > 0) appCache.del(keys);
}

/** Flush the entire cache. Use sparingly. */
export function invalidateAllCache(): void {
    appCache.flushAll();
}
