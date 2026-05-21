import { ref } from "vue";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptState extends ConfirmOptions {
  open: boolean;
}

const state = ref<PromptState>({ open: false, title: "" });
let resolver: ((v: boolean) => void) | null = null;

/**
 * Show a global confirmation dialog. Resolves to true if the user
 * confirms, false if they cancel or dismiss.
 */
export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    state.value = { open: true, ...opts };
    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  }

  function resolve(answer: boolean): void {
    state.value = { ...state.value, open: false };
    if (resolver) {
      resolver(answer);
      resolver = null;
    }
  }

  return { state, confirm, resolve };
}
