import os from 'node:os';
import path from 'node:path';

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function trimTrailingSlash(value) {
  return String(value ?? '').replace(/\/+$/, '');
}

export function getProcessorConfig() {
  const port = toInt(process.env.PORT, 8788);
  const host = process.env.HOST || '127.0.0.1';
  const publicBaseUrl = trimTrailingSlash(process.env.MEDIA_PROCESSOR_PUBLIC_BASE_URL || `http://${host}:${port}`);

  return {
    port,
    host,
    publicBaseUrl,
    workDir: process.env.MEDIA_PROCESSOR_WORK_DIR || path.join(os.tmpdir(), 'mywayclass-media-processor'),
    token: process.env.MYWAY_MEDIA_PROCESSOR_TOKEN || process.env.MEDIA_PROCESSOR_TOKEN || 'local-media-processor-token',
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  };
}
