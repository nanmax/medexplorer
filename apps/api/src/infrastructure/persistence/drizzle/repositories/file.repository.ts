import { and, asc, eq, sql } from "drizzle-orm";
import type {
  FileRepositoryPort,
  NewFileInput,
} from "../../../../domain/ports/file.repository.port";
import type {
  CursorPage,
  ListChildrenOpts,
} from "../../../../domain/ports/folder.repository.port";
import { FileItem } from "../../../../domain/entities/file.entity";
import { FileNotFoundError } from "../../../../application/errors/domain-errors";
import type { Db } from "../client";
import { files } from "../schema";
import { toFile } from "../mappers";

function encodeCursor(name: string, id: string): string {
  return Buffer.from(`${name}|${id}`, "utf8").toString("base64url");
}
function decodeCursor(cursor: string): { name: string; id: string } | null {
  try {
    const [name, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    if (!name || !id) return null;
    return { name, id };
  } catch {
    return null;
  }
}

export class DrizzleFileRepository implements FileRepositoryPort {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<FileItem | null> {
    const rows = await this.db.select().from(files).where(eq(files.id, id)).limit(1);
    return rows[0] ? toFile(rows[0]) : null;
  }

  async listByFolder(folderId: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>> {
    const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
    const limitPlusOne = opts.limit + 1;
    const cursorCond = cursor
      ? sql`(${files.name}, ${files.id}) > (${cursor.name}, ${cursor.id}::uuid)`
      : sql`true`;
    const rows = await this.db
      .select()
      .from(files)
      .where(and(eq(files.folderId, folderId), cursorCond))
      .orderBy(asc(files.name), asc(files.id))
      .limit(limitPlusOne);

    const hasMore = rows.length > opts.limit;
    const page = hasMore ? rows.slice(0, opts.limit) : rows;
    const last = page[page.length - 1];
    return {
      items: page.map(toFile),
      nextCursor: hasMore && last ? encodeCursor(last.name, last.id) : null,
    };
  }

  async delete(id: string): Promise<void> {
    const res = await this.db.delete(files).where(eq(files.id, id)).returning({ id: files.id });
    if (res.length === 0) throw new FileNotFoundError(id);
  }

  async create(input: NewFileInput): Promise<FileItem> {
    const [row] = await this.db
      .insert(files)
      .values({
        folderId: input.folderId,
        name: input.name,
        sizeBytes: input.sizeBytes,
        mimeType: input.mimeType,
        extension: input.extension,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return toFile(row);
  }

  async searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>> {
    const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
    const limitPlusOne = opts.limit + 1;
    const cursorCond = cursor
      ? sql`(${files.name}, ${files.id}) > (${cursor.name}, ${cursor.id}::uuid)`
      : sql`true`;
    const rows = await this.db
      .select()
      .from(files)
      .where(and(sql`${files.name} ILIKE ${"%" + q + "%"}`, cursorCond))
      .orderBy(asc(files.name), asc(files.id))
      .limit(limitPlusOne);
    const hasMore = rows.length > opts.limit;
    const page = hasMore ? rows.slice(0, opts.limit) : rows;
    const last = page[page.length - 1];
    return {
      items: page.map(toFile),
      nextCursor: hasMore && last ? encodeCursor(last.name, last.id) : null,
    };
  }
}
