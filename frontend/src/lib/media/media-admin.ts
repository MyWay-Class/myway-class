import type { MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import { getStoredAuth, request } from '../api-core';

export async function loadMediaProviders(sessionToken?: string | null): Promise<STTProviderCatalog | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<STTProviderCatalog>('/api/v1/media/providers', undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function loadMediaProcessorHealth(sessionToken?: string | null): Promise<MediaProcessorHealth | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<MediaProcessorHealth>('/api/v1/media/processor-health', undefined, token);
  return response?.success && response.data ? response.data : null;
}
