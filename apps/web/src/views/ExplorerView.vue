<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ExplorerLayout from "@/components/layout/ExplorerLayout.vue";
import DetailsPanel from "@/components/explorer/DetailsPanel.vue";
import Breadcrumb from "@/components/explorer/Breadcrumb.vue";
import RecentActivity from "@/components/explorer/RecentActivity.vue";
import NewFolderDialog from "@/components/explorer/NewFolderDialog.vue";
import UploadFilesDialog from "@/components/explorer/UploadFilesDialog.vue";
import ContextMenu from "@/components/explorer/ContextMenu.vue";
import ConfirmDialog from "@/components/explorer/ConfirmDialog.vue";
import { useExplorerStore } from "@/stores/explorer.store";
import { useFolderDetail } from "@/composables/useFolderDetails";
import { useRecentActivity } from "@/composables/useRecentActivity";
import type { FolderDto } from "@medexplorer/shared";

const route = useRoute();
const router = useRouter();
const store = useExplorerStore();
const { add: addRecent } = useRecentActivity();

const routeFolderId = computed(() => (route.params.id as string | undefined) ?? null);
const isHome = computed(() => routeFolderId.value === null);
const detailQ = useFolderDetail(routeFolderId);

watch(
  [detailQ.data, routeFolderId],
  ([detail, id]) => {
    if (id && detail) {
      store.select(detail.folder, detail.breadcrumb);
      addRecent(detail.folder);
    } else if (id === null) {
      store.clearSelection();
    }
  },
  { immediate: true },
);

function onSelect(folder: FolderDto) {
  router.push({ name: "folder", params: { id: folder.id } });
}
</script>

<template>
  <ExplorerLayout @select="onSelect">
    <section class="h-full p-8 overflow-auto" aria-label="Workspace">
      <template v-if="isHome">
        <Breadcrumb :crumbs="[]" class="mb-6" @home="router.push({ name: 'explorer' })" />
        <div class="mb-8">
          <h1 class="font-headline-lg-mobile text-on-background mb-1">Welcome to MedExplorer</h1>
          <p class="font-body-md text-on-surface-variant">
            Pick a folder from the tree on the left to view its contents, or jump back into one of your recent folders below.
          </p>
        </div>
        <RecentActivity />
      </template>

      <template v-else>
        <Breadcrumb
          :crumbs="store.breadcrumb"
          class="mb-6"
          @navigate="(id) => router.push({ name: 'folder', params: { id } })"
          @home="router.push({ name: 'explorer' })"
        />
        <DetailsPanel :folder="store.selectedFolder" @open-folder="onSelect" />
      </template>
    </section>

    <NewFolderDialog />
    <UploadFilesDialog />
    <ContextMenu />
    <ConfirmDialog />
  </ExplorerLayout>
</template>
