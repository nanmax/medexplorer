<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useExplorerStore } from "@/stores/explorer.store";
import { folderApi } from "@/services/folder.api";
import { UiButton, UiDialog } from "@medexplorer/ui";
import { ApiError } from "@/services/http";

const store = useExplorerStore();
const name = ref("");
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const target = computed(() => store.dialogTargetFolder);
const parentLabel = computed(() => target.value?.name ?? "Repository (root)");

watch(
  () => store.newFolderDialogOpen,
  (open) => {
    if (open) {
      name.value = "";
      errorMessage.value = null;
      isSubmitting.value = false;
    }
  },
);

async function submit() {
  const trimmed = name.value.trim();
  if (!trimmed || isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    const parentId = target.value?.id ?? null;
    await folderApi.create({ name: trimmed, parentId });
    store.notifyMutation(parentId);
    store.closeDialogs();
  } catch (e) {
    if (e instanceof ApiError) {
      errorMessage.value =
        e.code === "CONFLICT"
          ? `A folder named "${trimmed}" already exists in ${parentLabel.value}.`
          : e.message;
    } else {
      errorMessage.value = (e as Error).message ?? "Failed to create folder";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UiDialog
    :open="store.newFolderDialogOpen"
    title="New Folder"
    :description="`Create a folder inside ${parentLabel}.`"
    @close="store.closeDialogs"
  >
    <form id="new-folder-form" class="flex flex-col gap-3" @submit.prevent="submit">
      <label class="font-body-sm font-semibold text-on-background" for="new-folder-name">
        Folder name
      </label>
      <input
        id="new-folder-name"
        v-model="name"
        type="text"
        required
        maxlength="255"
        placeholder="e.g. Q4 Lab Results"
        autocomplete="off"
        class="w-full bg-surface-container-low border border-outline-variant text-on-background font-body-md rounded-lg px-4 py-2.5 focus:outline-none focus:border-tertiary-container focus:ring-2 focus:ring-tertiary-fixed-dim/50 transition-all"
      />
      <p v-if="errorMessage" role="alert" class="text-error font-body-sm">{{ errorMessage }}</p>
    </form>

    <template #footer>
      <UiButton variant="ghost" :disabled="isSubmitting" @click="store.closeDialogs">Cancel</UiButton>
      <UiButton
        type="submit"
        form="new-folder-form"
        :loading="isSubmitting"
        :disabled="!name.trim() || isSubmitting"
        @click="submit"
      >
        Create folder
      </UiButton>
    </template>
  </UiDialog>
</template>
