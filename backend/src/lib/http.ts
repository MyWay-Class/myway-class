import type { ApiError, ApiResponse } from '@myway/shared';

export function jsonSuccess<T>(data: T, message?: string, status = 200): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return Response.json(payload, { status });
}

export function jsonFailure(
  code: string,
  message: string,
  status = 400,
  meta?: Record<string, unknown>,
): Response {
  const payload: ApiResponse<never> = {
    success: false,
    error: meta ? { code, message, meta } satisfies ApiError : { code, message } satisfies ApiError,
    message,
  };
  const headers: Record<string, string> = {};
  if (meta) {
    const remaining = meta.remaining;
    const resetAt = meta.reset_at;
    if (typeof remaining === 'number' || typeof remaining === 'string') {
      headers['x-ai-quota-remaining'] = String(remaining);
    }
    if (typeof resetAt === 'string' && resetAt) {
      headers['x-ai-quota-reset'] = resetAt;
    }
    if (typeof meta.role === 'string' && meta.role) {
      headers['x-ai-quota-role'] = meta.role;
    }
    if (typeof meta.feature === 'string' && meta.feature) {
      headers['x-ai-quota-feature'] = meta.feature;
    }
    if (typeof meta.limit === 'number' || typeof meta.limit === 'string') {
      headers['x-ai-quota-limit'] = String(meta.limit);
    }
  }

  return Response.json(payload, { status, headers });
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
