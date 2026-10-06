// useTheme — shared light/dark theme state driven by the `dark` class on <html>.
// The anti-flash inline script in index.html owns the initial class before paint;
// this hook reads that state and lets the UI toggle + persist it.
import { useState, useCallback } from 'react';

export type Theme = 'dark' | 'light';

/**
 * Resolve the theme to apply before paint. A stored 'light'|'dark' value wins;
 * otherwise fall back to the OS preference (prefersDark ? dark : light).
 * Keep this in sync with the inline script in index.html.
 */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
