import { ref, type Ref } from "vue";
import type { FolderDto } from "@medexplorer/shared";

const STORAGE_KEY = "infokes:recent-folders";
const MAX_ITEMS = 8;

export interface RecentEntry {
  id: string;
  name: string;
  path: string;
  itemCount: number;
  visitedAt: string; // ISO
}

function readStorage(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEntry =>
        !!e && typeof e === "object" &&
        typeof (e as RecentEntry).id === "string" &&
        typeof (e as RecentEntry).name === "string" &&
        typeof (e as RecentEntry).visitedAt === "string",
    );
  } catch {
    return [];
  }
}

function writeStorage(items: RecentEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Single source of truth for the whole app — module-scoped ref.
const items: Ref<RecentEntry[]> = ref(readStorage());

export function useRecentActivity() {
  function add(folder: FolderDto): void {
    const next: RecentEntry = {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      itemCount: folder.itemCount,
      visitedAt: new Date().toISOString(),
    };
    const deduped = items.value.filter((e) => e.id !== folder.id);
    deduped.unshift(next);
    const trimmed = deduped.slice(0, MAX_ITEMS);
    items.value = trimmed;
    writeStorage(trimmed);
  }

  function clear(): void {
    items.value = [];
    writeStorage([]);
  }

  return { items, add, clear };
}
