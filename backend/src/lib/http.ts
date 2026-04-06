import type { ApiError, ApiResponse } from '@myway/shared';

export function jsonSuccess<T>(data: T, message?: string, status = 200): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return Response.json(payload, { status });
}

export function jsonFailure(code: string, message: string, status = 400): Response {
  const payload: ApiResponse<never> = {
    success: false,
    error: { code, message } satisfies ApiError,
    message,
  };

  return Response.json(payload, { status });
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
