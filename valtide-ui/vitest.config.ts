/**
 * File: vitest.config.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W1.1 — Port typed BFF client from valtide-ui into valtide-web-ui2.
 * Description:
 *   Vitest configuration for the ui2 unit suite. jsdom environment is required
 *   for the useAsync hook test (React renderHook). Coverage is scoped to the
 *   new API logic files (src/api) with the ≥95% project target; type-only and
 *   bootstrap/wiring files carry no runnable logic and are excluded.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Narrow cast: vite8/rolldown's Plugin type and vitest's bundled-vite Plugin
  // type diverge (TS2769 on hotUpdate/rolldownVersion), and the two packages
  // ship separate vite copies so no shared PluginOption type reconciles them.
  // The plugin runs fine at runtime; `any` on this one tooling line keeps tsc
  // a usable gate without touching real app code.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/api/client.ts', 'src/api/useAsync.ts', 'src/api/scanMapper.ts', 'src/api/newsMapper.ts'],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 85 },
    },
  },
});
