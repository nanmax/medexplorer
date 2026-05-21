import type { FolderRepositoryPort } from "../../domain/ports/folder.repository.port";
import type { FileRepositoryPort } from "../../domain/ports/file.repository.port";
import type { SearchHit, SearchType, Paginated } from "@medexplorer/shared";

export class SearchService {
  constructor(
    private readonly folderRepo: FolderRepositoryPort,
    private readonly fileRepo: FileRepositoryPort,
  ) {}

  async search(
    q: string,
    type: SearchType,
    opts: { cursor?: string; limit: number },
  ): Promise<Paginated<SearchHit>> {
    if (type === "folder") {
      const page = await this.folderRepo.searchByName(q, opts);
      return {
        data: page.items.map((f) => ({
          kind: "folder" as const,
          item: {
            id: f.id,
            parentId: f.parentId,
            name: f.name,
            path: f.path,
            depth: f.depth,
            itemCount: f.itemCount,
            hasChildren: f.hasChildren,
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          },
        })),
        nextCursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
      };
    }

    if (type === "file") {
      const page = await this.fileRepo.searchByName(q, opts);
      return {
        data: page.items.map((f) => ({
          kind: "file" as const,
          item: {
            id: f.id,
            folderId: f.folderId,
            name: f.name,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
            extension: f.extension,
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          },
        })),
        nextCursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
      };
    }

    // type === "all": run both in parallel and interleave (folders first).
    const halfLimit = Math.max(1, Math.floor(opts.limit / 2));
    const [folderPage, filePage] = await Promise.all([
      this.folderRepo.searchByName(q, { limit: halfLimit }),
      this.fileRepo.searchByName(q, { limit: halfLimit }),
    ]);
    const data: SearchHit[] = [
      ...folderPage.items.map((f) => ({
        kind: "folder" as const,
        item: {
          id: f.id,
          parentId: f.parentId,
          name: f.name,
          path: f.path,
          depth: f.depth,
          itemCount: f.itemCount,
          hasChildren: f.hasChildren,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        },
      })),
      ...filePage.items.map((f) => ({
        kind: "file" as const,
        item: {
          id: f.id,
          folderId: f.folderId,
          name: f.name,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          extension: f.extension,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        },
      })),
    ];
    return { data, nextCursor: null, hasMore: false };
  }
}
