import reactProdUrl from '../node_modules/react/cjs/react.production.js?url';
import jsxDevRuntimeProdUrl from '../node_modules/react/cjs/react-jsx-dev-runtime.production.js?url';
import jsxRuntimeProdUrl from '../node_modules/react/cjs/react-jsx-runtime.production.js?url';
import schedulerProdUrl from '../node_modules/scheduler/cjs/scheduler.production.js?url';
import reactDomProdUrl from '../node_modules/react-dom/cjs/react-dom.production.js?url';
import reactDomClientProdUrl from '../node_modules/react-dom/cjs/react-dom-client.production.js?url';

const processShim = { env: { NODE_ENV: 'production' } };

const [
  reactSource,
  jsxDevRuntimeSource,
  jsxRuntimeSource,
  schedulerSource,
  reactDomSource,
  reactDomClientSource,
] = await Promise.all([
  reactProdUrl,
  jsxDevRuntimeProdUrl,
  jsxRuntimeProdUrl,
  schedulerProdUrl,
  reactDomProdUrl,
  reactDomClientProdUrl,
].map(async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load runtime source from ${url}`);
  }
  return response.text();
}));

const sources = {
  react: reactSource,
  'react/jsx-dev-runtime': jsxDevRuntimeSource,
  'react/jsx-runtime': jsxRuntimeSource,
  scheduler: schedulerSource,
  'react-dom': reactDomSource,
  'react-dom/client': reactDomClientSource,
};

const cache = new Map();

function createModule(name) {
  const source = sources[name];
  if (!source) {
    throw new Error(`Unsupported CJS module requested: ${name}`);
  }

  if (cache.has(name)) {
    return cache.get(name);
  }

  const module = { exports: {} };
  cache.set(name, module.exports);

  const require = (dep) => createModule(dep);
  const factory = new Function('require', 'module', 'exports', 'process', source);
  factory(require, module, module.exports, processShim);

  cache.set(name, module.exports);
  return module.exports;
}

export function loadReactRuntime() {
  return createModule('react');
}

export function loadReactDevRuntime() {
  return createModule('react/jsx-dev-runtime');
}

export function loadReactJsxRuntime() {
  return createModule('react/jsx-runtime');
}

export function loadReactDomClient() {
  return createModule('react-dom/client');
}
