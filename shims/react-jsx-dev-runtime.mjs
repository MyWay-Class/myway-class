import { loadReactDevRuntime } from './react-cjs-loader.mjs';

const runtime = loadReactDevRuntime();

export default runtime;
export const Fragment = runtime.Fragment;
export const jsxDEV = runtime.jsxDEV;
