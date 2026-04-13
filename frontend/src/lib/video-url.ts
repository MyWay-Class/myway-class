export function buildProtectedVideoUrl(videoUrl: string | undefined, sessionToken?: string | null): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  if (!sessionToken) {
    return undefined;
  }

  try {
    const url = new URL(videoUrl, window.location.origin);
    url.searchParams.set('token', sessionToken);
    return url.toString();
  } catch {
    const separator = videoUrl.includes('?') ? '&' : '?';
    return `${videoUrl}${separator}token=${encodeURIComponent(sessionToken)}`;
  }
}
