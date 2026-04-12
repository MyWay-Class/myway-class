import fs from 'node:fs/promises';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { getProcessorConfig } from './config';
import { createJobStore } from './jobs';
import { probeFfmpeg } from './ffmpeg';
import { processAudioExtractionJob } from './service';
import type { AudioExtractionJobRequest } from './types';

const config = getProcessorConfig();
const jobStore = createJobStore();

function json(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function unauthorized(response: ServerResponse): void {
  json(response, 401, { success: false, error: 'UNAUTHORIZED' });
}

function parseBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer | string) => {
      body += String(chunk);
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function isAuthorized(request: IncomingMessage): boolean {
  const header = request.headers.authorization ?? '';
  return header === `Bearer ${config.token}`;
}

async function buildHealthPayload(): Promise<Record<string, unknown>> {
  const jobs = jobStore.listJobs();
  const ffmpeg = await probeFfmpeg(config.ffmpegPath);
  const recentJobs = jobs.slice(0, 5).map((job) => ({
    id: job.id,
    lecture_id: job.lectureId,
    status: job.status,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
    audio_url: job.audioUrl,
    error_message: job.errorMessage,
    stage: job.stage,
    step: job.step,
    callback_status: job.callbackStatus,
  }));

  return {
    ok: true,
    status: 'ok',
    public_base_url: config.publicBaseUrl,
    work_dir: config.workDir,
    token_configured: Boolean(config.token),
    callback_secret_configured: Boolean(config.callbackSecret),
    ffmpeg: {
      available: ffmpeg.available,
      path: config.ffmpegPath,
      version: ffmpeg.version,
      output: ffmpeg.output,
    },
    jobs: {
      total: jobs.length,
      processing: jobs.filter((job) => job.status === 'PROCESSING').length,
      completed: jobs.filter((job) => job.status === 'COMPLETED').length,
      failed: jobs.filter((job) => job.status === 'FAILED').length,
    },
    recent_jobs: recentJobs,
    updated_at: new Date().toISOString(),
  };
}

async function serveAsset(response: ServerResponse, fileName: string): Promise<void> {
  const filePath = path.join(config.workDir, 'output', fileName);
  try {
    const buffer = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': 'audio/wav' });
    response.end(buffer);
  } catch {
    json(response, 404, { success: false, error: 'ASSET_NOT_FOUND' });
  }
}

function isAudioExtractionJobRequest(value: unknown): value is AudioExtractionJobRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<AudioExtractionJobRequest>;
  return Boolean(
    payload.extraction_id &&
      payload.lecture_id &&
      payload.source_video_url &&
      payload.callback?.url,
  );
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', config.publicBaseUrl);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json(response, 200, await buildHealthPayload());
  }

  if (request.method === 'GET' && url.pathname === '/jobs') {
    if (!isAuthorized(request)) {
      return unauthorized(response);
    }

    return json(response, 200, { success: true, jobs: jobStore.listJobs() });
  }

  if (request.method === 'GET' && url.pathname.startsWith('/jobs/')) {
    if (!isAuthorized(request)) {
      return unauthorized(response);
    }

    const jobId = url.pathname.split('/').pop() ?? '';
    const job = jobStore.getJob(jobId);
    if (!job) {
      return json(response, 404, { success: false, error: 'JOB_NOT_FOUND' });
    }

    return json(response, 200, { success: true, job });
  }

  if (request.method === 'GET' && url.pathname.startsWith('/assets/')) {
    const fileName = url.pathname.split('/').pop() ?? '';
    return serveAsset(response, fileName);
  }

  if (request.method === 'POST' && url.pathname === '/jobs/audio-extraction') {
    if (!isAuthorized(request)) {
      return unauthorized(response);
    }

    let body: unknown;
    try {
      body = await parseBody(request);
    } catch {
      return json(response, 400, { success: false, error: 'INVALID_BODY' });
    }

    if (!isAudioExtractionJobRequest(body)) {
      return json(response, 400, { success: false, error: 'INVALID_JOB_REQUEST' });
    }

    const job = jobStore.createJob(body);
    void processAudioExtractionJob(jobStore, config, job);

    return json(response, 202, {
      success: true,
      job_id: job.id,
      status: job.status,
    });
  }

  return json(response, 404, { success: false, error: 'NOT_FOUND' });
});

server.listen(config.port, config.host, () => {
  console.log(`[media-processor] listening on ${config.publicBaseUrl}`);
});
