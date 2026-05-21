<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { FolderDto } from "@medexplorer/shared";
import { folderApi } from "@/services/folder.api";
import { useExplorerStore } from "@/stores/explorer.store";
import { UiMaterialIcon, UiSpinner } from "@medexplorer/ui";
import { iconForRootFolder } from "@/utils/folder-icons";
import { useContextMenu } from "@/composables/useContextMenu";
import { useConfirm } from "@/composables/useConfirm";
import { ApiError } from "@/services/http";

interface Props {
  node: FolderDto;
  depth: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ select: [folder: FolderDto] }>();

const store = useExplorerStore();
const isExpanded = ref(false);
const isLoading = ref(false);
const children = ref<FolderDto[] | null>(null);
const error = ref<string | null>(null);

const isRoot = computed(() => props.depth === 0);
const isSelected = computed(() => store.selectedFolderId === props.node.id);
const folderIcon = computed(() =>
  isRoot.value ? iconForRootFolder(props.node.name) : isExpanded.value ? "folder_open" : "folder",
);

watch(isExpanded, (open) => store.setExpanded(props.node.id, open));

async function loadChildren(force = false) {
  if (!force && (children.value !== null || isLoading.value)) return;
  isLoading.value = true;
  error.value = null;
  try {
    const res = await folderApi.listChildren(props.node.id, { limit: 100 });
    children.value = res.data;
  } catch (e) {
    error.value = (e as Error).message ?? "Failed to load";
  } finally {
    isLoading.value = false;
  }
}

// Refresh this node's children when it is the parent of a mutation.
watch(
  () => store.treeVersion,
  () => {
    if (!isExpanded.value) return;
    if (store.lastMutatedParentId === props.node.id) {
      loadChildren(true);
    }
  },
);

async function toggle() {
  if (!props.node.hasChildren) return;
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) await loadChildren();
}

async function onActivate() {
  emit("select", props.node);
  if (props.node.hasChildren && !isExpanded.value) {
    isExpanded.value = true;
    await loadChildren();
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowRight" && !isExpanded.value && props.node.hasChildren) {
    e.preventDefault();
    toggle();
  } else if (e.key === "ArrowLeft" && isExpanded.value) {
    e.preventDefault();
    isExpanded.value = false;
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onActivate();
  }
}

const { open: openMenu } = useContextMenu();
const { confirm } = useConfirm();

async function onDelete() {
  const ok = await confirm({
    title: `Delete "${props.node.name}"?`,
    description: `This permanently removes the folder and everything inside it. This action cannot be undone.`,
    confirmLabel: "Delete folder",
    danger: true,
  });
  if (!ok) return;
  try {
    await folderApi.remove(props.node.id);
    store.notifyMutation(props.node.parentId);
    // If the deleted folder was the selected one, drop the selection.
    if (store.selectedFolderId === props.node.id) store.clearSelection();
  } catch (e) {
    alert(e instanceof ApiError ? e.message : (e as Error).message ?? "Failed to delete folder");
  }
}

function onContextMenu(e: MouseEvent) {
  openMenu(e, [
    { label: "Open", icon: "folder_open", onClick: () => emit("select", props.node) },
    {
      label: isExpanded.value ? "Collapse" : "Expand",
      icon: isExpanded.value ? "expand_less" : "expand_more",
      disabled: !props.node.hasChildren,
      onClick: toggle,
    },
    { label: "Delete folder", icon: "delete", danger: true, onClick: onDelete },
  ]);
}
</script>

<template>
  <li
    role="treeitem"
    :aria-expanded="node.hasChildren ? isExpanded : undefined"
    :aria-selected="isSelected"
  >
    <!-- Root (depth=0): styled like the mockup sidebar category. -->
    <div
      v-if="isRoot"
      class="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer select-none transition-all"
      :class="
        isSelected
          ? 'bg-secondary-container text-on-secondary-container font-semibold scale-95 duration-75'
          : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-high'
      "
      tabindex="0"
      @click="onActivate"
      @keydown="onKeyDown"
      @contextmenu="onContextMenu"
    >
      <button
        v-if="node.hasChildren"
        type="button"
        class="p-0 -ml-1 flex items-center"
        :aria-label="isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`"
        @click.stop="toggle"
      >
        <UiMaterialIcon
          :name="isExpanded ? 'expand_more' : 'chevron_right'"
          size="sm"
          :filled="isSelected"
        />
      </button>
      <span v-else class="w-3 inline-block" aria-hidden="true" />

      <UiMaterialIcon :name="folderIcon" :filled="isSelected" />
      <span class="font-label-caps ml-1 truncate flex-1">{{ node.name }}</span>
      <UiSpinner v-if="isLoading" size="sm" />
    </div>

    <!-- Sub-folders (depth > 0): standard tree row. -->
    <div
      v-else
      class="flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer select-none transition-colors"
      :class="
        isSelected
          ? 'bg-secondary-container/30 text-on-secondary-fixed-variant font-semibold'
          : 'hover:bg-surface-container-low text-on-surface'
      "
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      tabindex="0"
      @click="onActivate"
      @keydown="onKeyDown"
      @contextmenu="onContextMenu"
    >
      <button
        v-if="node.hasChildren"
        type="button"
        class="p-0.5 rounded hover:bg-surface-container"
        :aria-label="isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`"
        @click.stop="toggle"
      >
        <UiMaterialIcon :name="isExpanded ? 'expand_more' : 'chevron_right'" size="sm" />
      </button>
      <span v-else class="w-5 inline-block" aria-hidden="true" />

      <UiMaterialIcon :name="folderIcon" size="md" filled class="text-secondary" />
      <span class="font-body-md truncate flex-1">{{ node.name }}</span>
      <UiSpinner v-if="isLoading" size="sm" />
    </div>

    <ul
      v-if="isExpanded && !error"
      role="group"
      class="list-none m-0 p-0"
    >
      <FolderTreeNode
        v-for="child in children ?? []"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        @select="(f) => emit('select', f)"
      />
      <li
        v-if="isExpanded && children !== null && children.length === 0"
        class="text-xs text-on-surface-variant pl-10 py-1"
      >Empty folder</li>
    </ul>
    <div v-if="error" class="text-xs text-error pl-10 py-1" role="alert">{{ error }}</div>
  </li>
</template>
