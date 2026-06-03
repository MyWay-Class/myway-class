import { getStoredAuth, request } from '../api-core';
import type { ShortformExportStatusSummary } from './shortform-types';

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
