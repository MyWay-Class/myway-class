import { loadReactDomClient } from './react-cjs-loader.mjs';

const client = loadReactDomClient();

export default client;
export const createRoot = client.createRoot;
export const hydrateRoot = client.hydrateRoot;
export const version = client.version;
