import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import autoprefixer from 'autoprefixer';
import { transform } from 'sucrase';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const repoRoot = dirname(fileURLToPath(new URL(import.meta.url)));
const frontendRoot = resolve(repoRoot, 'frontend');

function sucraseTransformPlugin() {
  return {
    name: 'sucrase-transform',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) {
        return null;
      }

      const isTs = id.endsWith('.ts');
      const isTsx = id.endsWith('.tsx');
      const isJsx = id.endsWith('.jsx');

      if (!isTs && !isTsx && !isJsx) {
        return null;
      }

      const transforms = ['typescript'];
      if (isTsx || isJsx) {
        transforms.push('jsx');
      }

      const result = transform(code, {
        filePath: id,
        transforms,
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        production: process.env.NODE_ENV === 'production',
        sourceMapOptions: {
          compiledFilename: id,
        },
      });

      return {
        code: result.code,
        map: result.sourceMap ?? null,
      };
    },
  };
}

export default defineConfig({
  root: frontendRoot,
  plugins: [sucraseTransformPlugin()],
  esbuild: false,
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  build: {
    cssMinify: false,
    minify: false,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [resolve(frontendRoot, 'index.html'), resolve(frontendRoot, 'src/**/*.{ts,tsx,js,jsx}')],
        }),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /^@myway\/shared$/,
        replacement: fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      },
      {
        find: /^react$/,
        replacement: fileURLToPath(new URL('./shims/react.mjs', import.meta.url)),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: fileURLToPath(new URL('./shims/react-jsx-runtime.mjs', import.meta.url)),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: fileURLToPath(new URL('./shims/react-jsx-dev-runtime.mjs', import.meta.url)),
      },
      {
        find: /^react-dom\/client$/,
        replacement: fileURLToPath(new URL('./shims/react-dom-client.mjs', import.meta.url)),
      },
    ],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
