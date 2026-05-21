import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useExplorerStore } from "./explorer.store";
import type { FolderDto } from "@medexplorer/shared";

const folderA: FolderDto = {
  id: "a",
  parentId: null,
  name: "A",
  path: "a",
  depth: 0,
  itemCount: 0,
  hasChildren: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("explorerStore", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("select() populates selectedFolder and breadcrumb", () => {
    const s = useExplorerStore();
    s.select(folderA, [{ id: "a", name: "A" }]);
    expect(s.selectedFolderId).toBe("a");
    expect(s.selectedFolder?.name).toBe("A");
    expect(s.breadcrumb).toHaveLength(1);
  });

  it("clearSelection() resets state", () => {
    const s = useExplorerStore();
    s.select(folderA, []);
    s.clearSelection();
    expect(s.selectedFolderId).toBeNull();
    expect(s.selectedFolder).toBeNull();
  });

  it("toggleExpanded() toggles set membership", () => {
    const s = useExplorerStore();
    expect(s.toggleExpanded("x")).toBe(true);
    expect(s.expandedIds.has("x")).toBe(true);
    expect(s.toggleExpanded("x")).toBe(false);
    expect(s.expandedIds.has("x")).toBe(false);
  });
});
