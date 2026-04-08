import { loadReactDomClient } from './react-cjs-loader.mjs';

const client = loadReactDomClient();

export const createRoot = client.createRoot;
export default client;
