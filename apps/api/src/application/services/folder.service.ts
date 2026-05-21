import type { FolderRepositoryPort } from "../../domain/ports/folder.repository.port";
import type { CachePort } from "../../domain/ports/cache.port";
import type { Folder } from "../../domain/entities/folder.entity";
import {
  FolderNotFoundError,
  DuplicateFolderError,
} from "../errors/domain-errors";
import type {
  CreateFolderInput,
  UpdateFolderInput,
  FolderDto,
  FolderTreeNode,
  FolderBreadcrumb,
  Paginated,
} from "@medexplorer/shared";

const CACHE_TTL = 60;

export class FolderService {
  constructor(
    private readonly folderRepo: FolderRepositoryPort,
    private readonly cache: CachePort,
  ) {}

  async getById(id: string): Promise<FolderDto> {
    const cacheKey = `folder:byid:${id}`;
    const cached = await this.cache.get<FolderDto>(cacheKey);
    if (cached) return cached;
    const folder = await this.folderRepo.findById(id);
    if (!folder) throw new FolderNotFoundError(id);
    const dto = this.toDto(folder);
    await this.cache.set(cacheKey, dto, CACHE_TTL);
    return dto;
  }

  async listRoots(opts: { cursor?: string; limit: number }): Promise<Paginated<FolderDto>> {
    const cacheKey = `folder:roots:${opts.cursor ?? ""}:${opts.limit}`;
    const cached = await this.cache.get<Paginated<FolderDto>>(cacheKey);
    if (cached) return cached;
    const page = await this.folderRepo.listRoots(opts);
    const result = {
      data: page.items.map((f) => this.toDto(f)),
      nextCursor: page.nextCursor,
      hasMore: page.nextCursor !== null,
    };
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async listChildren(
    parentId: string,
    opts: { cursor?: string; limit: number },
  ): Promise<Paginated<FolderDto>> {
    const parent = await this.folderRepo.findById(parentId);
    if (!parent) throw new FolderNotFoundError(parentId);

    const cacheKey = `folder:children:${parentId}:${opts.cursor ?? ""}:${opts.limit}`;
    const cached = await this.cache.get<Paginated<FolderDto>>(cacheKey);
    if (cached) return cached;

    const page = await this.folderRepo.listChildren(parentId, opts);
    const result = {
      data: page.items.map((f) => this.toDto(f)),
      nextCursor: page.nextCursor,
      hasMore: page.nextCursor !== null,
    };
    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async breadcrumb(id: string): Promise<FolderBreadcrumb[]> {
    return this.folderRepo.breadcrumb(id);
  }

  async getSubtree(rootId: string | null, depth: number): Promise<FolderTreeNode[]> {
    const list = await this.folderRepo.subtree(rootId, depth);
    return this.buildTree(list, rootId);
  }

  async create(input: CreateFolderInput): Promise<FolderDto> {
    const created = await this.folderRepo.create({
      name: input.name,
      parentId: input.parentId ?? null,
    });
    await this.invalidateForParent(input.parentId ?? null);
    return this.toDto(created);
  }

  async rename(id: string, input: UpdateFolderInput): Promise<FolderDto> {
    const folder = await this.folderRepo.rename(id, input.name);
    await this.cache.invalidate(`folder:byid:${id}`);
    await this.invalidateForParent(folder.parentId);
    return this.toDto(folder);
  }

  async remove(id: string): Promise<void> {
    const folder = await this.folderRepo.findById(id);
    if (!folder) throw new FolderNotFoundError(id);
    await this.folderRepo.delete(id);
    await this.cache.invalidate(`folder:byid:${id}`);
    await this.invalidateForParent(folder.parentId);
  }

  private async invalidateForParent(parentId: string | null): Promise<void> {
    if (parentId === null) {
      await this.cache.invalidate("folder:roots:");
    } else {
      // Also invalidate the parent's byid cache so its itemCount (computed at
      // read time but cached) refreshes after a child is added/removed.
      await this.cache.invalidate(`folder:children:${parentId}:`);
      await this.cache.invalidate(`folder:byid:${parentId}`);
    }
  }

  private toDto(f: Folder): FolderDto {
    return {
      id: f.id,
      parentId: f.parentId,
      name: f.name,
      path: f.path,
      depth: f.depth,
      itemCount: f.itemCount,
      hasChildren: f.hasChildren,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    };
  }

  private buildTree(folders: Folder[], rootId: string | null): FolderTreeNode[] {
    const byId = new Map<string, FolderTreeNode>();
    for (const f of folders) {
      byId.set(f.id, { ...this.toDto(f), children: [] });
    }
    const roots: FolderTreeNode[] = [];
    for (const f of folders) {
      const node = byId.get(f.id)!;
      const parentNode = f.parentId ? byId.get(f.parentId) : null;
      if (parentNode) {
        parentNode.children!.push(node);
      } else if (rootId === null || f.id === rootId) {
        roots.push(node);
      }
    }
    return roots;
  }

  // Used solely for tests / domain re-throwing
  static readonly errors = { FolderNotFoundError, DuplicateFolderError };
}
