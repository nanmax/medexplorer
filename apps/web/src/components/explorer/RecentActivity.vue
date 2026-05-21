<script setup lang="ts">
import { useRecentActivity } from "@/composables/useRecentActivity";
import { UiMaterialIcon } from "@medexplorer/ui";
import { formatRelative } from "@/utils/format";
import { useRouter } from "vue-router";

const { items } = useRecentActivity();
const router = useRouter();

function open(id: string) {
  router.push({ name: "folder", params: { id } });
}
</script>

<template>
  <section
    class="bg-white/60 backdrop-blur-md border border-outline-variant rounded-xl p-6 medical-glow"
    aria-labelledby="recent-activity-heading"
  >
    <h2
      id="recent-activity-heading"
      class="font-headline-lg-mobile text-on-background mb-4 flex items-center gap-2"
    >
      <UiMaterialIcon name="history" class="text-secondary" />
      Recent Activity
    </h2>

    <div v-if="items.length === 0" class="text-center py-10 text-on-surface-variant">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-container flex items-center justify-center">
        <UiMaterialIcon name="schedule" size="lg" />
      </div>
      <p class="font-body-md text-on-background font-semibold">No recent activity yet</p>
      <p class="font-body-sm mt-1">Folders you open will appear here for quick access.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        v-for="entry in items"
        :key="entry.id"
        type="button"
        class="flex items-center gap-4 p-3 hover:bg-surface-container-low rounded-lg transition-colors text-left border border-transparent hover:border-outline-variant/50 w-full"
        @click="open(entry.id)"
      >
        <div class="w-10 h-10 bg-secondary-container/30 rounded-lg flex items-center justify-center text-on-secondary-fixed-variant flex-shrink-0">
          <UiMaterialIcon name="folder" filled />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-body-md font-semibold text-on-background truncate">{{ entry.name }}</p>
            <span class="bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Folder
            </span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <p class="font-body-sm text-on-surface-variant">Opened {{ formatRelative(entry.visitedAt) }}</p>
            <span class="w-1 h-1 rounded-full bg-outline-variant" />
            <p class="font-body-sm text-on-surface-variant font-medium">{{ entry.itemCount }} items</p>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>
