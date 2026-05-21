import { useQuery } from "@tanstack/vue-query";
import { folderApi } from "@/services/folder.api";
import { fileApi } from "@/services/file.api";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";

export function useFolderDetail(folderId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ["folders", "detail", toValue(folderId)] as const),
    queryFn: ({ signal, queryKey }) => {
      const id = queryKey[2];
      if (!id) throw new Error("folderId required");
      return folderApi.get(id, signal);
    },
    enabled: computed(() => toValue(folderId) !== null),
    staleTime: 30_000,
  });
}

export function useFolderFiles(folderId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ["folders", "files", toValue(folderId)] as const),
    queryFn: ({ signal, queryKey }) => {
      const id = queryKey[2];
      if (!id) throw new Error("folderId required");
      return fileApi.listByFolder(id, { limit: 100 }, signal);
    },
    enabled: computed(() => toValue(folderId) !== null),
    staleTime: 30_000,
  });
}
