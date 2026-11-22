import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryStore = new Map<string, CacheEntry>();
  private memoryCleanupTimer: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.memoryCleanupTimer = setInterval(() => this.cleanupExpiredMemoryKeys(), 60000);
    if (this.memoryCleanupTimer.unref) {
      this.memoryCleanupTimer.unref();
    }
  }

  async onModuleInit(): Promise<void> {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      this.logger.log('REDIS_URL not configured. Operating in in-memory fallback mode.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn(`Redis reconnect stopped after ${times} attempts. Falling back to memory cache.`);
            return null;
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis successfully.');
      });

      this.client.on('error', (err: Error) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}. Operating in memory fallback mode.`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.isConnected = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not connect to Redis at startup (${message}). Falling back to in-memory cache.`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
      this.memoryCleanupTimer = null;
    }
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.isHealthy() && this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch (error) {
        this.logger.warn(`Redis get("${key}") failed: ${error instanceof Error ? error.message : String(error)}. Reading from memory.`);
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryStore.set(key, { value: serialized, expiresAt });

    if (this.isHealthy() && this.client) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } catch (error) {
        this.logger.warn(`Redis set("${key}") failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async del(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of keyList) {
      this.memoryStore.delete(k);
    }

    if (this.isHealthy() && this.client && keyList.length > 0) {
      try {
        await this.client.del(...keyList);
      } catch (error) {
        this.logger.warn(`Redis del failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    for (const key of Array.from(this.memoryStore.keys())) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }

    if (this.isHealthy() && this.client) {
      try {
        const stream = this.client.scanStream({ match: `${prefix}*`, count: 100 });
        const keysToDelete: string[] = [];
        for await (const resultKeys of stream) {
          const list = resultKeys as string[];
          if (list.length > 0) {
            keysToDelete.push(...list);
          }
        }
        if (keysToDelete.length > 0) {
          await this.client.del(...keysToDelete);
        }
      } catch (error) {
        this.logger.warn(`Redis scan/delete prefix("${prefix}") failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async flushAll(): Promise<void> {
    this.memoryStore.clear();
    if (this.isHealthy() && this.client) {
      try {
        await this.client.flushdb();
      } catch (error) {
        this.logger.warn(`Redis flushdb failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private cleanupExpiredMemoryKeys(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}
