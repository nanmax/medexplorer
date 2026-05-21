<script setup lang="ts">
import { UiButton, UiDialog } from "@medexplorer/ui";
import { useConfirm } from "@/composables/useConfirm";

const { state, resolve } = useConfirm();
</script>

<template>
  <UiDialog
    :open="state.open"
    :title="state.title"
    :description="state.description"
    @close="resolve(false)"
  >
    <template #footer>
      <UiButton variant="ghost" @click="resolve(false)">{{ state.cancelLabel ?? "Cancel" }}</UiButton>
      <button
        type="button"
        class="font-label-caps text-label-caps px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        :class="state.danger
          ? 'bg-error text-on-error hover:bg-error/90'
          : 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant'"
        @click="resolve(true)"
      >{{ state.confirmLabel ?? "Confirm" }}</button>
    </template>
  </UiDialog>
</template>
