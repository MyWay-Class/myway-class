import {
  getDashboard,
  getAIInsightsForUser,
  getAILogOverviewForUser,
  getAIRecommendationsForUser,
  getAIUserSettings,
  getAIProviderCatalog,
  updateAIUserSettings,
  type AIInsights,
  type AILogOverview,
  type AIRecommendationOverview,
  type AIUserSettings,
  type AIUserSettingsUpdateRequest,
  type AIProviderCatalog,
  type Dashboard,
} from '@myway/shared';
import { getFallbackUserId, getStoredAuth, request } from './api-core';

const AI_PROVIDER_CATALOG_STORAGE_KEY = 'mywayclass.ai.providers';

function readCachedAIProviderCatalog(): AIProviderCatalog | null {
  try {
    const value = localStorage.getItem(AI_PROVIDER_CATALOG_STORAGE_KEY);
    return value ? (JSON.parse(value) as AIProviderCatalog) : null;
  } catch {
    return null;
  }
}

function storeCachedAIProviderCatalog(catalog: AIProviderCatalog): void {
  try {
    localStorage.setItem(AI_PROVIDER_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    // Ignore storage failures and fall back to the in-memory response path.
  }
}

export async function loadDashboard(sessionToken?: string | null): Promise<Dashboard | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Dashboard>(`/api/v1/dashboard`, undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getDashboard(userId);
}

export async function loadAIInsights(sessionToken?: string | null): Promise<AIInsights | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIInsights>('/api/v1/ai/insights', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIInsightsForUser(userId);
}

export async function loadAILogs(sessionToken?: string | null): Promise<AILogOverview | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AILogOverview>('/api/v1/ai/logs', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAILogOverviewForUser(userId);
}

export async function loadAIRecommendations(sessionToken?: string | null): Promise<AIRecommendationOverview | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIRecommendationOverview>('/api/v1/ai/recommendations', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIRecommendationsForUser(userId);
}

export async function loadAISettings(sessionToken?: string | null): Promise<AIUserSettings | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIUserSettings>('/api/v1/ai/settings', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIUserSettings(userId);
}

export async function loadAIProviders(sessionToken?: string | null): Promise<AIProviderCatalog | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIProviderCatalog>('/api/v1/ai/providers', undefined, token);
  if (response?.success && response.data) {
    storeCachedAIProviderCatalog(response.data);
    return response.data;
  }

  const cachedCatalog = readCachedAIProviderCatalog();
  if (cachedCatalog) {
    return getAIProviderCatalog(cachedCatalog.runtime_policy);
  }

  return getAIProviderCatalog();
}

export async function saveAISettings(
  input: AIUserSettingsUpdateRequest,
  sessionToken?: string | null,
): Promise<AIUserSettings | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIUserSettings>(
    '/api/v1/ai/settings',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );

  const userId = getFallbackUserId();
  return response?.success && response.data ? response.data : updateAIUserSettings(userId, input);
}
