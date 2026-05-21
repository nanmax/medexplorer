import type { FileRepositoryPort } from "../../domain/ports/file.repository.port";
import type { FolderRepositoryPort } from "../../domain/ports/folder.repository.port";
import type { CachePort } from "../../domain/ports/cache.port";
import { FolderNotFoundError, FileNotFoundError } from "../errors/domain-errors";
import type { FileDto, Paginated } from "@medexplorer/shared";
import type { FileItem } from "../../domain/entities/file.entity";

export class FileService {
  constructor(
    private readonly fileRepo: FileRepositoryPort,
    private readonly folderRepo: FolderRepositoryPort,
    private readonly cache: CachePort,
  ) {}

  async listByFolder(
    folderId: string,
    opts: { cursor?: string; limit: number },
  ): Promise<Paginated<FileDto>> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new FolderNotFoundError(folderId);
    const page = await this.fileRepo.listByFolder(folderId, opts);
    return {
      data: page.items.map(this.toDto),
      nextCursor: page.nextCursor,
      hasMore: page.nextCursor !== null,
    };
  }

  async getById(id: string): Promise<FileDto> {
    const f = await this.fileRepo.findById(id);
    if (!f) throw new FileNotFoundError(id);
    return this.toDto(f);
  }

  async remove(id: string): Promise<void> {
    const file = await this.fileRepo.findById(id);
    if (!file) throw new FileNotFoundError(id);
    await this.fileRepo.delete(id);
    // Refresh the folder that contained it (itemCount changed).
    await this.cache.invalidate(`folder:byid:${file.folderId}`);
    const folder = await this.folderRepo.findById(file.folderId);
    if (folder?.parentId) {
      await this.cache.invalidate(`folder:children:${folder.parentId}:`);
    } else if (folder) {
      await this.cache.invalidate("folder:roots:");
    }
  }

  async createInFolder(
    folderId: string,
    input: { name: string; sizeBytes: number; mimeType: string | null; extension: string | null },
  ): Promise<FileDto> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new FolderNotFoundError(folderId);
    const file = await this.fileRepo.create({ folderId, ...input });
    // Folder.itemCount is computed at read time but cached — invalidate so the
    // next read of the parent folder reflects the new file.
    await this.cache.invalidate(`folder:byid:${folderId}`);
    if (folder.parentId) {
      await this.cache.invalidate(`folder:children:${folder.parentId}:`);
    } else {
      await this.cache.invalidate("folder:roots:");
    }
    return this.toDto(file);
  }

  private toDto(f: FileItem): FileDto {
    return {
      id: f.id,
      folderId: f.folderId,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      extension: f.extension,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    };
  }
}
