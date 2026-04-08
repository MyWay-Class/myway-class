import reactEntryUrl from '../node_modules/react/index.js?url';
import reactDomIndexUrl from '../node_modules/react-dom/index.js?url';
import reactDomClientUrl from '../node_modules/react-dom/client.js?url';
import schedulerIndexUrl from '../node_modules/scheduler/index.js?url';

const processShim = { env: { NODE_ENV: 'development' } };

const entryUrls = new Set([reactEntryUrl, reactDomIndexUrl, reactDomClientUrl, schedulerIndexUrl]);
const sources = new Map();
const cache = new Map();

function resolveSpecifier(specifier, parentUrl) {
  switch (specifier) {
    case 'react':
      return reactEntryUrl;
    case 'react-dom':
      return reactDomIndexUrl;
    case 'react-dom/client':
      return reactDomClientUrl;
    case 'scheduler':
      return schedulerIndexUrl;
    default:
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        return new URL(specifier, parentUrl).href;
      }
      throw new Error(`Unsupported CJS module requested: ${specifier}`);
  }
}

function collectRequires(source) {
  const requires = [];
  const pattern = /require\((['"])([^'"]+)\1\)/g;
  let match;

  while ((match = pattern.exec(source))) {
    requires.push(match[2]);
  }

  return requires;
}

async function preload(url, seen = new Set()) {
  if (sources.has(url) || seen.has(url)) {
    return;
  }

  seen.add(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load runtime source from ${url}`);
  }

  const source = await response.text();
  sources.set(url, source);

  for (const specifier of collectRequires(source)) {
    const resolved = resolveSpecifier(specifier, url);
    await preload(resolved, seen);
  }
}

await Promise.all(Array.from(entryUrls, (url) => preload(url)));

function loadModule(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const source = sources.get(url);
  if (!source) {
    throw new Error(`Missing runtime source for ${url}`);
  }

  const module = { exports: {} };
  cache.set(url, module.exports);

  const require = (specifier) => loadModule(resolveSpecifier(specifier, url));
  const factory = new Function('require', 'module', 'exports', 'process', source);
  factory(require, module, module.exports, processShim);

  cache.set(url, module.exports);
  return module.exports;
}

export function loadReactRuntime() {
  return loadModule(reactEntryUrl);
}

export function loadReactDomClient() {
  return loadModule(reactDomClientUrl);
}
