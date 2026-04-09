import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = dirname(fileURLToPath(new URL('.', import.meta.url)));
const repoRoot = resolve(frontendRoot, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@myway/shared': resolve(repoRoot, 'packages/shared/src'),
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
