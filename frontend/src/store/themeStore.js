import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: true,
      toggleTheme: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
      initTheme: () => {
        document.documentElement.classList.toggle("dark", get().isDark);
      },
    }),
    { name: "theme-storage" },
  ),
);
