import type { LoginResponse, ApiResponse } from '@myway/shared';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'mywayclass.auth';

function readStoredAuth(): LoginResponse | null {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? (JSON.parse(value) as LoginResponse) : null;
  } catch {
    return null;
  }
}

export function getStoredAuth(): LoginResponse | null {
  return readStoredAuth();
}

export function storeAuth(auth: LoginResponse): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getFallbackUserId(userId?: string | null): string {
  const storedAuth = readStoredAuth();

  if (storedAuth?.user) {
    return storedAuth.user.id;
  }

  if (userId) {
    return userId;
  }

  return 'guest';
}

export async function request<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<ApiResponse<T> | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const isFormData = init?.body instanceof FormData;
  const headers = new Headers(init?.headers ?? undefined);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!isFormData) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...init,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export function unwrap<T>(response: ApiResponse<T> | null, fallback: () => T): T {
  if (response?.success && response.data !== undefined) {
    return response.data;
  }

  return fallback();
}
