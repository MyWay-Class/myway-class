import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { demoLectures } from '@myway/shared';
import app from './index';
import { DEMO_VIDEO_BYTES } from './lib/demo-video';
import type { R2BucketLike } from './lib/runtime-env';
import { getLectureVideoAssetAliases } from './lib/media-assets';

const port = Number(process.env.PORT ?? '8787');
const host = process.env.HOST ?? '127.0.0.1';
const assetDir = process.env.MYWAY_MEDIA_ASSET_DIR ?? path.resolve(process.cwd(), '..', 'tmp', 'media-assets');

function encodeAssetKey(assetKey: string): string {
  return Buffer.from(assetKey, 'utf8').toString('base64url');
}

function getAssetPaths(assetKey: string): { bodyPath: string; metaPath: string } {
  const encoded = encodeAssetKey(assetKey);
  return {
    bodyPath: path.join(assetDir, `${encoded}.bin`),
    metaPath: path.join(assetDir, `${encoded}.json`),
  };
}

function createFileAssetBucket(): R2BucketLike {
  return {
    async put(key, value, options) {
      const { bodyPath, metaPath } = getAssetPaths(key);
      await fs.mkdir(assetDir, { recursive: true });
      const body = Buffer.from(await new Response(value as BodyInit).arrayBuffer());
      const metadata = {
        contentType: options?.httpMetadata?.contentType ?? 'application/octet-stream',
        contentDisposition: options?.httpMetadata?.contentDisposition ?? null,
      };

      await Promise.all([
        fs.writeFile(bodyPath, body),
        fs.writeFile(metaPath, JSON.stringify(metadata), 'utf8'),
      ]);
    },
    async get(key) {
      const { bodyPath, metaPath } = getAssetPaths(key);
      try {
        const [body, metaText] = await Promise.all([
          fs.readFile(bodyPath),
          fs.readFile(metaPath, 'utf8'),
        ]);
        const meta = JSON.parse(metaText) as { contentType?: string; contentDisposition?: string | null };
        return {
          body: Readable.toWeb(Readable.from([body])) as ReadableStream<Uint8Array>,
          httpMetadata: {
            contentType: meta.contentType,
            contentDisposition: meta.contentDisposition ?? undefined,
          },
        };
      } catch {
        return null;
      }
    },
  };
}

const runtimeEnv = {
  APP_ENV: 'development',
  API_ORIGIN: 'http://localhost:5173',
  MYWAY_AI_PUBLIC_MODE: 'dev',
  MYWAY_AI_REQUIRE_AUTH: 'false',
  MYWAY_AI_ENABLE_STT: 'true',
  MYWAY_AI_ENABLE_MEDIA_UPLOAD: 'true',
  MYWAY_AI_DAILY_LIMIT_SMART: '999',
  MYWAY_AI_DAILY_LIMIT_SUMMARY: '999',
  MYWAY_AI_DAILY_LIMIT_QUIZ: '999',
  MYWAY_AI_DAILY_LIMIT_STT: '999',
  MYWAY_AI_DAILY_LIMIT_ANSWER: '999',
  MYWAY_AI_DAILY_LIMIT_TOTAL: '999',
  MYWAY_AI_DAILY_LIMIT_GEMINI: '999',
  MYWAY_CLOUDFLARE_STT_MODEL: '@cf/openai/whisper-large-v3-turbo',
  MYWAY_GEMINI_MODEL: 'gemini-2.0-flash',
  MYWAY_GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MYWAY_MEDIA_PROCESSOR_URL: 'http://127.0.0.1:8788/jobs/audio-extraction',
  MYWAY_MEDIA_PROCESSOR_TOKEN: 'local-media-processor-token',
  MYWAY_MEDIA_CALLBACK_SECRET: 'local-media-callback-secret',
  MYWAY_OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  MYWAY_OLLAMA_MODEL: 'llama3.1:8b',
  ASSETS: createFileAssetBucket(),
};

async function seedDemoLectureVideoAssets(): Promise<void> {
  if (!runtimeEnv.ASSETS) {
    return;
  }

  const samplePath = path.resolve(process.cwd(), '..', 'temp-sample-10s.mp4');
  try {
    let sampleVideo: Buffer;
    try {
      sampleVideo = await fs.readFile(samplePath);
    } catch {
      sampleVideo = Buffer.from(DEMO_VIDEO_BYTES);
    }
    let seededCount = 0;

    for (const lecture of demoLectures) {
      if (!lecture.video_asset_key) {
        continue;
      }

      const assetKeys = [lecture.video_asset_key, ...getLectureVideoAssetAliases(lecture.video_asset_key)];
      for (const assetKey of assetKeys) {
        await runtimeEnv.ASSETS.put(assetKey, sampleVideo, {
          httpMetadata: {
            contentType: 'video/mp4',
            contentDisposition: `inline; filename="${lecture.id}.mp4"`,
          },
        });
        seededCount += 1;
      }
    }

    console.log(`Seeded ${seededCount} demo lecture video assets from ${samplePath}`);
  } catch (error) {
    console.warn(
      'Failed to seed demo lecture video assets:',
      error instanceof Error ? error.message : error,
    );
  }
}

function buildRequestUrl(req: http.IncomingMessage): string {
  const hostHeader = req.headers.host ?? `${host}:${port}`;
  return `http://${hostHeader}${req.url ?? '/'}`;
}

const server = http.createServer(async (req, res) => {
  try {
    const method = req.method ?? 'GET';
    const url = buildRequestUrl(req);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'undefined') {
        continue;
      }

      if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      } else {
        headers.set(key, value);
      }
    }

    const init: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      init.body = Readable.toWeb(req) as unknown as ReadableStream;
      init.duplex = 'half';
    }

    const response = await app.fetch(new Request(url, init), runtimeEnv as never);

    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = response.body;
    if (body) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
      return;
    }

    res.end();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: false,
        code: 'DEV_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
});

seedDemoLectureVideoAssets().finally(() => {
  server.listen(port, host, () => {
    console.log(`Backend dev server listening on http://${host}:${port}`);
  });
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
