import type { LoginResponse, ApiResponse } from '@myway/shared';
import { resolveApiBaseUrl } from './api-base';

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_STORAGE_KEY = 'mywayclass.auth';

export type ApiRequestResult<T> = ApiResponse<T> & {
  ok: boolean;
  status: number;
  headers: Headers;
};

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

function parseResponseBody<T>(bodyText: string): ApiResponse<T> | null {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<ApiRequestResult<T> | null> {
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
    const bodyText = await response.text();
    const parsed = parseResponseBody<T>(bodyText);

    if (parsed) {
      return {
        ...parsed,
        ok: response.ok,
        status: response.status,
        headers: response.headers,
      };
    }

    if (response.ok) {
      return {
        success: true,
        message: response.statusText || undefined,
        ok: true,
        status: response.status,
        headers: response.headers,
      };
    }

    return {
      success: false,
      error: {
        code: `HTTP_${response.status}`,
        message: response.statusText || '요청에 실패했습니다.',
      },
      message: response.statusText || '요청에 실패했습니다.',
      ok: false,
      status: response.status,
      headers: response.headers,
    };
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
