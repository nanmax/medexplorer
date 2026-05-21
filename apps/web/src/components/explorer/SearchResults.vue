<script setup lang="ts">
import { ref, toRef } from "vue";
import { useSearch } from "@/composables/useSearch";
import { UiMaterialIcon, UiSpinner } from "@medexplorer/ui";
import { useRouter } from "vue-router";

interface Props { query: string }
const props = defineProps<Props>();
const queryRef = toRef(props, "query");
const type = ref<"all">("all");
const { results, isLoading } = useSearch(queryRef, type);
const router = useRouter();

function onPick(hit: typeof results.value[number]) {
  if (hit.kind === "folder") router.push({ name: "folder", params: { id: hit.item.id } });
}
</script>

<template>
  <div
    class="absolute top-full left-0 mt-2 w-96 max-w-[80vw] bg-surface-container-lowest border border-outline-variant rounded-xl medical-glow z-50 max-h-96 overflow-auto"
    role="listbox"
    aria-label="Search results"
  >
    <div v-if="isLoading" class="p-4 flex justify-center"><UiSpinner size="sm" /></div>
    <div v-else-if="results.length === 0" class="p-4 text-sm text-on-surface-variant">No results.</div>
    <ul v-else class="divide-y divide-outline-variant/30 list-none m-0 p-0">
      <li
        v-for="hit in results"
        :key="hit.kind + ':' + hit.item.id"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors"
        role="option"
        :aria-selected="false"
        @mousedown.prevent="onPick(hit)"
      >
        <UiMaterialIcon
          :name="hit.kind === 'folder' ? 'folder' : 'description'"
          class="text-secondary"
          filled
        />
        <div class="flex-1 min-w-0">
          <p class="font-body-md font-semibold text-on-background truncate">{{ hit.item.name }}</p>
          <p class="font-body-sm text-on-surface-variant truncate">
            {{ hit.kind === "folder" ? hit.item.path : hit.item.mimeType ?? "file" }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
