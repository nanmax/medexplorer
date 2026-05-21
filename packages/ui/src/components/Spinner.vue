<script setup lang="ts">
interface Props {
  size?: "sm" | "md" | "lg";
  label?: string;
}

withDefaults(defineProps<Props>(), {
  size: "md",
  label: "Loading",
});
</script>

<template>
  <span
    :role="'status'"
    :aria-label="label"
    class="inline-block border-2 border-current border-r-transparent rounded-full animate-spin text-secondary"
    :class="{
      'w-4 h-4': size === 'sm',
      'w-6 h-6': size === 'md',
      'w-10 h-10': size === 'lg',
    }"
  />
</template>
