<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useExplorerStore } from "@/stores/explorer.store";
import { fileApi } from "@/services/file.api";
import { UiButton, UiDialog, UiMaterialIcon } from "@medexplorer/ui";
import { formatBytes } from "@/utils/format";
import { ApiError } from "@/services/http";

const store = useExplorerStore();
const queued = ref<File[]>([]);
const isDragOver = ref(false);
const isUploading = ref(false);
const errorMessage = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const target = computed(() => store.dialogTargetFolder);
const targetLabel = computed(() => target.value?.name ?? "Select a folder first");
const canSubmit = computed(() => !!target.value && queued.value.length > 0 && !isUploading.value);

watch(
  () => store.uploadDialogOpen,
  (open) => {
    if (open) {
      queued.value = [];
      errorMessage.value = null;
      isDragOver.value = false;
      isUploading.value = false;
    }
  },
);

function pickFiles() { inputRef.value?.click(); }
function onPick(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  addFiles(Array.from(files));
  (e.target as HTMLInputElement).value = "";
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (!e.dataTransfer?.files) return;
  addFiles(Array.from(e.dataTransfer.files));
}

function addFiles(list: File[]) {
  // De-dupe by name + size to prevent accidental double-add of the same picked file
  const existing = new Set(queued.value.map((f) => `${f.name}:${f.size}`));
  for (const f of list) {
    const key = `${f.name}:${f.size}`;
    if (!existing.has(key)) {
      queued.value.push(f);
      existing.add(key);
    }
  }
}

function removeAt(index: number) { queued.value.splice(index, 1); }

async function submit() {
  if (!target.value || queued.value.length === 0 || isUploading.value) return;
  isUploading.value = true;
  errorMessage.value = null;
  try {
    await fileApi.upload(target.value.id, queued.value);
    store.notifyMutation(target.value.id);
    store.closeDialogs();
  } catch (e) {
    errorMessage.value = e instanceof ApiError ? e.message : (e as Error).message ?? "Upload failed";
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <UiDialog
    :open="store.uploadDialogOpen"
    title="Upload Files"
    :description="`Files will be added to: ${targetLabel}`"
    max-width="max-w-lg"
    @close="store.closeDialogs"
  >
    <div v-if="!target" role="alert" class="p-4 rounded-lg bg-error-container/40 text-on-error-container">
      Select a folder in the tree first, then click <strong>Upload Files</strong>.
    </div>

    <template v-else>
      <div
        class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
        :class="isDragOver ? 'border-secondary bg-secondary-container/30' : 'border-outline-variant hover:border-secondary/60'"
        role="button"
        tabindex="0"
        @click="pickFiles"
        @keydown.enter.prevent="pickFiles"
        @dragenter.prevent="isDragOver = true"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="onDrop"
      >
        <UiMaterialIcon name="cloud_upload" size="xl" class="text-secondary" />
        <p class="font-body-md text-on-background mt-2">Drop files here or click to choose</p>
        <p class="font-body-sm text-on-surface-variant mt-1">Only file metadata is stored (name, size, type).</p>
        <input
          ref="inputRef"
          type="file"
          multiple
          class="hidden"
          @change="onPick"
        />
      </div>

      <ul v-if="queued.length > 0" class="mt-4 flex flex-col gap-2 max-h-64 overflow-auto">
        <li
          v-for="(file, i) in queued"
          :key="file.name + i"
          class="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant"
        >
          <UiMaterialIcon name="description" class="text-secondary" />
          <div class="flex-1 min-w-0">
            <p class="font-body-md text-on-background truncate">{{ file.name }}</p>
            <p class="font-body-sm text-on-surface-variant">{{ formatBytes(file.size) }} · {{ file.type || "unknown" }}</p>
          </div>
          <button
            type="button"
            class="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
            :aria-label="`Remove ${file.name}`"
            :disabled="isUploading"
            @click="removeAt(i)"
          >
            <UiMaterialIcon name="close" size="sm" />
          </button>
        </li>
      </ul>

      <p v-if="errorMessage" role="alert" class="text-error font-body-sm mt-3">{{ errorMessage }}</p>
    </template>

    <template #footer>
      <UiButton variant="ghost" :disabled="isUploading" @click="store.closeDialogs">Cancel</UiButton>
      <UiButton :loading="isUploading" :disabled="!canSubmit" @click="submit">
        Upload {{ queued.length > 0 ? `(${queued.length})` : "" }}
      </UiButton>
    </template>
  </UiDialog>
</template>
