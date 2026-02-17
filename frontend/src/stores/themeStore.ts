import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (resolved: 'light' | 'dark') => {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },

      toggleTheme: () => {
        const current = get().theme;
        const next: Theme =
          current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        get().setTheme(next);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state: ThemeState) => ({ theme: state.theme }),
    }
  )
);

// Apply the correct theme after rehydration from localStorage
useThemeStore.persist.onFinishHydration((state) => {
  const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
  applyTheme(resolved);
  useThemeStore.setState({ resolvedTheme: resolved });
});

// Listen for OS theme changes to update when in 'system' mode
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === 'system') {
      setTheme('system');
    }
  });
