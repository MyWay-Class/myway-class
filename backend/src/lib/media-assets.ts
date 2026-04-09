import type { RuntimeBindings } from './runtime-env';

type MediaUploadResult = {
  asset_key: string;
  video_url: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
};

type UploadableFile = Blob & {
  name: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function sanitizeName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildAssetKey(lectureId: string, fileName: string): string {
  const baseName = sanitizeName(fileName) || 'lecture-video';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `media/${lectureId}/${stamp}-${baseName}`;
}

function buildAssetUrl(assetKey: string, env?: RuntimeBindings): string {
  const origin = env?.API_ORIGIN?.replace(/\/$/, '');
  return origin ? `${origin}/api/v1/media/assets/${encodeURIComponent(assetKey)}` : `/api/v1/media/assets/${encodeURIComponent(assetKey)}`;
}

export async function uploadLectureVideoAsset(
  lectureId: string,
  file: UploadableFile,
  env?: RuntimeBindings,
): Promise<MediaUploadResult | null> {
  if (!env?.ASSETS) {
    return null;
  }

  const assetKey = buildAssetKey(lectureId, file.name);
  await env.ASSETS.put(assetKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'video/mp4',
      contentDisposition: `inline; filename="${file.name.replace(/"/g, '')}"`,
    },
  });

  return {
    asset_key: assetKey,
    video_url: buildAssetUrl(assetKey, env),
    file_name: file.name,
    content_type: file.type || 'video/mp4',
    size_bytes: file.size,
  };
}

export async function readLectureVideoAsset(assetKey: string, env?: RuntimeBindings): Promise<Response | null> {
  if (!env?.ASSETS) {
    return null;
  }

  const asset = await env.ASSETS.get(assetKey);
  if (!asset?.body) {
    return null;
  }

  return new Response(asset.body, {
    headers: {
      'Content-Type': asset.httpMetadata?.contentType ?? 'application/octet-stream',
      ...(asset.httpMetadata?.contentDisposition ? { 'Content-Disposition': asset.httpMetadata.contentDisposition } : {}),
    },
  });
}
