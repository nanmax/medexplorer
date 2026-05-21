<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  type: "button",
  disabled: false,
  loading: false,
});

defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="font-label-caps text-label-caps px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="{
      'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant shadow-sm': variant === 'primary',
      'bg-secondary-container text-on-secondary-container hover:opacity-90': variant === 'secondary',
      'text-on-surface-variant hover:bg-surface-container-high': variant === 'ghost',
    }"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
