import { create } from "zustand";

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3800,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m) => useToastStore.getState().push(m, "success"),
  error: (m) => useToastStore.getState().push(m, "error"),
  info: (m) => useToastStore.getState().push(m, "info"),
};
