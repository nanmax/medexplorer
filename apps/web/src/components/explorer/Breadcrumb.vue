<script setup lang="ts">
import type { FolderBreadcrumb } from "@medexplorer/shared";
import { UiMaterialIcon } from "@medexplorer/ui";

interface Props { crumbs: FolderBreadcrumb[] }
defineProps<Props>();
defineEmits<{
  navigate: [id: string];
  home: [];
}>();
</script>

<template>
  <nav
    class="flex items-center gap-2 text-on-surface-variant font-body-sm flex-wrap"
    aria-label="Breadcrumb"
  >
    <button
      type="button"
      class="p-1 -m-1 rounded hover:bg-surface-container-high hover:text-secondary transition-colors"
      aria-label="Go to home"
      @click="$emit('home')"
    >
      <UiMaterialIcon name="computer" size="md" />
    </button>
    <template v-for="(crumb, idx) in crumbs" :key="crumb.id">
      <UiMaterialIcon name="chevron_right" size="sm" />
      <button
        type="button"
        class="hover:text-secondary transition-colors"
        :class="{ 'font-semibold text-on-background': idx === crumbs.length - 1 }"
        :aria-current="idx === crumbs.length - 1 ? 'page' : undefined"
        @click="$emit('navigate', crumb.id)"
      >{{ crumb.name }}</button>
    </template>
  </nav>
</template>
