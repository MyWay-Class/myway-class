import {
  composeShortformVideo,
  generateShortformExtraction,
  getShortformExtractionById,
  getShortformVideoDetail,
  listMyShortformLibrary,
  listShortformCommunity,
  saveShortformVideo,
  shareShortformVideo,
  toggleShortformLike,
  type ShortformComposeRequest,
  type ShortformExtraction,
  type ShortformExtractionDetail,
  type ShortformGenerateRequest,
  type ShortformLibraryItem,
  type ShortformCommunityItem,
  type ShortformVideo,
  type ShortformVideoDetail,
  type ShortformSaveRequest,
  type ShortformShareRequest,
} from '@myway/shared';
import { getFallbackUserId, getStoredAuth, request } from './api-core';

export async function loadShortformLibrary(sessionToken?: string | null): Promise<ShortformLibraryItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return listMyShortformLibrary(userId);
  }

  const response = await request<ShortformLibraryItem[]>('/api/v1/shortform/library', undefined, token);
  return response?.success && response.data ? response.data : listMyShortformLibrary(userId);
}

export async function loadShortformCommunity(
  courseId?: string | null,
  sessionToken?: string | null,
): Promise<ShortformCommunityItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';

  if (!token) {
    return listShortformCommunity(userId, courseId ?? undefined);
  }

  const response = await request<ShortformCommunityItem[]>(`/api/v1/shortform/community${query}`, undefined, token);
  return response?.success && response.data ? response.data : listShortformCommunity(userId, courseId ?? undefined);
}

export async function shareShortformDraft(
  input: ShortformShareRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return Boolean(shareShortformVideo(userId, input));
  }

  const response = await request(
    '/api/v1/shortform/share',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success) || Boolean(shareShortformVideo(userId, input));
}

export async function saveShortformDraft(
  input: ShortformSaveRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return Boolean(saveShortformVideo(userId, input));
  }

  const response = await request(
    '/api/v1/shortform/save',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success) || Boolean(saveShortformVideo(userId, input));
}

export async function toggleShortformLikeDraft(
  videoId: string,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const input = { video_id: videoId };

  if (!token) {
    return Boolean(toggleShortformLike(userId, input));
  }

  const response = await request(
    '/api/v1/shortform/like',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success) || Boolean(toggleShortformLike(userId, input));
}

export async function retryShortformExportDraft(
  videoId: string,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return false;
  }

  const response = await request(
    `/api/v1/shortform/${encodeURIComponent(videoId)}/export/retry`,
    {
      method: 'POST',
    },
    token,
  );

  return Boolean(response?.success);
}

export async function generateShortformExtractionDraft(
  input: ShortformGenerateRequest,
  sessionToken?: string | null,
): Promise<ShortformExtraction | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return generateShortformExtraction(userId, input);
  }

  const response = await request<ShortformExtraction>(
    '/api/v1/shortform/generate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : generateShortformExtraction(userId, input);
}

export async function loadShortformExtractionDraft(
  extractionId: string,
  sessionToken?: string | null,
): Promise<ShortformExtractionDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return getShortformExtractionById(extractionId) ?? null;
  }

  const response = await request<ShortformExtractionDetail>(`/api/v1/shortform/extraction/${encodeURIComponent(extractionId)}`, undefined, token);
  return response?.success && response.data ? response.data : getShortformExtractionById(extractionId) ?? null;
}

export async function composeShortformDraft(
  input: ShortformComposeRequest,
  sessionToken?: string | null,
): Promise<{ video: ShortformVideo | null; errorCode?: string; errorMessage?: string }> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return { video: composeShortformVideo(userId, input) };
  }

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

  if (!token) {
    return getShortformVideoDetail(videoId) ?? null;
  }

  const response = await request<ShortformVideoDetail>(`/api/v1/shortform/video/${encodeURIComponent(videoId)}`, undefined, token);
  return response?.success && response.data ? response.data : getShortformVideoDetail(videoId) ?? null;
}

export type ShortformExportStatusSummary = {
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  failed_permanent_count: number;
  last_updated_at?: string | null;
  failed_items: Array<{
    id: string;
    title: string;
    user_id: string;
    export_status: string;
    retry_count: number;
    error_message?: string;
    updated_at?: string;
  }>;
};

export async function loadShortformExportStatus(
  sessionToken?: string | null,
): Promise<ShortformExportStatusSummary | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;
  const response = await request<ShortformExportStatusSummary>('/api/v1/shortform/admin/export-status', undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function retryFailedShortformExports(
  input?: { include_permanent?: boolean; limit?: number },
  sessionToken?: string | null,
): Promise<ShortformExportStatusSummary | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;
  const response = await request<{ status: ShortformExportStatusSummary }>(
    '/api/v1/shortform/admin/export/retry-failed',
    {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    },
    token,
  );
  return response?.success && response.data ? response.data.status : null;
}
