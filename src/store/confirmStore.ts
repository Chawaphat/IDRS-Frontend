import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  ask: (options: ConfirmOptions) => void;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  ask: (options) => {
    set({ isOpen: true, options });
  },
  confirm: () => {
    const options = get().options;
    if (options?.onConfirm) {
      options.onConfirm();
    }
    set({ isOpen: false, options: null });
  },
  cancel: () => {
    const options = get().options;
    if (options?.onCancel) {
      options.onCancel();
    }
    set({ isOpen: false, options: null });
  },
}));
