import { Folder } from "../../../domain/entities/folder.entity";
import { FileItem } from "../../../domain/entities/file.entity";
import type { FolderRow, FileRow } from "./schema";

export function toFolder(row: FolderRow, hasChildren: boolean): Folder {
  return new Folder({
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    path: row.path,
    depth: row.depth,
    itemCount: row.itemCount,
    hasChildren,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toFile(row: FileRow): FileItem {
  return new FileItem({
    id: row.id,
    folderId: row.folderId,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    extension: row.extension,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
