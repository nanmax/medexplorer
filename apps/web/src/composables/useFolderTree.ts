import { useQuery } from "@tanstack/vue-query";
import { folderApi } from "@/services/folder.api";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";

/** Roots — first level of the tree. */
export function useRootFolders() {
  return useQuery({
    queryKey: ["folders", "roots"],
    queryFn: ({ signal }) => folderApi.listRoots({ limit: 100 }, signal),
    staleTime: 30_000,
  });
}

/** Children of a node — fetched lazily when a node is expanded. */
export function useFolderChildren(folderId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ["folders", "children", toValue(folderId)] as const),
    queryFn: ({ signal, queryKey }) => {
      const id = queryKey[2];
      if (!id) throw new Error("folderId required");
      return folderApi.listChildren(id, { limit: 100 }, signal);
    },
    enabled: computed(() => toValue(folderId) !== null),
    staleTime: 30_000,
  });
}
