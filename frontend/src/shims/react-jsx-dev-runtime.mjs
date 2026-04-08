import { loadReactDevRuntime } from './react-cjs-loader.mjs';

const runtime = loadReactDevRuntime();

export const Fragment = runtime.Fragment;
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export const jsxDEV = runtime.jsxDEV;
