<script setup lang="ts">
import { watch } from "vue";
import { useRootFolders } from "@/composables/useFolderTree";
import FolderTreeNode from "./FolderTreeNode.vue";
import type { FolderDto } from "@medexplorer/shared";
import { UiSpinner, UiEmptyState } from "@medexplorer/ui";
import { useExplorerStore } from "@/stores/explorer.store";

defineEmits<{ select: [folder: FolderDto] }>();

const store = useExplorerStore();
const { data, isLoading, isError, error, refetch } = useRootFolders();

// Reload root list when a root-level mutation happens.
watch(
  () => store.treeVersion,
  () => {
    if (store.lastMutatedParentId === null) refetch();
  },
);
</script>

<template>
  <nav class="h-full overflow-auto px-2 py-3" aria-label="Folder tree">
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <UiSpinner size="md" />
    </div>
    <div v-else-if="isError" class="p-4 text-sm text-error">
      Failed to load: {{ error?.message }}
      <button class="block mt-2 underline" @click="refetch()">Retry</button>
    </div>
    <UiEmptyState
      v-else-if="!data || data.data.length === 0"
      icon="folder_off"
      title="No folders yet"
      description="Create a folder to get started."
    />
    <ul v-else role="tree" class="list-none m-0 p-0">
      <FolderTreeNode
        v-for="root in data.data"
        :key="root.id"
        :node="root"
        :depth="0"
        @select="$emit('select', $event)"
      />
    </ul>
  </nav>
</template>
