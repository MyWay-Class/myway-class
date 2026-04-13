import { buildAIRAGOverview, type AIRagRequest, type AIRagResult, type ApiResponse } from '@myway/shared';
import { resolveApiBaseUrl } from './api-base';

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_STORAGE_KEY = 'mywayclass.auth';

function readStoredAuth(): { session_token: string } | null {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? (JSON.parse(value) as { session_token: string }) : null;
  } catch {
    return null;
  }
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
    return await buildAIRAGOverview(input);
  }

  const response = await request<AIRagResult>(
    '/api/v1/ai/rag',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : await buildAIRAGOverview(input);
}
