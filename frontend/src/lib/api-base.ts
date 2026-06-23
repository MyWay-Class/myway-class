function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

const LOCAL_API_BASE_URL = 'http://127.0.0.1:8787';
const PRODUCTION_API_BASE_URL = 'https://myway-class-api-production.ggg9905.workers.dev';
const STAGING_API_BASE_URL = 'https://myway-class-api.ggg9905.workers.dev';

export function resolveApiBaseUrlFromHost(hostname?: string | null, configured?: string | null): string {
  const explicit = configured?.trim();
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  const host = hostname?.trim().toLowerCase() ?? '';
  if (!host) {
    return PRODUCTION_API_BASE_URL;
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API_BASE_URL;
  }

  if (host.startsWith('staging.')) {
    return STAGING_API_BASE_URL;
  }

  if (host.endsWith('mywayclass.pages.dev') || host.endsWith('.pages.dev')) {
    return PRODUCTION_API_BASE_URL;
  }

  return PRODUCTION_API_BASE_URL;
}

export function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== 'undefined') {
    return resolveApiBaseUrlFromHost(window.location.hostname, configured);
  }

  return resolveApiBaseUrlFromHost(null, configured);
}
