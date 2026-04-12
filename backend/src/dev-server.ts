import http from 'node:http';
import { Readable } from 'node:stream';
import app from './index';

const port = Number(process.env.PORT ?? '8787');
const host = process.env.HOST ?? '127.0.0.1';

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
};

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

server.listen(port, host, () => {
  console.log(`Backend dev server listening on http://${host}:${port}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
