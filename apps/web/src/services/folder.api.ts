import { http } from "./http";
import type {
  FolderDto,
  FolderBreadcrumb,
  FolderTreeNode,
  Paginated,
  CreateFolderInput,
  UpdateFolderInput,
} from "@medexplorer/shared";

export const folderApi = {
  listRoots(opts: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (opts.cursor) params.set("cursor", opts.cursor);
    if (opts.limit) params.set("limit", String(opts.limit));
    return http<Paginated<FolderDto>>(`/folders/roots?${params.toString()}`, { signal });
  },

  get(id: string, signal?: AbortSignal) {
    return http<{ folder: FolderDto; breadcrumb: FolderBreadcrumb[] }>(`/folders/${id}`, { signal });
  },

  listChildren(id: string, opts: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (opts.cursor) params.set("cursor", opts.cursor);
    if (opts.limit) params.set("limit", String(opts.limit));
    return http<Paginated<FolderDto>>(`/folders/${id}/children?${params.toString()}`, { signal });
  },

  subtree(id: string, depth = 2, signal?: AbortSignal) {
    return http<FolderTreeNode[]>(`/folders/${id}/subtree?depth=${depth}`, { signal });
  },

  create(input: CreateFolderInput) {
    return http<FolderDto>("/folders", { method: "POST", body: JSON.stringify(input) });
  },

  rename(id: string, input: UpdateFolderInput) {
    return http<FolderDto>(`/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  remove(id: string) {
    return http<null>(`/folders/${id}`, { method: "DELETE" });
  },
};
