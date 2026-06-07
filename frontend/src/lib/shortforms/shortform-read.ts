import type {
  ShortformComposeRequest,
  ShortformExtraction,
  ShortformExtractionDetail,
  ShortformGenerateRequest,
  ShortformLibraryItem,
  ShortformCommunityItem,
  ShortformVideo,
  ShortformVideoDetail,
} from '@myway/shared';
import { getStoredAuth, request } from '../api-core';

export async function loadShortformLibrary(sessionToken?: string | null): Promise<ShortformLibraryItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return [];

  const response = await request<ShortformLibraryItem[]>('/api/v1/shortform/library', undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function loadShortformCommunity(
  courseId?: string | null,
  sessionToken?: string | null,
): Promise<ShortformCommunityItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
  if (!token) return [];

  const response = await request<ShortformCommunityItem[]>(`/api/v1/shortform/community${query}`, undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function generateShortformExtractionDraft(
  input: ShortformGenerateRequest,
  sessionToken?: string | null,
): Promise<ShortformExtractionDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<ShortformExtractionDetail>(
    '/api/v1/shortform/generate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function loadShortformExtractionDraft(
  extractionId: string,
  sessionToken?: string | null,
): Promise<ShortformExtractionDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<ShortformExtractionDetail>(`/api/v1/shortform/extraction/${encodeURIComponent(extractionId)}`, undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function composeShortformDraft(
  input: ShortformComposeRequest,
  sessionToken?: string | null,
): Promise<{ video: ShortformVideo | null; errorCode?: string; errorMessage?: string }> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return { video: null, errorCode: 'AUTH_REQUIRED', errorMessage: '로그인이 필요합니다.' };

  const response = await request<ShortformVideo>(
    '/api/v1/shortform/compose',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  if (response?.success && response.data) {
    return { video: response.data };
  }

  return {
    video: null,
    errorCode: response?.error?.code ?? 'SHORTFORM_COMPOSE_FAILED',
    errorMessage: response?.error?.message ?? response?.message ?? '숏폼 생성에 실패했습니다.',
  };
}

export async function loadShortformVideoDraft(
  videoId: string,
  sessionToken?: string | null,
): Promise<ShortformVideoDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<ShortformVideoDetail>(`/api/v1/shortform/video/${encodeURIComponent(videoId)}`, undefined, token);
  return response?.success && response.data ? response.data : null;
}
