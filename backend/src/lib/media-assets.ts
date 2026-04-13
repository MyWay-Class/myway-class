import type { RuntimeBindings } from './runtime-env';
import { buildDemoVideoResponse } from './demo-video';

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

function buildContentDisposition(fileName: string): string {
  const safeName = sanitizeName(fileName) || 'lecture-video.mp4';
  return `inline; filename="${safeName}"`;
}

function normalizeContentDisposition(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return /^[\x20-\x7E]+$/.test(value) ? value : undefined;
}

function buildAssetResponseHeaders(contentType?: string, contentDisposition?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': contentType ?? 'application/octet-stream',
  };

  const normalizedContentDisposition = normalizeContentDisposition(contentDisposition ?? undefined);
  if (normalizedContentDisposition) {
    headers['Content-Disposition'] = normalizedContentDisposition;
  }

  return headers;
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
  const contentDisposition = buildContentDisposition(file.name);

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
      return buildDemoVideoResponse();
    }

    return new Response(asset.body, {
      headers: buildAssetResponseHeaders(asset.contentType, asset.contentDisposition),
    });
  }

  const asset = await env.ASSETS.get(assetKey);
  if (!asset?.body) {
    return buildDemoVideoResponse();
  }

  return new Response(asset.body, {
    headers: buildAssetResponseHeaders(asset.httpMetadata?.contentType, asset.httpMetadata?.contentDisposition),
  });
}
