/**
 * Seed the database with a medical-themed folder tree matching the
 * MedExplorer mock in medexplorer.html.
 *
 * Top-level (sidebar categories from the mock):
 *   - Shared Files
 *   - Patient Records
 *   - Lab Results
 *   - Clinical Trials
 *   - Archive
 *
 * Re-run: bun run db:seed             (skips if data exists)
 *         bun run db:seed -- --force  (wipes folders+files then re-seeds)
 */
import { loadEnv } from "../src/config/env";
import { createDb, closeDb } from "../src/infrastructure/persistence/drizzle/client";
import { DrizzleFolderRepository } from "../src/infrastructure/persistence/drizzle/repositories/folder.repository";
import { files, folders } from "../src/infrastructure/persistence/drizzle/schema";
import { eq } from "drizzle-orm";

interface SeedNode {
  name: string;
  children?: SeedNode[];
  files?: Array<{ name: string; sizeBytes: number; mimeType: string; extension: string }>;
}

const tree: SeedNode[] = [
  {
    name: "Shared Files",
    children: [
      {
        name: "Cross-Department Reports",
        files: [
          { name: "Quarterly_Summary.pdf", sizeBytes: 1_800_000, mimeType: "application/pdf", extension: "pdf" },
        ],
      },
      { name: "Policies & SOPs" },
      { name: "Onboarding Material" },
    ],
  },
  {
    name: "Patient Records",
    children: [
      {
        name: "MRI Scans",
        children: [
          {
            name: "Patient_Doe",
            files: [
              { name: "Patient_Doe_MRI_Report.pdf", sizeBytes: 2_400_000, mimeType: "application/pdf", extension: "pdf" },
              { name: "Patient_Doe_MRI_T1.dcm", sizeBytes: 18_400_000, mimeType: "application/dicom", extension: "dcm" },
            ],
          },
          { name: "Patient_Smith" },
          { name: "Archive 2024" },
        ],
      },
      {
        name: "Vaccination Records",
        children: [
          { name: "COVID-19" },
          { name: "Influenza" },
          { name: "HPV" },
        ],
      },
      {
        name: "Telemedicine Logs",
        children: [{ name: "Q1" }, { name: "Q2" }, { name: "Q3" }],
      },
    ],
  },
  {
    name: "Lab Results",
    children: [
      {
        name: "Genomic Data",
        children: [
          { name: "Reference Genome" },
          {
            name: "Variant Calls",
            children: [{ name: "2025-Q1" }, { name: "2025-Q2" }],
          },
        ],
      },
      {
        name: "Blood Panels",
        files: [
          { name: "CBC_Apr_2026.csv", sizeBytes: 92_000, mimeType: "text/csv", extension: "csv" },
        ],
      },
      { name: "Microbiology Cultures" },
    ],
  },
  {
    name: "Clinical Trials",
    children: [
      {
        name: "Q3 Clinical Trials",
        children: [
          { name: "Protocols" },
          { name: "Consent Forms" },
          {
            name: "Datasets",
            files: [
              { name: "Q3_Trial_Dataset_V2.xlsx", sizeBytes: 14_800_000, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" },
              { name: "Q3_Adverse_Events.csv", sizeBytes: 420_000, mimeType: "text/csv", extension: "csv" },
            ],
          },
        ],
      },
      {
        name: "Q2 Clinical Trials",
        children: [{ name: "Final Report" }],
      },
    ],
  },
  {
    name: "Archive",
    children: [
      {
        name: "Billing & Insurance",
        children: [{ name: "Invoices" }, { name: "Claims" }],
      },
      { name: "Legacy Records 2020-2023" },
    ],
  },
];

async function insertNode(
  repo: DrizzleFolderRepository,
  node: SeedNode,
  parentId: string | null,
  db: ReturnType<typeof createDb>["db"],
) {
  const folder = await repo.create({ name: node.name, parentId });
  if (node.files) {
    for (const f of node.files) {
      await db.insert(files).values({
        folderId: folder.id,
        name: f.name,
        sizeBytes: f.sizeBytes,
        mimeType: f.mimeType,
        extension: f.extension,
      });
    }
  }
  if (node.children) {
    for (const child of node.children) {
      await insertNode(repo, child, folder.id, db);
    }
  }
}

async function run() {
  const force = process.argv.includes("--force");

  const env = loadEnv();
  const { db } = createDb(env.DATABASE_URL);
  const repo = new DrizzleFolderRepository(db);

  const existingRoots = await db.select().from(folders).where(eq(folders.depth, 0));

  if (existingRoots.length > 0) {
    if (!force) {
      console.log(
        `Seed skipped — ${existingRoots.length} root folders already exist. Use --force to wipe and re-seed.`,
      );
      await closeDb();
      return;
    }
    console.log(`--force: clearing ${existingRoots.length} existing root folders (cascade deletes everything)…`);
    for (const root of existingRoots) {
      await repo.delete(root.id);
    }
  }

  console.log("Seeding MedExplorer folder tree…");
  for (const root of tree) {
    await insertNode(repo, root, null, db);
  }
  console.log(`Seed complete. ${tree.length} root folders created.`);
  await closeDb();
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  await closeDb();
  process.exit(1);
});
