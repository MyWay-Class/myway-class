import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { getProcessorConfig } from './config.mjs';
import { createJobStore } from './jobs.mjs';
import { processAudioExtractionJob } from './service.mjs';

const config = getProcessorConfig();
const jobStore = createJobStore();

function json(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function unauthorized(response) {
  json(response, 401, { success: false, error: 'UNAUTHORIZED' });
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
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

function isAuthorized(request) {
  const header = request.headers.authorization ?? '';
  return header === `Bearer ${config.token}`;
}

async function serveAsset(response, fileName) {
  const filePath = path.join(config.workDir, 'output', fileName);
  try {
    const buffer = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': 'audio/wav' });
    response.end(buffer);
  } catch {
    json(response, 404, { success: false, error: 'ASSET_NOT_FOUND' });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', config.publicBaseUrl);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json(response, 200, { success: true, status: 'ok' });
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

    let body;
    try {
      body = await parseBody(request);
    } catch {
      return json(response, 400, { success: false, error: 'INVALID_BODY' });
    }

    if (!body?.extraction_id || !body?.lecture_id || !body?.source_video_url || !body?.callback?.url) {
      return json(response, 400, { success: false, error: 'INVALID_JOB_REQUEST' });
    }

    const job = jobStore.createJob(body);
    processAudioExtractionJob(jobStore, config, job);

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
