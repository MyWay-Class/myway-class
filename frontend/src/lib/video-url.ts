import { resolveApiBaseUrl } from './api-base';

function resolveMediaUrl(videoUrl: string): string {
  if (/^https?:\/\//i.test(videoUrl)) {
    return videoUrl;
  }

  try {
    return new URL(videoUrl, `${resolveApiBaseUrl()}/`).toString();
  } catch {
    return `${resolveApiBaseUrl()}${videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`}`;
  }
}

export function resolvePlayableVideoUrl(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  return resolveMediaUrl(videoUrl);
}

export function buildProtectedVideoUrl(videoUrl: string | undefined, sessionToken?: string | null): string | undefined {
  if (!videoUrl || !sessionToken) {
    return undefined;
  }

  const resolvedUrl = resolveMediaUrl(videoUrl);

  try {
    const url = new URL(resolvedUrl);
    url.searchParams.set('token', sessionToken);
    return url.toString();
  } catch {
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    return `${resolvedUrl}${separator}token=${encodeURIComponent(sessionToken)}`;
  }
}
