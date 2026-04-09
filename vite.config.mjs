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
  
  server: {
    port: 5173,
    host: '0.0.0.0',
    fs: {
      allow: [repoRoot],
    },
  },
});
