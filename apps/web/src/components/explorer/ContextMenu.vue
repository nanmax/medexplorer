<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { UiMaterialIcon } from "@medexplorer/ui";
import { useContextMenu } from "@/composables/useContextMenu";

const { state, close } = useContextMenu();

const menuEl = ref<HTMLElement | null>(null);
// Clamp the menu inside the viewport so it never overflows when the click
// happens near the right/bottom edge.
const position = computed(() => {
  if (typeof window === "undefined") return { left: "0px", top: "0px" };
  const w = menuEl.value?.offsetWidth ?? 220;
  const h = menuEl.value?.offsetHeight ?? 100;
  const left = Math.min(state.value.x, window.innerWidth - w - 8);
  const top = Math.min(state.value.y, window.innerHeight - h - 8);
  return { left: `${left}px`, top: `${top}px` };
});

function onDocClick(e: MouseEvent) {
  if (!state.value.open) return;
  if (menuEl.value && menuEl.value.contains(e.target as Node)) return;
  close();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

onMounted(() => {
  window.addEventListener("mousedown", onDocClick);
  window.addEventListener("contextmenu", onDocClick);
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", onDocClick);
  window.removeEventListener("contextmenu", onDocClick);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("scroll", close, true);
  window.removeEventListener("resize", close);
});

watch(
  () => state.value.open,
  (open) => {
    if (!open) return;
    // Auto-focus first non-disabled item for keyboard nav.
    requestAnimationFrame(() => {
      menuEl.value?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
    });
  },
);

async function pick(item: { onClick: () => void | Promise<void>; disabled?: boolean }) {
  if (item.disabled) return;
  close();
  await item.onClick();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.open"
      ref="menuEl"
      role="menu"
      class="fixed z-[60] min-w-[200px] bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl py-1.5 medical-glow"
      :style="position"
    >
      <button
        v-for="(item, i) in state.items"
        :key="i"
        type="button"
        role="menuitem"
        :disabled="item.disabled"
        class="w-full flex items-center gap-3 px-3 py-2 text-left font-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="
          item.danger
            ? 'text-error hover:bg-error-container/40 focus:bg-error-container/40'
            : 'text-on-background hover:bg-surface-container-low focus:bg-surface-container-low'
        "
        @click="pick(item)"
      >
        <UiMaterialIcon v-if="item.icon" :name="item.icon" size="md" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
