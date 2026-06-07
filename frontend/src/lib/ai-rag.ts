import type { AIRagRequest, AIRagResult, ApiResponse } from '@myway/shared';
import { resolveApiBaseUrl } from './api-base';
import { getStoredAuth } from './api-core';

const API_BASE_URL = resolveApiBaseUrl();

function readStoredAuth(): { session_token: string } | null {
  const auth = getStoredAuth();
  return auth?.session_token ? { session_token: auth.session_token } : null;
}

async function request<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<ApiResponse<T> | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
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

export async function loadAIRAGOverview(
  input: AIRagRequest,
  sessionToken?: string | null,
): Promise<AIRagResult | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIRagResult>(
    '/api/v1/ai/rag',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}
