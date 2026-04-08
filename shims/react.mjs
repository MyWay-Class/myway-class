import { loadReactRuntime } from './react-cjs-loader.mjs';

const react = loadReactRuntime();

export default react;
export const StrictMode = react.StrictMode;
export const Fragment = react.Fragment;
export const useEffect = react.useEffect;
export const useMemo = react.useMemo;
export const useState = react.useState;
