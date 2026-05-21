<script setup lang="ts">
import SideNav from "./SideNav.vue";
import TopBar from "./TopBar.vue";
import type { FolderDto } from "@medexplorer/shared";

defineEmits<{ select: [folder: FolderDto] }>();
</script>

<template>
  <div class="flex w-full h-full">
    <SideNav @select="(f) => $emit('select', f)" />
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <TopBar />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
