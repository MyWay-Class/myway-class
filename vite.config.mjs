import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import autoprefixer from 'autoprefixer';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

const repoRoot = dirname(fileURLToPath(new URL(import.meta.url)));
const frontendRoot = resolve(repoRoot, 'frontend');

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  build: {
    cssMinify: false,
    minify: false,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [resolve(frontendRoot, 'index.html'), resolve(frontendRoot, 'src/**/*.{ts,tsx}')],
        }),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@myway/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
