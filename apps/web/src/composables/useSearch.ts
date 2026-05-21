import { ref, watch, type Ref } from "vue";
import { searchApi } from "@/services/search.api";
import type { Paginated, SearchHit, SearchType } from "@medexplorer/shared";

const DEBOUNCE_MS = 300;

export function useSearch(query: Ref<string>, type: Ref<SearchType> = ref("all" as SearchType)) {
  const results = ref<SearchHit[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let abortCtrl: AbortController | null = null;

  watch(
    [query, type],
    ([q, t]) => {
      if (timer) clearTimeout(timer);
      if (abortCtrl) abortCtrl.abort();

      if (!q || q.trim().length === 0) {
        results.value = [];
        isLoading.value = false;
        return;
      }

      timer = setTimeout(async () => {
        const ctrl = new AbortController();
        abortCtrl = ctrl;
        isLoading.value = true;
        error.value = null;
        try {
          const res: Paginated<SearchHit> = await searchApi.search(q.trim(), t, { limit: 25 }, ctrl.signal);
          if (!ctrl.signal.aborted) results.value = res.data;
        } catch (e) {
          if ((e as Error).name !== "AbortError") error.value = e as Error;
        } finally {
          if (abortCtrl === ctrl) isLoading.value = false;
        }
      }, DEBOUNCE_MS);
    },
    { immediate: false },
  );

  return { results, isLoading, error };
}
