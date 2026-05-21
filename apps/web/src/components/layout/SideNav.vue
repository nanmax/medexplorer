<script setup lang="ts">
import { UiButton, UiMaterialIcon } from "@medexplorer/ui";
import FolderTree from "@/components/explorer/FolderTree.vue";
import type { FolderDto } from "@medexplorer/shared";
import { useExplorerStore } from "@/stores/explorer.store";

defineEmits<{ select: [folder: FolderDto] }>();

const store = useExplorerStore();
</script>

<template>
  <aside
    class="bg-surface-container-low h-screen w-72 border-r border-outline-variant flex flex-col flex-shrink-0 z-40 relative"
    aria-label="Folder tree panel"
  >
    <div class="p-4 pb-2">
      <div class="flex items-center gap-3 mb-6 px-2 pt-2">
        <div
          class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0"
        >
          <UiMaterialIcon name="medical_services" filled size="xl" />
        </div>
        <div class="min-w-0">
          <h1
            class="font-headline-lg text-secondary !text-lg !leading-snug !tracking-normal !font-bold truncate"
          >Clinical Repository</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant truncate">v2.4.0-Stable</p>
        </div>
      </div>

      <UiButton class="w-full" @click="store.openUploadDialog()">
        <UiMaterialIcon name="cloud_upload" />
        Upload Files
      </UiButton>
    </div>

    <div class="flex-1 overflow-hidden min-h-0">
      <FolderTree @select="(f) => $emit('select', f)" />
    </div>

    <div class="p-4 pt-3 border-t border-outline-variant/30 flex flex-col gap-1">
      <a
        class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-lg transition-all"
        href="#"
      >
        <UiMaterialIcon name="help" />
        <span class="font-label-caps">Help Center</span>
      </a>
      <a
        class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-lg transition-all"
        href="#"
      >
        <UiMaterialIcon name="cloud_queue" />
        <span class="font-label-caps">Storage Status</span>
      </a>
    </div>
  </aside>
</template>
