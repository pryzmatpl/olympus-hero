import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest config kept independent of vite.config.ts so the dev-server
// storage middleware doesn't try to attach during test runs.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
