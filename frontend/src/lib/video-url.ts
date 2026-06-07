import { resolveApiBaseUrl } from './api-base';

function canonicalizeMediaAssetPath(videoUrl: string): string {
  const marker = '/api/v1/media/assets/';
  const markerIndex = videoUrl.indexOf(marker);
  if (markerIndex < 0) {
    return videoUrl;
  }
  return videoUrl;
}

function resolveMediaUrl(videoUrl: string): string {
  const normalizedInput = canonicalizeMediaAssetPath(videoUrl);
  if (/^https?:\/\//i.test(videoUrl)) {
    return normalizedInput;
  }

  try {
    return new URL(normalizedInput, `${resolveApiBaseUrl()}/`).toString();
  } catch {
    return `${resolveApiBaseUrl()}${normalizedInput.startsWith('/') ? normalizedInput : `/${normalizedInput}`}`;
  }
}

export function resolvePlayableVideoUrl(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  return resolveMediaUrl(videoUrl);
}

export function buildMediaAssetPathFromKey(assetKey: string | undefined): string | undefined {
  if (!assetKey) {
    return undefined;
  }

  const normalized = assetKey.trim();
  if (!normalized) {
    return undefined;
  }

  const encodedKey = normalized
    .split('/')
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/api/v1/media/assets/${encodedKey}`;
}

export function resolveLectureVideoUrl(input: { video_url?: string; video_asset_key?: string }): string | undefined {
  return resolvePlayableVideoUrl(input.video_url) ?? resolvePlayableVideoUrl(buildMediaAssetPathFromKey(input.video_asset_key));
}

export function buildProtectedVideoUrl(videoUrl: string | undefined, sessionToken?: string | null): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  const resolvedUrl = resolveMediaUrl(videoUrl);
  if (!sessionToken) {
    return resolvedUrl;
  }

  const needsToken =
    resolvedUrl.includes('/api/v1/media/assets/') ||
    resolvedUrl.includes('/legacy/media/assets/');
  if (!needsToken) {
    return resolvedUrl;
  }

  try {
    const url = new URL(resolvedUrl);
    url.searchParams.set('token', sessionToken);
    return url.toString();
  } catch {
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    return `${resolvedUrl}${separator}token=${encodeURIComponent(sessionToken)}`;
  }
}
