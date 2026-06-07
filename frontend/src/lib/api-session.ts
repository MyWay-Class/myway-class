import { type AuthUser, type LoginResponse } from '@myway/shared';
import { clearStoredAuth, getFallbackUserId, getStoredAuth, request, storeAuth } from './api-core';

type BackendHealth = {
  status: string;
  service: string;
  timestamp: string;
};

function normalizeRole(role: string): AuthUser['role'] {
  const normalized = role.trim().toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'INSTRUCTOR' || normalized === 'STUDENT') {
    return normalized;
  }
  return 'STUDENT';
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    role: normalizeRole(user.role),
  };
}

function normalizeLoginResponse(response: LoginResponse): LoginResponse {
  return {
    ...response,
    user: normalizeAuthUser(response.user),
  };
}

export async function loadCurrentSession(): Promise<LoginResponse | null> {
  const storedAuth = getStoredAuth();

  if (!storedAuth) {
    return null;
  }

  const response = await request<LoginResponse>('/api/v1/auth/me', undefined, storedAuth.session_token);

  if (response?.success && response.data) {
    const normalized = normalizeLoginResponse(response.data);
    storeAuth(normalized);
    return normalized;
  }

  clearStoredAuth();
  return null;
}

export async function loginWithUser(userId: string): Promise<LoginResponse | null> {
  const response = await request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  if (response?.success && response.data) {
    const normalized = normalizeLoginResponse(response.data);
    storeAuth(normalized);
    return normalized;
  }
  return null;
}

export async function logoutCurrentSession(sessionToken?: string | null): Promise<void> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (token) {
    await request('/api/v1/auth/logout', { method: 'POST' }, token);
  }

  clearStoredAuth();
}

export async function loadBackendHealth(): Promise<boolean> {
  const response = await request<BackendHealth>('/api/v1/health');
  return Boolean(response?.success && response.data?.status === 'ok');
}

export async function loadLoginUsers(): Promise<AuthUser[]> {
  const response = await request<AuthUser[]>('/api/v1/auth/users');
  if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
    return response.data.map(normalizeAuthUser);
  }
  return [];
}

export { getStoredAuth, getFallbackUserId };
