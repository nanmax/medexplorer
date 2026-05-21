import type { FileItem } from "../entities/file.entity";
import type { CursorPage, ListChildrenOpts } from "./folder.repository.port";

export interface NewFileInput {
  folderId: string;
  name: string;
  sizeBytes: number;
  mimeType: string | null;
  extension: string | null;
}

export interface FileRepositoryPort {
  findById(id: string): Promise<FileItem | null>;
  listByFolder(folderId: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>>;
  searchByName(q: string, opts: ListChildrenOpts): Promise<CursorPage<FileItem>>;
  create(input: NewFileInput): Promise<FileItem>;
  delete(id: string): Promise<void>;
}
