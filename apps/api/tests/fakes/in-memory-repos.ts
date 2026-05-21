import { randomUUID } from "node:crypto";
import { Folder } from "../../src/domain/entities/folder.entity";
import { FileItem } from "../../src/domain/entities/file.entity";
import type {
  CursorPage,
  FolderBreadcrumbItem,
  FolderRepositoryPort,
  ListChildrenOpts,
  NewFolderInput,
} from "../../src/domain/ports/folder.repository.port";
import type {
  FileRepositoryPort,
  NewFileInput,
} from "../../src/domain/ports/file.repository.port";
import {
  DuplicateFolderError,
  FileNotFoundError,
  FolderNotFoundError,
} from "../../src/application/errors/domain-errors";
import { FolderPath } from "../../src/domain/value-objects/folder-path.vo";

/**
 * Fully functional in-memory implementations of the repository ports.
 * Used by integration tests so they exercise the full HTTP → service → repo
 * stack without needing a live Postgres.
 */

export class InMemoryFolderRepo implements FolderRepositoryPort {
  private byId = new Map<string, { id: string; parentId: string | null; name: string; path: string; depth: number; itemCount: number; createdAt: Date; updatedAt: Date }>();

  seed(input: NewFolderInput, id = randomUUID()): string {
    const parent = input.parentId ? this.byId.get(input.parentId) : null;
    if (input.parentId && !parent) throw new FolderNotFoundError(input.parentId);
    const path = FolderPath.fromName(input.name, parent ? new FolderPath(parent.path) : undefined).toString();
    const depth = parent ? parent.depth + 1 : 0;
    const dup = [...this.byId.values()].find((f) => f.parentId === (input.parentId ?? null) && f.name === input.name);
    if (dup) throw new DuplicateFolderError(input.parentId ?? null, input.name);
    const row = {
      id,
      parentId: input.parentId ?? null,
      name: input.name,
      path,
      depth,
      itemCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.byId.set(id, row);
    return id;
  }

  /** Optional bridge to the file repo so itemCount includes file count. */
  fileCountFor: (folderId: string) => number = () => 0;

  private toEntity(row: { id: string; parentId: string | null; name: string; path: string; depth: number; itemCount: number; createdAt: Date; updatedAt: Date }): Folder {
    const subCount = [...this.byId.values()].filter((r) => r.parentId === row.id).length;
    const fileCount = this.fileCountFor(row.id);
    return new Folder({
      ...row,
      itemCount: subCount + fileCount,
      hasChildren: subCount > 0,
    });
  }

  async findById(id: string): Promise<Folder | null> {
    const r = this.byId.get(id);
    return r ? this.toEntity(r) : null;
  }

  private listByParent(parentId: string | null, opts: ListChildrenOpts): CursorPage<Folder> {
    const sorted = [...this.byId.values()]
      .filter((r) => r.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const startIdx = opts.cursor
      ? sorted.findIndex((r) => Buffer.from(`${r.name}|${r.id}`).toString("base64url") === opts.cursor) + 1
      : 0;
    const slice = sorted.slice(startIdx, startIdx + opts.limit);
    const hasMore = sorted.length > startIdx + opts.limit;
    const last = slice[slice.length - 1];
    return {
      items: slice.map((r) => this.toEntity(r)),
      nextCursor: hasMore && last ? Buffer.from(`${last.name}|${last.id}`).toString("base64url") : null,
    };
  }

  async listRoots(opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    return this.listByParent(null, opts);
  }
  async listChildren(parentId: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    return this.listByParent(parentId, opts);
  }

  async breadcrumb(id: string): Promise<FolderBreadcrumbItem[]> {
    const out: FolderBreadcrumbItem[] = [];
    let cur = this.byId.get(id);
    if (!cur) throw new FolderNotFoundError(id);
    while (cur) {
      out.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? this.byId.get(cur.parentId) : undefined;
    }
    return out;
  }

  async subtree(rootId: string | null, maxDepth: number): Promise<Folder[]> {
    if (rootId === null) {
      return [...this.byId.values()].filter((r) => r.depth <= maxDepth).map((r) => this.toEntity(r));
    }
    const root = this.byId.get(rootId);
    if (!root) throw new FolderNotFoundError(rootId);
    const maxD = root.depth + maxDepth;
    return [...this.byId.values()]
      .filter((r) => r.path === root.path || r.path.startsWith(root.path + "."))
      .filter((r) => r.depth <= maxD)
      .map((r) => this.toEntity(r));
  }

  async searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>> {
    const ql = q.toLowerCase();
    const matched = [...this.byId.values()].filter((r) => r.name.toLowerCase().includes(ql));
    return {
      items: matched.slice(0, opts.limit).map((r) => this.toEntity(r)),
      nextCursor: matched.length > opts.limit ? Buffer.from("more").toString("base64url") : null,
    };
  }

  async create(input: NewFolderInput): Promise<Folder> {
    const id = this.seed(input);
    return this.toEntity(this.byId.get(id)!);
  }

  async rename(id: string, name: string): Promise<Folder> {
    const r = this.byId.get(id);
    if (!r) throw new FolderNotFoundError(id);
    const dup = [...this.byId.values()].find((x) => x.parentId === r.parentId && x.name === name && x.id !== id);
    if (dup) throw new DuplicateFolderError(r.parentId, name);
    r.name = name;
    r.updatedAt = new Date();
    return this.toEntity(r);
  }

  async delete(id: string): Promise<void> {
    const r = this.byId.get(id);
    if (!r) throw new FolderNotFoundError(id);
    // Cascade
    const toRemove = [...this.byId.values()].filter((x) => x.path === r.path || x.path.startsWith(r.path + "."));
    for (const f of toRemove) this.byId.delete(f.id);
  }
}

export class InMemoryFileRepo implements FileRepositoryPort {
  private files = new Map<string, { id: string; folderId: string; name: string; mimeType: string | null; sizeBytes: number; extension: string | null; createdAt: Date; updatedAt: Date }>();

  seed(folderId: string, name: string, sizeBytes = 0, mimeType: string | null = null, extension: string | null = null): string {
    const id = randomUUID();
    this.files.set(id, { id, folderId, name, mimeType, sizeBytes, extension, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }

  countByFolder(folderId: string): number {
    let n = 0;
    for (const f of this.files.values()) if (f.folderId === folderId) n++;
    return n;
  }

  async findById(id: string): Promise<FileItem | null> {
    const r = this.files.get(id);
    return r ? new FileItem(r) : null;
  }

  async listByFolder(folderId: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>> {
    const matched = [...this.files.values()].filter((f) => f.folderId === folderId).sort((a, b) => a.name.localeCompare(b.name));
    return {
      items: matched.slice(0, opts.limit).map((r) => new FileItem(r)),
      nextCursor: matched.length > opts.limit ? Buffer.from("more").toString("base64url") : null,
    };
  }

  async searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>> {
    const ql = q.toLowerCase();
    const matched = [...this.files.values()].filter((r) => r.name.toLowerCase().includes(ql));
    return {
      items: matched.slice(0, opts.limit).map((r) => new FileItem(r)),
      nextCursor: matched.length > opts.limit ? Buffer.from("more").toString("base64url") : null,
    };
  }

  async create(input: NewFileInput): Promise<FileItem> {
    const id = randomUUID();
    const row = {
      id,
      folderId: input.folderId,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      extension: input.extension,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, row);
    return new FileItem(row);
  }

  async delete(id: string): Promise<void> {
    if (!this.files.has(id)) throw new FileNotFoundError(id);
    this.files.delete(id);
  }
}
