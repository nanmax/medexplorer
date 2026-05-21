/**
 * Stress seed: generates a large synthetic folder tree to verify scalability.
 *
 * Usage:
 *   bun run apps/api/scripts/stress-seed.ts --folders 1000000 --depth 5 --fanout 10
 *
 * Inserts in batches via COPY-like bulk insert; safe to run on a real Postgres
 * — but DO NOT run against your demo data unless you want clutter.
 */
import { loadEnv } from "../src/config/env";
import { createDb, closeDb } from "../src/infrastructure/persistence/drizzle/client";
import { folders } from "../src/infrastructure/persistence/drizzle/schema";

interface Args {
  folders: number;
  depth: number;
  fanout: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (name: string, fallback: number) => {
    const i = argv.indexOf(`--${name}`);
    if (i < 0) return fallback;
    const v = argv[i + 1];
    return v ? Number(v) : fallback;
  };
  return {
    folders: get("folders", 100_000),
    depth: get("depth", 4),
    fanout: get("fanout", 12),
  };
}

async function run() {
  const args = parseArgs();
  console.log(`Generating ${args.folders.toLocaleString()} folders (max depth ${args.depth}, fanout ${args.fanout})…`);
  const env = loadEnv();
  const { db } = createDb(env.DATABASE_URL);

  const BATCH = 5000;
  let inserted = 0;
  let levelIds: string[] = [];

  // Insert level 0 (roots) first
  const rootBatch: { name: string; path: string; depth: number }[] = [];
  for (let i = 0; i < args.fanout && inserted < args.folders; i++) {
    rootBatch.push({ name: `Root_${i}`, path: `root_${i}`, depth: 0 });
    inserted++;
  }
  const roots = await db.insert(folders).values(rootBatch).returning({ id: folders.id, path: folders.path });
  levelIds = roots.map((r) => r.id);
  let parentPaths = new Map(roots.map((r) => [r.id, r.path]));

  for (let d = 1; d <= args.depth && inserted < args.folders; d++) {
    const nextLevelIds: string[] = [];
    const nextLevelPaths = new Map<string, string>();
    const buf: { parentId: string; name: string; path: string; depth: number }[] = [];

    for (const pid of levelIds) {
      const ppath = parentPaths.get(pid)!;
      for (let c = 0; c < args.fanout && inserted < args.folders; c++) {
        const name = `Folder_d${d}_${pid.slice(0, 8)}_${c}`;
        const path = `${ppath}.f${c}_${d}`;
        buf.push({ parentId: pid, name, path, depth: d });
        inserted++;
        if (buf.length >= BATCH) {
          const rows = await db.insert(folders).values(buf.splice(0)).returning({ id: folders.id, path: folders.path });
          for (const r of rows) {
            nextLevelIds.push(r.id);
            nextLevelPaths.set(r.id, r.path);
          }
          console.log(`  inserted ${inserted.toLocaleString()} / ${args.folders.toLocaleString()}`);
        }
      }
    }
    if (buf.length > 0) {
      const rows = await db.insert(folders).values(buf).returning({ id: folders.id, path: folders.path });
      for (const r of rows) {
        nextLevelIds.push(r.id);
        nextLevelPaths.set(r.id, r.path);
      }
    }
    levelIds = nextLevelIds;
    parentPaths = nextLevelPaths;
    console.log(`level ${d} done — running total ${inserted.toLocaleString()}`);
  }

  console.log(`Inserted ${inserted.toLocaleString()} folders.`);
  await closeDb();
}

run().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
