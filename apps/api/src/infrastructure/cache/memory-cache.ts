import type { CachePort } from "../../domain/ports/cache.port";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple LRU + TTL in-memory cache. Process-local; swap to Redis adapter
 * for multi-instance deployments — the port stays identical.
 */
export class MemoryCache implements CachePort {
  private store = new Map<string, Entry<unknown>>();

  constructor(
    private readonly maxEntries: number = 10_000,
    private readonly defaultTtlSeconds: number = 60,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    // LRU touch
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    if (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  async invalidate(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}
