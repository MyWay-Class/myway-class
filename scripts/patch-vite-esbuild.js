const fs = require('fs');
const path = require('path');

function findViteChunkDir(rootDir) {
  const viteChunksDir = path.join(rootDir, 'node_modules', 'vite', 'dist', 'node', 'chunks');
  return fs.existsSync(viteChunksDir) ? viteChunksDir : null;
}

function patchChunkFile(chunkFile, shimRelativePath) {
  const original = fs.readFileSync(chunkFile, 'utf8');
  if (original.includes(shimRelativePath)) {
    return false;
  }

  const updated = original.replace(
    /from 'esbuild';/,
    `from '${shimRelativePath}';`,
  );

  if (updated === original) {
    return false;
  }

  fs.writeFileSync(chunkFile, updated, 'utf8');
  return true;
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const shimSource = path.join(__dirname, 'vite-esbuild-shim.mjs');
  const viteChunksDir = findViteChunkDir(rootDir);

  if (!viteChunksDir || !fs.existsSync(shimSource)) {
    return;
  }

  const shimTarget = path.join(viteChunksDir, 'esbuild-shim.js');
  fs.copyFileSync(shimSource, shimTarget);

  const depFiles = fs
    .readdirSync(viteChunksDir)
    .filter((file) => /^dep-.*\.js$/.test(file))
    .map((file) => path.join(viteChunksDir, file));

  for (const depFile of depFiles) {
    const changed = patchChunkFile(depFile, './esbuild-shim.js');
    if (changed) {
      break;
    }
  }
}

main();
