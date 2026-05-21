import { describe, it, expect } from "vitest";
import { MemoryCache } from "./memory-cache";

describe("MemoryCache", () => {
  it("stores and retrieves a value", async () => {
    const c = new MemoryCache(10, 60);
    await c.set("k", { a: 1 });
    expect(await c.get<{ a: number }>("k")).toEqual({ a: 1 });
  });

  it("returns null for unknown key", async () => {
    const c = new MemoryCache(10, 60);
    expect(await c.get("unknown")).toBeNull();
  });

  it("expires entries after TTL", async () => {
    const c = new MemoryCache(10, 60);
    await c.set("k", "v", 0); // 0s ttl = expired immediately on next ms
    await new Promise((r) => setTimeout(r, 5));
    expect(await c.get("k")).toBeNull();
  });

  it("invalidates by prefix", async () => {
    const c = new MemoryCache(10, 60);
    await c.set("folder:children:abc:0:10", "x");
    await c.set("folder:children:abc:cur:10", "y");
    await c.set("folder:roots:0:10", "z");
    await c.invalidate("folder:children:abc:");
    expect(await c.get("folder:children:abc:0:10")).toBeNull();
    expect(await c.get("folder:children:abc:cur:10")).toBeNull();
    expect(await c.get("folder:roots:0:10")).toBe("z");
  });

  it("enforces max entries (LRU eviction)", async () => {
    const c = new MemoryCache(2, 60);
    await c.set("a", 1);
    await c.set("b", 2);
    await c.set("c", 3);
    expect(await c.get("a")).toBeNull(); // a was evicted
    expect(await c.get("b")).toBe(2);
    expect(await c.get("c")).toBe(3);
  });
});
