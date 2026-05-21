import {
  bigint,
  customType,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom ltree column type — Drizzle has no built-in.
const ltree = customType<{ data: string; driverData: string }>({
  dataType() {
    return "ltree";
  },
});

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    parentId: uuid("parent_id"),
    name: varchar("name", { length: 255 }).notNull(),
    path: ltree("path").notNull(),
    depth: smallint("depth").notNull().default(0),
    itemCount: integer("item_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    parentIdx: index("idx_folders_parent_id").on(t.parentId),
    // GIST + GIN indexes are added via raw SQL in migrations (see migrations/0001_indexes.sql).
    uniqueParentName: uniqueIndex("uq_folders_parent_name").on(t.parentId, t.name),
  }),
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 127 }),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    extension: varchar("extension", { length: 16 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    folderIdx: index("idx_files_folder_id").on(t.folderId),
  }),
);

export type FolderRow = typeof folders.$inferSelect;
export type FileRow = typeof files.$inferSelect;
