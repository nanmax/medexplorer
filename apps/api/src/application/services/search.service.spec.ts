import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchService } from "./search.service";
import { Folder } from "../../domain/entities/folder.entity";
import { FileItem } from "../../domain/entities/file.entity";

function folder(id: string, name: string) {
  return new Folder({
    id,
    parentId: null,
    name,
    path: name.toLowerCase(),
    depth: 0,
    itemCount: 0,
    hasChildren: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
function file(id: string, name: string) {
  return new FileItem({
    id,
    folderId: "f",
    name,
    mimeType: null,
    sizeBytes: 1,
    extension: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("SearchService", () => {
  let svc: SearchService;
  const folderRepo = { searchByName: vi.fn() } as any;
  const fileRepo = { searchByName: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new SearchService(folderRepo, fileRepo);
  });

  it("type=folder returns only folder hits", async () => {
    folderRepo.searchByName.mockResolvedValueOnce({
      items: [folder("11111111-1111-1111-1111-111111111111", "MRI")],
      nextCursor: null,
    });
    const res = await svc.search("M", "folder", { limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.kind).toBe("folder");
  });

  it("type=file returns only file hits", async () => {
    fileRepo.searchByName.mockResolvedValueOnce({
      items: [file("22222222-2222-2222-2222-222222222222", "report.pdf")],
      nextCursor: null,
    });
    const res = await svc.search("report", "file", { limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.kind).toBe("file");
  });

  it("type=all combines both with folders first", async () => {
    folderRepo.searchByName.mockResolvedValueOnce({
      items: [folder("11111111-1111-1111-1111-111111111111", "MRI")],
      nextCursor: null,
    });
    fileRepo.searchByName.mockResolvedValueOnce({
      items: [file("22222222-2222-2222-2222-222222222222", "report.pdf")],
      nextCursor: null,
    });
    const res = await svc.search("X", "all", { limit: 10 });
    expect(res.data.map((h) => h.kind)).toEqual(["folder", "file"]);
  });
});
