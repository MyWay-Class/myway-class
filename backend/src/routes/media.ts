import { Hono } from 'hono';
import {
  buildPipelineOverview,
  createLectureSummaryNote,
  getLectureDetail,
  listAudioExtractions,
  listLectureNotes,
  listLectureTranscripts,
  type AudioExtractionCallbackRequest,
  type AudioExtractionRequest,
  type MediaSummaryRequest,
  type TranscriptCreateRequest,
  type STTProviderCatalog,
} from '@myway/shared';
import { getAuthenticatedUser, hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { readLectureVideoAsset, uploadLectureVideoAsset } from '../lib/media-assets';
import { completeMediaExtractionJob, createMediaExtractionJob } from '../lib/media-pipeline';
import { createMediaRepository } from '../lib/media-repository';
import {
  loadMediaProcessorHealth,
  normalizeMediaCallbackPayload,
  verifyMediaCallbackSecret,
  verifyMediaProcessorToken,
} from '../lib/media-processor';
import { buildExtractionCallbackResponse, buildExtractionResponse } from '../lib/media-response';
import { getSTTProviderOverview } from '../lib/stt-provider';
import { PUBLIC_STT_MAX_DURATION_MS, runTranscriptGeneration } from '../lib/stt-adapter';
import { guardAiRequest } from '../lib/ai-controls';
import type { RuntimeBindings } from '../lib/runtime-env';

const media = new Hono();

function ensureLectureExists(lectureId: string, userId: string): boolean {
  return Boolean(getLectureDetail(lectureId, userId));
}

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

media.post('/upload-video', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  if (!hasRole(user, ['INSTRUCTOR', 'ADMIN'])) {
    return jsonFailure('FORBIDDEN', '영상 업로드는 강사와 운영자만 사용할 수 있습니다.', 403);
  }

  const formData = await c.req.formData();
  const lectureId = String(formData.get('lecture_id') ?? '').trim();
  const file = formData.get('video_file');
  const videoFile = typeof file === 'string' ? null : (file as Parameters<typeof uploadLectureVideoAsset>[1] | null);

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (!videoFile) {
    return jsonFailure('VIDEO_FILE_REQUIRED', 'video_file이 필요합니다.');
  }

  const upload = await uploadLectureVideoAsset(lectureId, videoFile, c.req.url, c.env as RuntimeBindings | undefined);

  if (!upload) {
    return jsonFailure('R2_BINDING_REQUIRED', '영상 업로드를 위해 R2 바인딩이 필요합니다.', 503);
  }

  return jsonSuccess(
    {
      lecture_id: lectureId,
      ...upload,
    },
    '강의 영상이 업로드되었습니다.',
    201,
  );
});

media.post('/transcribe', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'stt');
  if (access instanceof Response) {
    return access;
  }

  const body = await readJsonBody<TranscriptCreateRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();
  const language = body?.language === 'en' ? 'en' : 'ko';

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (typeof body?.duration_ms === 'number' && body.duration_ms > PUBLIC_STT_MAX_DURATION_MS) {
    return jsonFailure('STT_INPUT_TOO_LONG', '오디오 길이는 3분 이하만 허용됩니다.', 413);
  }

  const result = await runTranscriptGeneration(user.id, {
    lecture_id: lectureId,
    text: body?.text?.trim(),
    audio_url: body?.audio_url?.trim(),
    duration_ms: body?.duration_ms,
    language,
    stt_provider: body?.stt_provider?.trim(),
    stt_model: body?.stt_model?.trim(),
  }, undefined, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));

  if (!result.ok) {
    if (result.reason === 'input_too_large') {
      return jsonFailure('STT_INPUT_TOO_LONG', '오디오 길이는 3분 이하만 허용됩니다.', 413);
    }

    return jsonFailure('TRANSCRIPT_FAILED', '트랜스크립트를 생성할 수 없습니다.', 400);
  }

  await createLectureSummaryNote(
    user.id,
    {
      lecture_id: lectureId,
      style: 'timeline',
      language,
    },
    getMediaRepository(c.env as RuntimeBindings | undefined),
  );

  return jsonSuccess(
    {
      transcript_id: result.transcript_id,
      lecture_id: result.lecture_id,
      segment_count: result.segment_count,
      duration_ms: result.duration_ms,
      word_count: result.word_count,
      stt_provider: result.stt_provider,
      stt_model: result.stt_model,
      pipeline: result.pipeline,
    },
    '트랜스크립트가 생성되었습니다.',
    201,
  );
});

media.get('/providers', (c) => jsonSuccess(getSTTProviderOverview() satisfies STTProviderCatalog, 'STT provider 계층을 조회했습니다.'));

media.get('/processor-health', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const health = await loadMediaProcessorHealth(c.env as RuntimeBindings | undefined);
  if (!health) {
    return jsonFailure('MEDIA_PROCESSOR_UNAVAILABLE', '미디어 처리 서비스 상태를 가져올 수 없습니다.', 503);
  }

  return jsonSuccess(health, '미디어 처리 서비스 상태를 조회했습니다.');
});

media.get('/assets/:assetKey', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const assetKey = c.req.param('assetKey');

  if (!user && !verifyMediaProcessorToken(c.req.raw, c.env as RuntimeBindings | undefined)) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const response = await readLectureVideoAsset(assetKey, c.env as RuntimeBindings | undefined);
  if (!response) {
    return jsonFailure('ASSET_NOT_FOUND', '미디어 파일을 찾을 수 없습니다.', 404);
  }

  return response;
});

media.post('/summarize', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<MediaSummaryRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const result = await createLectureSummaryNote(user.id, {
    lecture_id: lectureId,
    style: body?.style ?? 'brief',
    language: body?.language ?? 'ko',
  }, getMediaRepository(c.env as RuntimeBindings | undefined));

  if (!result) {
    return jsonFailure('SUMMARY_FAILED', '요약을 생성할 수 없습니다.', 400);
  }

  return jsonSuccess(
    {
      note_id: result.note.id,
      lecture_id: result.note.lecture_id,
      title: result.note.title,
      content: result.note.content,
      key_concepts: result.note.key_concepts,
      keywords: result.note.keywords,
      timestamps: result.note.timestamps,
      style: body?.style ?? 'brief',
      pipeline: result.pipeline,
    },
    '요약이 생성되었습니다.',
    201,
  );
});

media.post('/extract-audio', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  if (!hasRole(user, ['INSTRUCTOR', 'ADMIN'])) {
    return jsonFailure('FORBIDDEN', '오디오 추출은 강사와 운영자만 사용할 수 있습니다.', 403);
  }

  const body = await readJsonBody<AudioExtractionRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();

  if (!body) {
    return jsonFailure('INVALID_BODY', '요청 본문이 올바르지 않습니다.');
  }

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const result = await createMediaExtractionJob(user.id, body, c.req.url, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));
  if (!result.ok) {
    const status =
      result.reason === 'processor_not_configured'
        ? 503
        : result.reason === 'dispatch_failed'
          ? 502
          : 400;
    return jsonFailure(result.reason.toUpperCase(), result.message, status);
  }

  return jsonSuccess(
    buildExtractionResponse(result.extraction, result.pipeline),
    result.mode === 'ready' ? '오디오 추출과 전사가 완료되었습니다.' : '오디오 추출 job이 생성되었습니다.',
    201,
  );
});

media.post('/extract-audio/callback', async (c) => {
  if (!verifyMediaCallbackSecret(c.req.raw, c.env as RuntimeBindings | undefined)) {
    return jsonFailure('FORBIDDEN', '유효한 callback secret이 필요합니다.', 403);
  }

  const body = await readJsonBody<AudioExtractionCallbackRequest>(c.req.raw);
  const payload = normalizeMediaCallbackPayload(body);
  if (!payload) {
    return jsonFailure('CALLBACK_INVALID', 'callback payload가 올바르지 않습니다.', 400);
  }

  const result = await completeMediaExtractionJob('media-processor', payload, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));
  if (!result.ok) {
    const status =
      result.reason === 'extraction_not_found'
        ? 404
        : result.reason === 'transcript_failed'
          ? 502
          : 400;
    return jsonFailure(result.reason.toUpperCase(), result.message, status);
  }

  return jsonSuccess(
    buildExtractionCallbackResponse(result.extraction, result.pipeline),
    '오디오 추출 callback이 반영되었습니다.',
  );
});

media.get('/transcript/:lectureId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess((await listLectureTranscripts(lectureId, getMediaRepository(c.env as RuntimeBindings | undefined)))[0] ?? null);
});

media.get('/notes/:lectureId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(await listLectureNotes(lectureId, getMediaRepository(c.env as RuntimeBindings | undefined)));
});

media.get('/audio-extractions/:lectureId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(await listAudioExtractions(lectureId, getMediaRepository(c.env as RuntimeBindings | undefined)));
});

media.get('/pipeline/:lectureId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(await buildPipelineOverview(lectureId, getMediaRepository(c.env as RuntimeBindings | undefined)));
});

export default media;
