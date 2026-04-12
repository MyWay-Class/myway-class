import {
  listMyShortformLibrary,
  listShortformCommunity,
  saveShortformVideo,
  shareShortformVideo,
  toggleShortformLike,
  type ShortformLibraryItem,
  type ShortformCommunityItem,
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
