<script setup lang="ts">
interface Props {
  name: string;
  filled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const props = withDefaults(defineProps<Props>(), {
  filled: false,
  size: "md",
});

const sizeClass = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
}[props.size];
</script>

<template>
  <span
    class="material-symbols-outlined select-none"
    :class="[sizeClass, filled ? 'vitality-stroke-filled' : 'vitality-stroke']"
    aria-hidden="true"
  >{{ name }}</span>
</template>
