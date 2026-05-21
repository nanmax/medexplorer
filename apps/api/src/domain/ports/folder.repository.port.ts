import type { Folder } from "../entities/folder.entity";

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ListChildrenOpts {
  cursor?: string;
  limit: number;
}

export interface FolderBreadcrumbItem {
  id: string;
  name: string;
}

export interface NewFolderInput {
  name: string;
  parentId: string | null;
}

export interface FolderRepositoryPort {
  findById(id: string): Promise<Folder | null>;

  /** Roots = parent_id IS NULL */
  listRoots(opts: ListChildrenOpts): Promise<CursorPage<Folder>>;

  listChildren(parentId: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>>;

  /** Ancestors ordered root → folder (inclusive) for breadcrumb */
  breadcrumb(id: string): Promise<FolderBreadcrumbItem[]>;

  /** Whole subtree of depth N (used by lazy load, capped). */
  subtree(rootId: string | null, maxDepth: number): Promise<Folder[]>;

  /** Trigram search on name. */
  searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<Folder>>;

  create(input: NewFolderInput): Promise<Folder>;
  rename(id: string, name: string): Promise<Folder>;
  delete(id: string): Promise<void>;
}
