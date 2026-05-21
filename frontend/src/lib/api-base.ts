function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

export function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8787';
    }
  }

  throw new Error('VITE_API_BASE_URL is required outside local development.');
}
