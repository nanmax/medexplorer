<script setup lang="ts">
import MaterialIcon from "./MaterialIcon.vue";

interface Props {
  icon: string;
  filled?: boolean;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
  iconSize?: "sm" | "md" | "lg" | "xl";
}

withDefaults(defineProps<Props>(), {
  filled: false,
  active: false,
  disabled: false,
  iconSize: "lg",
});

defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    :aria-pressed="active"
    :disabled="disabled"
    class="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="active ? 'text-secondary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'"
    @click="$emit('click', $event)"
  >
    <MaterialIcon :name="icon" :size="iconSize" :filled="filled || active" />
  </button>
</template>
