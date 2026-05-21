<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "1rem",
  rounded: "md",
});
</script>

<template>
  <div
    class="bg-surface-container-highest animate-pulse"
    :class="{
      'rounded': rounded === 'sm',
      'rounded-lg': rounded === 'md',
      'rounded-xl': rounded === 'lg',
      'rounded-full': rounded === 'full',
    }"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>
