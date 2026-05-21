import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(60),
  CACHE_MAX_ENTRIES: z.coerce.number().int().min(10).default(10000),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Walk up from cwd to find the monorepo root `.env` and merge it into
 * process.env (without overwriting variables that are already set).
 *
 * Bun only auto-loads `.env` from the immediate cwd, but our scripts run
 * from `apps/api/`, so we need to look upward.
 */
function loadDotenvFromRoot(): void {
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) {
      const contents = readFileSync(candidate, "utf8");
      for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
      }
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

let cached: Env | null = null;
export function loadEnv(): Env {
  if (cached) return cached;
  loadDotenvFromRoot();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    console.error("Searched for .env starting from:", process.cwd());
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  return cached;
}
