import reactDevUrl from '../node_modules/react/cjs/react.development.js?url';
import jsxDevRuntimeDevUrl from '../node_modules/react/cjs/react-jsx-dev-runtime.development.js?url';
import jsxRuntimeDevUrl from '../node_modules/react/cjs/react-jsx-runtime.development.js?url';
import schedulerDevUrl from '../node_modules/scheduler/cjs/scheduler.development.js?url';
import reactDomDevUrl from '../node_modules/react-dom/cjs/react-dom.development.js?url';
import reactDomClientDevUrl from '../node_modules/react-dom/cjs/react-dom-client.development.js?url';

const processShim = { env: { NODE_ENV: 'development' } };

const [
  reactSource,
  jsxDevRuntimeSource,
  jsxRuntimeSource,
  schedulerSource,
  reactDomSource,
  reactDomClientSource,
] = await Promise.all([
  reactDevUrl,
  jsxDevRuntimeDevUrl,
  jsxRuntimeDevUrl,
  schedulerDevUrl,
  reactDomDevUrl,
  reactDomClientDevUrl,
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
