import { defineStore } from "pinia";
import { ref } from "vue";
import type { FolderBreadcrumb, FolderDto } from "@medexplorer/shared";

export type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "infokes:view-mode";

function readView(): ViewMode {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return "list";
  }
  try {
    const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return v === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

export const useExplorerStore = defineStore("explorer", () => {
  const selectedFolderId = ref<string | null>(null);
  const selectedFolder = ref<FolderDto | null>(null);
  const breadcrumb = ref<FolderBreadcrumb[]>([]);
  const expandedIds = ref<Set<string>>(new Set());
  const viewMode = ref<ViewMode>(readView());

  // Dialog state — modals rendered globally in ExplorerView
  const newFolderDialogOpen = ref(false);
  const uploadDialogOpen = ref(false);
  // The folder used as the modal's target. Falls back to the currently-selected
  // folder, or null = create at root / no upload possible.
  const dialogTargetFolder = ref<FolderDto | null>(null);

  // Bump whenever folders/files mutate so FolderTreeNode + DetailsPanel can refresh.
  // Mutation logic stores the affected parentId so only relevant nodes reload.
  const treeVersion = ref(0);
  const lastMutatedParentId = ref<string | null>(null);

  function select(folder: FolderDto, crumbs: FolderBreadcrumb[]): void {
    selectedFolderId.value = folder.id;
    selectedFolder.value = folder;
    breadcrumb.value = crumbs;
  }

  function clearSelection(): void {
    selectedFolderId.value = null;
    selectedFolder.value = null;
    breadcrumb.value = [];
  }

  function setExpanded(id: string, expanded: boolean): void {
    const next = new Set(expandedIds.value);
    if (expanded) next.add(id);
    else next.delete(id);
    expandedIds.value = next;
  }

  function toggleExpanded(id: string): boolean {
    const isOpen = expandedIds.value.has(id);
    setExpanded(id, !isOpen);
    return !isOpen;
  }

  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode;
    if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
      try {
        window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
      } catch {
        /* ignore quota errors */
      }
    }
  }

  function openNewFolderDialog(target: FolderDto | null = null): void {
    dialogTargetFolder.value = target ?? selectedFolder.value;
    newFolderDialogOpen.value = true;
  }

  function openUploadDialog(target: FolderDto | null = null): void {
    dialogTargetFolder.value = target ?? selectedFolder.value;
    uploadDialogOpen.value = true;
  }

  function closeDialogs(): void {
    newFolderDialogOpen.value = false;
    uploadDialogOpen.value = false;
    dialogTargetFolder.value = null;
  }

  /**
   * Signal that the tree should refresh nodes under `parentId`.
   * parentId === null means roots changed. Subscribers compare against
   * their own id; on match they re-fetch their children list.
   */
  function notifyMutation(parentId: string | null): void {
    lastMutatedParentId.value = parentId;
    treeVersion.value += 1;
  }

  return {
    selectedFolderId,
    selectedFolder,
    breadcrumb,
    expandedIds,
    viewMode,
    newFolderDialogOpen,
    uploadDialogOpen,
    dialogTargetFolder,
    treeVersion,
    lastMutatedParentId,
    select,
    clearSelection,
    setExpanded,
    toggleExpanded,
    setViewMode,
    openNewFolderDialog,
    openUploadDialog,
    closeDialogs,
    notifyMutation,
  };
});
