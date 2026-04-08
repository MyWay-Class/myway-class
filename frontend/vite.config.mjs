import { fileURLToPath, URL } from 'node:url';
import autoprefixer from 'autoprefixer';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: false,
    minify: false,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ['./index.html', './src/**/*.{ts,tsx}'],
        }),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@myway/shared': fileURLToPath(new URL('../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
