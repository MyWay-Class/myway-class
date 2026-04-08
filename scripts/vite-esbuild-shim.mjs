import { transform as sucraseTransform } from 'sucrase';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyDefines(code, define) {
  if (!define) {
    return code;
  }

  let transformed = code;
  for (const key of Object.keys(define).sort((a, b) => b.length - a.length)) {
    transformed = transformed.replace(new RegExp(escapeRegExp(key), 'g'), String(define[key]));
  }

  return transformed;
}

function buildResult(code, options, sourceMap) {
  return {
    code,
    map: options?.sourcemap ? JSON.stringify(sourceMap) : '',
    warnings: [],
  };
}

function transformInternal(code, options = {}) {
  const loader = options.loader ?? 'js';
  if (loader === 'css') {
    return buildResult(code, options, {
      version: 3,
      file: options.sourcefile || 'input.css',
      names: [],
      sources: [options.sourcefile || 'input.css'],
      mappings: '',
      ignoreList: [],
    });
  }

  const filePath = options.sourcefile || 'input.js';
  const transforms = [];

  if (loader === 'ts' || loader === 'tsx' || loader === 'mts' || loader === 'cts') {
    transforms.push('typescript');
  }
  if (loader === 'jsx' || loader === 'tsx') {
    transforms.push('jsx');
  }

  const sucraseOptions = {
    filePath,
    sourceMapOptions: options.sourcemap ? { compiledFilename: filePath } : undefined,
    transforms,
  };

  if (transforms.includes('jsx')) {
    sucraseOptions.jsxRuntime = options.jsxRuntime || 'automatic';
    if (options.jsxImportSource) {
      sucraseOptions.jsxImportSource = options.jsxImportSource;
    }
    sucraseOptions.production = options.jsxDev === false;
  }

  const transformedCode = applyDefines(code, options.define);
  const result = sucraseTransform(transformedCode, sucraseOptions);
  return buildResult(result.code, options, result.sourceMap);
}

export async function transform(code, options) {
  return transformInternal(code, options);
}

export function transformSync(code, options) {
  return transformInternal(code, options);
}

export async function formatMessages(messages) {
  return messages.map((message) => {
    const location = message.location
      ? `${message.location.file || ''}:${message.location.line || 0}:${message.location.column || 0}`
      : '';
    return `${message.pluginName ? `${message.pluginName}: ` : ''}${location ? `${location}: ` : ''}${message.text || ''}`.trim();
  });
}

export function formatMessagesSync(messages) {
  return messages.map((message) => {
    const location = message.location
      ? `${message.location.file || ''}:${message.location.line || 0}:${message.location.column || 0}`
      : '';
    return `${message.pluginName ? `${message.pluginName}: ` : ''}${location ? `${location}: ` : ''}${message.text || ''}`.trim();
  });
}

export async function build() {
  throw new Error('esbuild build is not available in the local Vite shim.');
}

export function buildSync() {
  throw new Error('esbuild buildSync is not available in the local Vite shim.');
}

export async function context() {
  throw new Error('esbuild context is not available in the local Vite shim.');
}

const esbuildShim = {
  version: 'shim',
  transform,
  transformSync,
  formatMessages,
  formatMessagesSync,
  build,
  buildSync,
  context,
};

export default esbuildShim;
