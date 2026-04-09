import { getDemoUser, getPermissions, type LoginResponse } from '@myway/shared';
import { clearStoredAuth, getFallbackUserId, getStoredAuth, request, storeAuth } from './api-core';

type BackendHealth = {
  status: string;
  service: string;
  timestamp: string;
};

export async function loadCurrentSession(): Promise<LoginResponse | null> {
  const storedAuth = getStoredAuth();

  if (!storedAuth) {
    return null;
  }

  const response = await request<LoginResponse>('/api/v1/auth/me', undefined, storedAuth.session_token);

  if (response?.success && response.data) {
    storeAuth(response.data);
    return response.data;
  }

  return storedAuth;
}

export async function loginWithUser(userId: string): Promise<LoginResponse | null> {
  const response = await request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  if (response?.success && response.data) {
    storeAuth(response.data);
    return response.data;
  }

  const fallbackUser = getDemoUser(userId);
  if (!fallbackUser) {
    return null;
  }

  const fallbackAuth: LoginResponse = {
    session_token: `local-${fallbackUser.id}`,
    user: fallbackUser,
    permissions: getPermissions(fallbackUser.role),
  };

  storeAuth(fallbackAuth);
  return fallbackAuth;
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

export { getStoredAuth, getFallbackUserId };
