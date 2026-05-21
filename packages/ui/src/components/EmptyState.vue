<script setup lang="ts">
import MaterialIcon from "./MaterialIcon.vue";

interface Props {
  icon?: string;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  icon: "folder_open",
});
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6 text-on-surface-variant">
    <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
      <MaterialIcon :name="icon" size="xl" />
    </div>
    <h3 class="font-body-md text-body-md font-semibold text-on-background mb-1">{{ title }}</h3>
    <p v-if="description" class="font-body-sm text-body-sm max-w-sm">{{ description }}</p>
    <slot />
  </div>
</template>
