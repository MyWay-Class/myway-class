import reactEntryUrl from '../node_modules/react/index.js?url';
import reactDevUrl from '../node_modules/react/cjs/react.development.js?url';
import reactJsxRuntimeIndexUrl from '../node_modules/react/jsx-runtime.js?url';
import reactJsxRuntimeDevUrl from '../node_modules/react/cjs/react-jsx-runtime.development.js?url';
import reactJsxDevRuntimeIndexUrl from '../node_modules/react/jsx-dev-runtime.js?url';
import reactJsxDevRuntimeDevUrl from '../node_modules/react/cjs/react-jsx-dev-runtime.development.js?url';
import reactDomIndexUrl from '../node_modules/react-dom/index.js?url';
import reactDomClientIndexUrl from '../node_modules/react-dom/client.js?url';
import reactDomClientDevUrl from '../node_modules/react-dom/cjs/react-dom-client.development.js?url';
import reactDomDevUrl from '../node_modules/react-dom/cjs/react-dom.development.js?url';
import schedulerIndexUrl from '../node_modules/scheduler/index.js?url';
import schedulerDevUrl from '../node_modules/scheduler/cjs/scheduler.development.js?url';

const processShim = { env: { NODE_ENV: 'development' } };
const sources = new Map();
const cache = new Map();

const sourceUrls = [
  reactEntryUrl,
  reactDevUrl,
  reactJsxRuntimeIndexUrl,
  reactJsxRuntimeDevUrl,
  reactJsxDevRuntimeIndexUrl,
  reactJsxDevRuntimeDevUrl,
  reactDomIndexUrl,
  reactDomClientIndexUrl,
  reactDomClientDevUrl,
  reactDomDevUrl,
  schedulerIndexUrl,
  schedulerDevUrl,
];

const fetchedSources = await Promise.all(
  sourceUrls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load runtime source from ${url}`);
    }
    return [url, await response.text()];
  }),
);

for (const [url, source] of fetchedSources) {
  sources.set(url, source);
}

function resolveSpecifier(specifier, parentUrl) {
  switch (specifier) {
    case 'react':
      return reactEntryUrl;
    case 'react-dom':
      return reactDomIndexUrl;
    case 'react-dom/client':
      return reactDomClientIndexUrl;
    case 'react/jsx-runtime':
      return reactJsxRuntimeIndexUrl;
    case 'react/jsx-dev-runtime':
      return reactJsxDevRuntimeIndexUrl;
    case 'scheduler':
      return schedulerIndexUrl;
    default:
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        return new URL(specifier, parentUrl).href;
      }
      throw new Error(`Unsupported CJS module requested: ${specifier}`);
  }
}

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

export function loadReactDevRuntime() {
  return loadModule(reactJsxDevRuntimeIndexUrl);
}

export function loadReactJsxRuntime() {
  return loadModule(reactJsxRuntimeIndexUrl);
}

export function loadReactDomClient() {
  return loadModule(reactDomClientIndexUrl);
}
