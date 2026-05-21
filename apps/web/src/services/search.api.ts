import { http } from "./http";
import type { Paginated, SearchHit, SearchType } from "@medexplorer/shared";

export const searchApi = {
  search(
    q: string,
    type: SearchType = "all",
    opts: { cursor?: string; limit?: number } = {},
    signal?: AbortSignal,
  ) {
    const params = new URLSearchParams({ q, type });
    if (opts.cursor) params.set("cursor", opts.cursor);
    if (opts.limit) params.set("limit", String(opts.limit));
    return http<Paginated<SearchHit>>(`/search?${params.toString()}`, { signal });
  },
};
