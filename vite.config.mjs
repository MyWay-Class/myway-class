import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repoRoot = dirname(fileURLToPath(new URL(import.meta.url)));
const frontendRoot = resolve(repoRoot, 'frontend');

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@myway/shared': resolve(repoRoot, 'packages/shared/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/frontend/src/features/lms/pages/')) return 'lms-pages';
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
          if (id.includes('recharts')) return 'charts-vendor';
          if (id.includes('remixicon')) return 'icon-vendor';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    fs: {
      allow: [repoRoot],
    },
  },
});
