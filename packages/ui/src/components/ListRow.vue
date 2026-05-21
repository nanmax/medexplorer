<script setup lang="ts">
interface Props {
  selected?: boolean;
  clickable?: boolean;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  clickable: true,
});

const emit = defineEmits<{ click: [event: MouseEvent]; dblclick: [event: MouseEvent] }>();

function onClick(e: MouseEvent) { if (props.clickable) emit("click", e); }
function onDblClick(e: MouseEvent) { if (props.clickable) emit("dblclick", e); }
function onEnter(e: KeyboardEvent) {
  if (props.clickable) emit("click", e as unknown as MouseEvent);
}
</script>

<template>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 border-b items-center group transition-colors"
    :class="[
      selected
        ? 'border-secondary/50 bg-secondary-container/10'
        : 'border-outline-variant/30',
      clickable
        ? 'cursor-pointer hover:bg-surface-container-low'
        : '!cursor-default select-none',
      selected && clickable ? 'hover:bg-secondary-container/20' : '',
    ]"
    :aria-selected="selected"
    :aria-label="ariaLabel"
    role="row"
    :tabindex="clickable ? 0 : -1"
    @click="onClick"
    @dblclick="onDblClick"
    @keydown.enter="onEnter"
  >
    <slot />
  </div>
</template>
