import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let cached: { db: Db; sql: ReturnType<typeof postgres> } | null = null;

export function createDb(url: string): { db: Db; sql: ReturnType<typeof postgres> } {
  if (cached) return cached;
  const sql = postgres(url, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,
  });
  const db = drizzle(sql, { schema });
  cached = { db, sql };
  return cached;
}

export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.sql.end({ timeout: 5 });
    cached = null;
  }
}
