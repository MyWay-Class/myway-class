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

type MemoryAsset = {
  body: ArrayBuffer;
  contentType: string;
  contentDisposition: string;
};

const memoryAssets = new Map<string, MemoryAsset>();

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

function buildAssetUrl(assetKey: string, requestUrl: string, env?: RuntimeBindings): string {
  const requestOrigin = new URL(requestUrl).origin;
  const origin = requestOrigin || env?.API_ORIGIN?.replace(/\/$/, '');
  return origin ? `${origin}/api/v1/media/assets/${encodeURIComponent(assetKey)}` : `/api/v1/media/assets/${encodeURIComponent(assetKey)}`;
}

export async function uploadLectureVideoAsset(
  lectureId: string,
  file: UploadableFile,
  requestUrl: string,
  env?: RuntimeBindings,
): Promise<MediaUploadResult | null> {
  const assetKey = buildAssetKey(lectureId, file.name);
  const body = await file.arrayBuffer();
  const contentType = file.type || 'video/mp4';
  const contentDisposition = `inline; filename="${file.name.replace(/"/g, '')}"`;

  if (!env?.ASSETS) {
    memoryAssets.set(assetKey, {
      body,
      contentType,
      contentDisposition,
    });
  } else {
    await env.ASSETS.put(assetKey, body, {
      httpMetadata: {
        contentType,
        contentDisposition,
      },
    });
  }

  return {
    asset_key: assetKey,
    video_url: buildAssetUrl(assetKey, requestUrl, env),
    file_name: file.name,
    content_type: contentType,
    size_bytes: file.size,
  };
}

export async function readLectureVideoAsset(assetKey: string, env?: RuntimeBindings): Promise<Response | null> {
  if (!env?.ASSETS) {
    const asset = memoryAssets.get(assetKey);
    if (!asset) {
      return null;
    }

    return new Response(asset.body, {
      headers: {
        'Content-Type': asset.contentType,
        'Content-Disposition': asset.contentDisposition,
      },
    });
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
