import { ref } from "vue";

export interface ContextMenuItem {
  label: string;
  icon?: string;
  /** Style as destructive (red) */
  danger?: boolean;
  /** Disable the item (greyed out, not clickable) */
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

interface MenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

// Module-scoped — single global menu for the whole app.
const state = ref<MenuState>({ open: false, x: 0, y: 0, items: [] });

export function useContextMenu() {
  function open(event: MouseEvent, items: ContextMenuItem[]): void {
    event.preventDefault();
    event.stopPropagation();
    state.value = { open: true, x: event.clientX, y: event.clientY, items };
  }

  function close(): void {
    if (state.value.open) state.value = { ...state.value, open: false };
  }

  return { state, open, close };
}
