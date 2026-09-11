/**
 * File: vitest.config.ts
 * Description:
 *   Vitest configuration for the QuantMind UI. Uses jsdom for React
 *   component tests, a global setup for jest-dom matchers, and v8 coverage
 *   scoped to source (excluding mock data, entrypoint, and generated code).
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/api/**', 'src/components/Sidebar.tsx', 'src/components/ToastNotification.tsx'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
