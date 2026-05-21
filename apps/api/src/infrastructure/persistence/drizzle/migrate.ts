/**
 * Simple file-based migrator: applies every *.sql under ./migrations in
 * lexicographic order if not already recorded in __migrations.
 * Idempotent — safe to re-run.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { loadEnv } from "../../../config/env";

async function run() {
  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const dir = join(import.meta.dir ?? __dirname, "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  // Ensure tracking table exists (the very first migration creates it).
  try {
    await sql`SELECT 1 FROM "__migrations" LIMIT 1`;
  } catch {
    /* first run — will be created by 0000_initial */
  }

  for (const file of files) {
    const path = join(dir, file);
    const contents = await readFile(path, "utf8");

    let applied: { name: string }[] = [];
    try {
      applied = await sql<{ name: string }[]>`
        SELECT name FROM "__migrations" WHERE name = ${file}
      `;
    } catch {
      applied = [];
    }

    if (applied.length > 0) {
      console.log(`✓ ${file} already applied`);
      continue;
    }

    console.log(`→ Applying ${file}`);
    await sql.unsafe(contents);
    await sql`
      INSERT INTO "__migrations" (name) VALUES (${file})
      ON CONFLICT (name) DO NOTHING
    `;
    console.log(`✓ ${file}`);
  }

  await sql.end();
  console.log("Migrations complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
