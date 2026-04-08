import { loadReactJsxRuntime } from './react-cjs-loader.mjs';

const runtime = loadReactJsxRuntime();

export default runtime;
export const Fragment = runtime.Fragment;
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
