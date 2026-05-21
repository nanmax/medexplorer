import { and, asc, eq, gt, isNull, sql, inArray } from "drizzle-orm";
import type {
  CursorPage,
  FolderBreadcrumbItem,
  FolderRepositoryPort,
  ListChildrenOpts,
  NewFolderInput,
} from "../../../../domain/ports/folder.repository.port";
import { Folder } from "../../../../domain/entities/folder.entity";
import {
  DuplicateFolderError,
  FolderNotFoundError,
} from "../../../../application/errors/domain-errors";
import { FolderPath } from "../../../../domain/value-objects/folder-path.vo";
import type { Db } from "../client";
import { folders, files, type FolderRow } from "../schema";
import { toFolder } from "../mappers";

/**
 * Cursor encoding: base64 of "<name>|<id>" — keyset pagination on (name, id).
 * Stable across requests, immune to insertions shifting offsets.
 */
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

export class DrizzleFolderRepository implements FolderRepositoryPort {
  constructor(private readonly db: Db) {}

  /**
   * Hydrates rows with `hasChildren` and a freshly-computed `itemCount`
   * (sub-folders + files). Computing at read time means we never have to
   * maintain a denormalized counter on insert/delete/move.
   */
  private async withHasChildren(rows: FolderRow[]): Promise<Folder[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);

    const [subCounts, fileCounts] = await Promise.all([
      this.db
        .select({ parentId: folders.parentId, c: sql<number>`count(*)::int` })
        .from(folders)
        .where(inArray(folders.parentId, ids))
        .groupBy(folders.parentId),
      this.db
        .select({ folderId: files.folderId, c: sql<number>`count(*)::int` })
        .from(files)
        .where(inArray(files.folderId, ids))
        .groupBy(files.folderId),
    ]);

    const subMap = new Map<string, number>();
    for (const c of subCounts) if (c.parentId) subMap.set(c.parentId, c.c);
    const fileMap = new Map<string, number>();
    for (const c of fileCounts) fileMap.set(c.folderId, c.c);

    return rows.map((r) => {
      const subs = subMap.get(r.id) ?? 0;
      const filesCount = fileMap.get(r.id) ?? 0;
      return toFolder({ ...r, itemCount: subs + filesCount }, subs > 0);
    });
  }

  async findById(id: string): Promise<Folder | null> {
    const rows = await this.db.select().from(folders).where(eq(folders.id, id)).limit(1);
    if (rows.length === 0) return null;
    const [f] = await this.withHasChildren(rows);
    return f ?? null;
  }

  async listRoots(opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    return this.listByParent(null, opts);
  }

  async listChildren(parentId: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    return this.listByParent(parentId, opts);
  }

  private async listByParent(
    parentId: string | null,
    opts: ListChildrenOpts,
  ): Promise<CursorPage<Folder>> {
    const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
    const limitPlusOne = opts.limit + 1;
    const parentCond = parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId);
    const cursorCond = cursor
      ? sql`(${folders.name}, ${folders.id}) > (${cursor.name}, ${cursor.id}::uuid)`
      : sql`true`;

    const rows = await this.db
      .select()
      .from(folders)
      .where(and(parentCond, cursorCond))
      .orderBy(asc(folders.name), asc(folders.id))
      .limit(limitPlusOne);

    const hasMore = rows.length > opts.limit;
    const page = hasMore ? rows.slice(0, opts.limit) : rows;
    const items = await this.withHasChildren(page);
    const last = page[page.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(last.name, last.id) : null,
    };
  }

  async breadcrumb(id: string): Promise<FolderBreadcrumbItem[]> {
    const target = await this.db.select().from(folders).where(eq(folders.id, id)).limit(1);
    const node = target[0];
    if (!node) throw new FolderNotFoundError(id);
    // ltree @> gives ancestors; order by depth ASC = root → node.
    const rows = await this.db
      .select({ id: folders.id, name: folders.name, depth: folders.depth })
      .from(folders)
      .where(sql`${folders.path} @> ${node.path}::ltree`)
      .orderBy(asc(folders.depth));
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async subtree(rootId: string | null, maxDepth: number): Promise<Folder[]> {
    if (rootId === null) {
      const rows = await this.db
        .select()
        .from(folders)
        .where(sql`${folders.depth} <= ${maxDepth}`)
        .orderBy(asc(folders.path));
      return this.withHasChildren(rows);
    }
    const root = await this.db.select().from(folders).where(eq(folders.id, rootId)).limit(1);
    const r = root[0];
    if (!r) throw new FolderNotFoundError(rootId);
    const rows = await this.db
      .select()
      .from(folders)
      .where(
        and(
          sql`${folders.path} <@ ${r.path}::ltree`,
          sql`${folders.depth} <= ${r.depth + maxDepth}`,
        ),
      )
      .orderBy(asc(folders.path));
    return this.withHasChildren(rows);
  }

  async searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
    const limitPlusOne = opts.limit + 1;
    const cursorCond = cursor
      ? sql`(${folders.name}, ${folders.id}) > (${cursor.name}, ${cursor.id}::uuid)`
      : sql`true`;
    const rows = await this.db
      .select()
      .from(folders)
      .where(and(sql`${folders.name} ILIKE ${"%" + q + "%"}`, cursorCond))
      .orderBy(asc(folders.name), asc(folders.id))
      .limit(limitPlusOne);
    const hasMore = rows.length > opts.limit;
    const page = hasMore ? rows.slice(0, opts.limit) : rows;
    const items = await this.withHasChildren(page);
    const last = page[page.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(last.name, last.id) : null,
    };
  }

  async create(input: NewFolderInput): Promise<Folder> {
    const parent = input.parentId
      ? (await this.db.select().from(folders).where(eq(folders.id, input.parentId)).limit(1))[0]
      : null;
    if (input.parentId && !parent) throw new FolderNotFoundError(input.parentId);

    const parentPath = parent ? new FolderPath(parent.path) : undefined;
    const newPath = FolderPath.fromName(input.name, parentPath);
    const depth = parent ? parent.depth + 1 : 0;

    try {
      const [created] = await this.db
        .insert(folders)
        .values({
          parentId: input.parentId,
          name: input.name,
          path: newPath.toString(),
          depth,
        })
        .returning();
      if (!created) throw new Error("Insert returned no row");
      return toFolder(created, false);
    } catch (err: any) {
      if (typeof err?.message === "string" && err.message.includes("uq_folders_parent_name")) {
        throw new DuplicateFolderError(input.parentId, input.name);
      }
      throw err;
    }
  }

  async rename(id: string, name: string): Promise<Folder> {
    const current = await this.db.select().from(folders).where(eq(folders.id, id)).limit(1);
    const node = current[0];
    if (!node) throw new FolderNotFoundError(id);
    try {
      const [updated] = await this.db
        .update(folders)
        .set({ name, updatedAt: new Date() })
        .where(eq(folders.id, id))
        .returning();
      if (!updated) throw new FolderNotFoundError(id);
      return toFolder(updated, false);
    } catch (err: any) {
      if (typeof err?.message === "string" && err.message.includes("uq_folders_parent_name")) {
        throw new DuplicateFolderError(node.parentId, name);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    const res = await this.db.delete(folders).where(eq(folders.id, id)).returning({ id: folders.id });
    if (res.length === 0) throw new FolderNotFoundError(id);
  }
}

// helper used elsewhere
export const _internals = { encodeCursor, decodeCursor };
