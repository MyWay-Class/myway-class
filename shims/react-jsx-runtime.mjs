import { loadReactJsxRuntime } from './react-cjs-loader.mjs';

const runtime = loadReactJsxRuntime();

export const Fragment = runtime.Fragment;
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export default runtime;
