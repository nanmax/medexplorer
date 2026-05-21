import { describe, it, expect, beforeEach, vi } from "vitest";
import { FolderService } from "./folder.service";
import { Folder } from "../../domain/entities/folder.entity";
import { MemoryCache } from "../../infrastructure/cache/memory-cache";
import { FolderNotFoundError, DuplicateFolderError } from "../errors/domain-errors";
import type { FolderRepositoryPort } from "../../domain/ports/folder.repository.port";

function makeFolder(overrides: Partial<{ id: string; parentId: string | null; name: string; path: string; depth: number; itemCount: number; hasChildren: boolean }> = {}): Folder {
  return new Folder({
    id: overrides.id ?? "11111111-1111-1111-1111-111111111111",
    parentId: overrides.parentId ?? null,
    name: overrides.name ?? "Root",
    path: overrides.path ?? "root",
    depth: overrides.depth ?? 0,
    itemCount: overrides.itemCount ?? 0,
    hasChildren: overrides.hasChildren ?? false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

function makeMockRepo(): FolderRepositoryPort {
  return {
    findById: vi.fn(),
    listRoots: vi.fn(),
    listChildren: vi.fn(),
    breadcrumb: vi.fn(),
    subtree: vi.fn(),
    searchByName: vi.fn(),
    create: vi.fn(),
    rename: vi.fn(),
    delete: vi.fn(),
  };
}

describe("FolderService", () => {
  let repo: FolderRepositoryPort;
  let cache: MemoryCache;
  let service: FolderService;

  beforeEach(() => {
    repo = makeMockRepo();
    cache = new MemoryCache(100, 60);
    service = new FolderService(repo, cache);
  });

  describe("getById", () => {
    it("returns DTO when folder exists", async () => {
      (repo.findById as any).mockResolvedValueOnce(makeFolder({ name: "MRI Scans" }));
      const dto = await service.getById("11111111-1111-1111-1111-111111111111");
      expect(dto.name).toBe("MRI Scans");
    });

    it("throws FolderNotFoundError when missing", async () => {
      (repo.findById as any).mockResolvedValueOnce(null);
      await expect(service.getById("missing")).rejects.toBeInstanceOf(FolderNotFoundError);
    });

    it("caches subsequent reads", async () => {
      (repo.findById as any).mockResolvedValueOnce(makeFolder());
      await service.getById("11111111-1111-1111-1111-111111111111");
      await service.getById("11111111-1111-1111-1111-111111111111");
      expect(repo.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("listChildren", () => {
    it("rejects when parent does not exist", async () => {
      (repo.findById as any).mockResolvedValueOnce(null);
      await expect(service.listChildren("missing", { limit: 10 })).rejects.toBeInstanceOf(FolderNotFoundError);
    });

    it("returns paginated DTOs and exposes nextCursor", async () => {
      (repo.findById as any).mockResolvedValueOnce(makeFolder());
      (repo.listChildren as any).mockResolvedValueOnce({
        items: [makeFolder({ id: "22222222-2222-2222-2222-222222222222", name: "Sub" })],
        nextCursor: "cursor-2",
      });
      const result = await service.listChildren("11111111-1111-1111-1111-111111111111", { limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBe("cursor-2");
      expect(result.hasMore).toBe(true);
    });
  });

  describe("create", () => {
    it("invalidates parent's children cache on create", async () => {
      (repo.create as any).mockResolvedValueOnce(makeFolder({ id: "new-id", parentId: "parent-id", name: "Inserted" }));
      const spy = vi.spyOn(cache, "invalidate");
      await service.create({ name: "Inserted", parentId: "parent-id" });
      expect(spy).toHaveBeenCalledWith("folder:children:parent-id:");
    });

    it("invalidates roots cache when parentId is null", async () => {
      (repo.create as any).mockResolvedValueOnce(makeFolder({ id: "new-root", parentId: null, name: "RootX" }));
      const spy = vi.spyOn(cache, "invalidate");
      await service.create({ name: "RootX", parentId: null });
      expect(spy).toHaveBeenCalledWith("folder:roots:");
    });

    it("propagates DuplicateFolderError from repository", async () => {
      (repo.create as any).mockRejectedValueOnce(new DuplicateFolderError(null, "RootX"));
      await expect(service.create({ name: "RootX", parentId: null })).rejects.toBeInstanceOf(DuplicateFolderError);
    });
  });

  describe("remove", () => {
    it("throws if folder not found", async () => {
      (repo.findById as any).mockResolvedValueOnce(null);
      await expect(service.remove("missing")).rejects.toBeInstanceOf(FolderNotFoundError);
    });

    it("deletes and invalidates caches", async () => {
      (repo.findById as any).mockResolvedValueOnce(makeFolder({ id: "x", parentId: "p" }));
      (repo.delete as any).mockResolvedValueOnce(undefined);
      const spy = vi.spyOn(cache, "invalidate");
      await service.remove("x");
      expect(repo.delete).toHaveBeenCalledWith("x");
      expect(spy).toHaveBeenCalledWith("folder:byid:x");
      expect(spy).toHaveBeenCalledWith("folder:children:p:");
    });
  });

  describe("getSubtree", () => {
    it("builds tree from flat list", async () => {
      const root = makeFolder({ id: "r", path: "r", depth: 0, name: "R", hasChildren: true });
      const a = makeFolder({ id: "a", parentId: "r", path: "r.a", depth: 1, name: "A" });
      const b = makeFolder({ id: "b", parentId: "r", path: "r.b", depth: 1, name: "B" });
      (repo.subtree as any).mockResolvedValueOnce([root, a, b]);
      const tree = await service.getSubtree("r", 2);
      expect(tree).toHaveLength(1);
      expect(tree[0]?.children).toHaveLength(2);
    });
  });
});
