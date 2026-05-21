import { apiBaseUrl, ApiError, http } from "./http";
import type { FileDto, Paginated } from "@medexplorer/shared";

export const fileApi = {
  listByFolder(folderId: string, opts: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (opts.cursor) params.set("cursor", opts.cursor);
    if (opts.limit) params.set("limit", String(opts.limit));
    return http<Paginated<FileDto>>(`/folders/${folderId}/files?${params.toString()}`, { signal });
  },

  get(id: string, signal?: AbortSignal) {
    return http<FileDto>(`/files/${id}`, { signal });
  },

  remove(id: string) {
    return http<null>(`/files/${id}`, { method: "DELETE" });
  },

  async upload(folderId: string, fileList: File[]): Promise<{ uploaded: FileDto[] }> {
    const form = new FormData();
    for (const f of fileList) form.append("files", f, f.name);
    const res = await fetch(`${apiBaseUrl}/folders/${folderId}/files`, {
      method: "POST",
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (body as { error?: { code?: string; message?: string; details?: unknown } }).error ?? {};
      throw new ApiError(
        res.status,
        err.code ?? "INTERNAL_ERROR",
        err.message ?? `Upload failed with ${res.status}`,
        err.details,
      );
    }
    return body as { uploaded: FileDto[] };
  },
};
