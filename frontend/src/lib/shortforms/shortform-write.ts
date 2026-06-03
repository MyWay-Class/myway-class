import type { ShortformSaveRequest, ShortformShareRequest, ShortformVideo } from '@myway/shared';
import { getStoredAuth, request } from '../api-core';

export async function shareShortformDraft(
  input: ShortformShareRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return false;

  const response = await request(
    '/api/v1/shortform/share',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success);
}

export async function saveShortformDraft(
  input: ShortformSaveRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return false;

  const response = await request(
    '/api/v1/shortform/save',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success);
}

export async function toggleShortformLikeDraft(
  videoId: string,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const input = { video_id: videoId };
  if (!token) return false;

  const response = await request(
    '/api/v1/shortform/like',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success);
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
