<script setup lang="ts">
import { computed, watch } from "vue";
import type { FolderDto, FileDto } from "@medexplorer/shared";
import { useFolderChildren } from "@/composables/useFolderTree";
import { useFolderFiles } from "@/composables/useFolderDetails";
import { useExplorerStore } from "@/stores/explorer.store";
import { UiListRow, UiMaterialIcon, UiSpinner, UiEmptyState } from "@medexplorer/ui";
import { formatBytes, formatRelative, splitFileName } from "@/utils/format";
import { iconForFile } from "@/utils/file-icons";
import { useContextMenu } from "@/composables/useContextMenu";
import { useConfirm } from "@/composables/useConfirm";
import { folderApi } from "@/services/folder.api";
import { fileApi } from "@/services/file.api";
import { ApiError } from "@/services/http";

interface Props { folder: FolderDto | null }
const props = defineProps<Props>();
const emit = defineEmits<{ openFolder: [folder: FolderDto] }>();

const store = useExplorerStore();
const folderId = computed(() => props.folder?.id ?? null);
const childrenQ = useFolderChildren(folderId);
const filesQ = useFolderFiles(folderId);

const isLoading = computed(() => childrenQ.isLoading.value || filesQ.isLoading.value);
const isFetching = computed(() => childrenQ.isFetching.value || filesQ.isFetching.value);
const isEmpty = computed(
  () =>
    (childrenQ.data.value?.data.length ?? 0) === 0 &&
    (filesQ.data.value?.data.length ?? 0) === 0,
);

// Re-fetch when this folder is the target of a mutation (e.g. new sub-folder, upload).
watch(
  () => store.treeVersion,
  () => {
    if (
      props.folder &&
      (store.lastMutatedParentId === props.folder.id || store.lastMutatedParentId === null)
    ) {
      childrenQ.refetch();
      filesQ.refetch();
    }
  },
);

const { open: openMenu } = useContextMenu();
const { confirm } = useConfirm();

async function deleteFolder(sub: FolderDto) {
  const ok = await confirm({
    title: `Delete "${sub.name}"?`,
    description: `This permanently removes the folder and all ${sub.itemCount} item(s) inside it. This action cannot be undone.`,
    confirmLabel: "Delete folder",
    danger: true,
  });
  if (!ok) return;
  try {
    await folderApi.remove(sub.id);
    store.notifyMutation(sub.parentId);
  } catch (e) {
    alert(e instanceof ApiError ? e.message : (e as Error).message ?? "Failed to delete folder");
  }
}

async function deleteFile(file: FileDto) {
  const ok = await confirm({
    title: `Delete "${file.name}"?`,
    description: "This permanently removes the file. This action cannot be undone.",
    confirmLabel: "Delete file",
    danger: true,
  });
  if (!ok) return;
  try {
    await fileApi.remove(file.id);
    store.notifyMutation(file.folderId);
  } catch (e) {
    alert(e instanceof ApiError ? e.message : (e as Error).message ?? "Failed to delete file");
  }
}

function onFolderContextMenu(event: MouseEvent, sub: FolderDto) {
  openMenu(event, [
    { label: "Open", icon: "folder_open", onClick: () => emit("openFolder", sub) },
    { label: "Delete folder", icon: "delete", danger: true, onClick: () => deleteFolder(sub) },
  ]);
}

function onFileContextMenu(event: MouseEvent, file: FileDto) {
  openMenu(event, [
    { label: "Delete file", icon: "delete", danger: true, onClick: () => deleteFile(file) },
  ]);
}
</script>

<template>
  <div class="h-full overflow-auto">
    <UiEmptyState
      v-if="!folder"
      icon="folder_open"
      title="Select a folder"
      description="Choose a folder from the tree on the left to view its contents."
    />
    <template v-else>
      <!-- LIST VIEW (default) -->
      <div
        v-if="store.viewMode === 'list'"
        class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden medical-glow"
      >
        <div
          class="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low/50 border-b border-outline-variant text-on-surface-variant font-label-caps"
          role="row"
        >
          <div class="col-span-5">Name</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2">Size</div>
          <div class="col-span-3">Date Modified</div>
        </div>

        <div v-if="isLoading" class="py-12 flex justify-center">
          <UiSpinner size="md" />
        </div>

        <UiEmptyState
          v-else-if="isEmpty"
          icon="folder_open"
          title="This folder is empty"
        />

        <div v-else class="flex flex-col" role="rowgroup">
          <UiListRow
            v-for="sub in childrenQ.data.value?.data ?? []"
            :key="sub.id"
            @click="emit('openFolder', sub)"
            @dblclick="emit('openFolder', sub)"
            @contextmenu="onFolderContextMenu($event as MouseEvent, sub)"
          >
            <div class="col-span-5 flex items-center gap-3">
              <UiMaterialIcon name="folder" size="lg" filled class="text-secondary opacity-90" />
              <h3 class="font-body-md font-semibold text-on-background group-hover:text-secondary transition-colors truncate">{{ sub.name }}</h3>
            </div>
            <div class="col-span-2 text-on-surface-variant font-body-sm">File Folder</div>
            <div class="col-span-2 text-on-surface-variant font-body-sm flex items-center gap-1">
              <UiMaterialIcon
                v-if="isFetching"
                name="sync"
                size="sm"
                class="text-secondary animate-spin"
              />
              <span>{{ isFetching ? `Syncing ${sub.itemCount} Items` : `${sub.itemCount} Items` }}</span>
            </div>
            <div class="col-span-3 text-on-surface-variant font-body-sm">{{ formatRelative(sub.updatedAt) }}</div>
          </UiListRow>

          <UiListRow
            v-for="file in filesQ.data.value?.data ?? []"
            :key="file.id"
            @contextmenu="onFileContextMenu($event as MouseEvent, file)"
          >
            <div class="col-span-5 flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="[iconForFile(file.extension).bgClass, iconForFile(file.extension).iconClass]"
              >
                <UiMaterialIcon :name="iconForFile(file.extension).name" />
              </div>
              <div class="flex items-center gap-2 min-w-0">
                <p class="font-body-md font-semibold text-on-background truncate">{{ splitFileName(file.name).base }}</p>
                <span
                  v-if="splitFileName(file.name).ext"
                  class="bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                >{{ splitFileName(file.name).ext }}</span>
              </div>
            </div>
            <div class="col-span-2 text-on-surface-variant font-body-sm uppercase">{{ file.extension ?? "file" }}</div>
            <div class="col-span-2 text-on-surface-variant font-body-sm">{{ formatBytes(file.sizeBytes) }}</div>
            <div class="col-span-3 text-on-surface-variant font-body-sm">{{ formatRelative(file.updatedAt) }}</div>
          </UiListRow>
        </div>
      </div>

      <!-- GRID VIEW -->
      <div v-else>
        <div v-if="isLoading" class="py-12 flex justify-center">
          <UiSpinner size="md" />
        </div>

        <UiEmptyState
          v-else-if="isEmpty"
          icon="folder_open"
          title="This folder is empty"
        />

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <button
            v-for="sub in childrenQ.data.value?.data ?? []"
            :key="sub.id"
            type="button"
            class="group flex flex-col items-center text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary hover:shadow-medical-glow transition-all"
            @click="emit('openFolder', sub)"
            @dblclick="emit('openFolder', sub)"
            @contextmenu="onFolderContextMenu($event as MouseEvent, sub)"
          >
            <div class="w-16 h-16 rounded-2xl bg-secondary-container/40 flex items-center justify-center mb-3 group-hover:bg-secondary-container transition-colors">
              <UiMaterialIcon name="folder" size="xl" filled class="text-secondary" />
            </div>
            <p class="font-body-md font-semibold text-on-background truncate w-full">{{ sub.name }}</p>
            <p class="font-body-sm text-on-surface-variant flex items-center gap-1">
              <UiMaterialIcon
                v-if="isFetching"
                name="sync"
                size="sm"
                class="text-secondary animate-spin"
              />
              <span>{{ isFetching ? `Syncing ${sub.itemCount} items` : `${sub.itemCount} items` }}</span>
            </p>
          </button>

          <div
            v-for="file in filesQ.data.value?.data ?? []"
            :key="file.id"
            class="flex flex-col items-center text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-4"
            @contextmenu="onFileContextMenu($event as MouseEvent, file)"
          >
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              :class="[iconForFile(file.extension).bgClass, iconForFile(file.extension).iconClass]"
            >
              <UiMaterialIcon :name="iconForFile(file.extension).name" size="xl" />
            </div>
            <div class="flex items-center gap-1.5 justify-center w-full min-w-0">
              <p class="font-body-md font-semibold text-on-background truncate">{{ splitFileName(file.name).base }}</p>
              <span
                v-if="splitFileName(file.name).ext"
                class="bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
              >{{ splitFileName(file.name).ext }}</span>
            </div>
            <p class="font-body-sm text-on-surface-variant mt-1">{{ formatBytes(file.sizeBytes) }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
