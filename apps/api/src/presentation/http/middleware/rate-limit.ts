import { Elysia } from "elysia";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface Opts {
  capacity: number;
  refillPerSecond: number;
}

/**
 * Lightweight in-process token-bucket per client IP. For multi-instance
 * deployments, swap with Redis-backed implementation behind the same plugin.
 */
export function rateLimit(opts: Opts = { capacity: 120, refillPerSecond: 60 }) {
  const buckets = new Map<string, Bucket>();
  return new Elysia({ name: "rate-limit" }).onRequest(({ request, set }) => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const now = Date.now();
    let b = buckets.get(ip);
    if (!b) {
      b = { tokens: opts.capacity, lastRefill: now };
      buckets.set(ip, b);
    }
    const elapsed = (now - b.lastRefill) / 1000;
    b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSecond);
    b.lastRefill = now;
    if (b.tokens < 1) {
      set.status = 429;
      throw new Response(
        JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many requests" } }),
        { status: 429, headers: { "content-type": "application/json" } },
      );
    }
    b.tokens -= 1;
  });
}
