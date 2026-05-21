<script setup lang="ts">
import { ref } from "vue";
import { UiButton, UiIconButton, UiMaterialIcon } from "@medexplorer/ui";
import SearchResults from "@/components/explorer/SearchResults.vue";
import { useExplorerStore } from "@/stores/explorer.store";

const store = useExplorerStore();
const searchQuery = ref("");
const showResults = ref(false);

function onFocus() { showResults.value = true; }
function onBlur() { setTimeout(() => (showResults.value = false), 150); }
</script>

<template>
  <header
    class="bg-surface-container-lowest flex justify-between items-center w-full px-margin-desktop h-16 z-50 border-b border-outline-variant flex-shrink-0"
  >
    <div class="flex items-center gap-8 flex-1">
      <div class="font-headline-lg font-bold text-secondary !text-2xl !tracking-tight">
        MedExplorer
      </div>

      <div class="relative max-w-md w-full">
        <UiMaterialIcon
          name="search"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
        />
        <input
          v-model="searchQuery"
          class="w-full bg-surface-container-low border border-outline-variant text-on-background font-body-md rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-fixed-dim/50 transition-all placeholder:text-on-surface-variant/70"
          placeholder="Search health record, folder, files..."
          type="search"
          aria-label="Search"
          @focus="onFocus"
          @blur="onBlur"
        />
        <SearchResults
          v-if="showResults && searchQuery.length > 0"
          :query="searchQuery"
        />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <UiButton @click="store.openNewFolderDialog()">
        <UiMaterialIcon name="add" size="sm" />
        New Folder
      </UiButton>
      <div class="flex items-center border-l border-outline-variant pl-4 ml-2 gap-2">
        <UiIconButton
          icon="grid_view"
          ariaLabel="Grid view"
          :active="store.viewMode === 'grid'"
          @click="store.setViewMode('grid')"
        />
        <UiIconButton
          icon="view_list"
          ariaLabel="List view"
          :active="store.viewMode === 'list'"
          @click="store.setViewMode('list')"
        />
        <UiIconButton icon="settings" ariaLabel="Settings" />
        <div class="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant overflow-hidden ml-2 flex items-center justify-center text-on-surface-variant">
          <UiMaterialIcon name="person" />
        </div>
      </div>
    </div>
  </header>
</template>
