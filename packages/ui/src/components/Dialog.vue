<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import MaterialIcon from "./MaterialIcon.vue";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Max width tailwind class, e.g. "max-w-md" */
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: "max-w-md",
});

const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) emit("close");
}

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

watch(
  () => props.open,
  (open) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="emit('close')"
      >
        <div
          class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full overflow-hidden flex flex-col"
          :class="maxWidth"
          @click.stop
        >
          <header class="flex items-start justify-between px-6 pt-5 pb-3 gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="font-headline-lg-mobile text-on-background truncate">{{ title }}</h2>
              <p v-if="description" class="font-body-sm text-on-surface-variant mt-1">{{ description }}</p>
            </div>
            <button
              type="button"
              class="p-1 -mr-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <MaterialIcon name="close" />
            </button>
          </header>
          <div class="px-6 pb-6 flex-1 overflow-auto">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="px-6 py-4 border-t border-outline-variant bg-surface-container-low/50 flex justify-end gap-2">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
