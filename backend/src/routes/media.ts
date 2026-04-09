import { Hono } from 'hono';
import {
  buildPipelineOverview,
  createAudioExtraction,
  createLectureSummaryNote,
  getLectureDetail,
  listAudioExtractions,
  listLectureNotes,
  listLectureTranscripts,
  type AudioExtractionRequest,
  type MediaSummaryRequest,
  type TranscriptCreateRequest,
  type STTProviderCatalog,
} from '@myway/shared';
import { getAuthenticatedUser, hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { readLectureVideoAsset, uploadLectureVideoAsset } from '../lib/media-assets';
import { getSTTProviderOverview } from '../lib/stt-provider';
import { runTranscriptGeneration } from '../lib/stt-adapter';
import type { RuntimeBindings } from '../lib/runtime-env';

const media = new Hono();

function ensureLectureExists(lectureId: string, userId: string): boolean {
  return Boolean(getLectureDetail(lectureId, userId));
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

  const upload = await uploadLectureVideoAsset(lectureId, videoFile, c.env as RuntimeBindings | undefined);

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

  const body = await readJsonBody<TranscriptCreateRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const result = await runTranscriptGeneration(user.id, {
    lecture_id: lectureId,
    text: body?.text?.trim(),
    audio_url: body?.audio_url?.trim(),
    duration_ms: body?.duration_ms,
    language: body?.language ?? 'ko',
    stt_provider: body?.stt_provider?.trim(),
    stt_model: body?.stt_model?.trim(),
  }, undefined, c.env as RuntimeBindings | undefined);

  if (!result.ok) {
    return jsonFailure('TRANSCRIPT_FAILED', '트랜스크립트를 생성할 수 없습니다.', 400);
  }

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

media.get('/assets/:assetKey', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const assetKey = c.req.param('assetKey');

  if (!user) {
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

  const result = createLectureSummaryNote(user.id, {
    lecture_id: lectureId,
    style: body?.style ?? 'brief',
    language: body?.language ?? 'ko',
  });

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

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId, user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  let transcriptResult:
    | Awaited<ReturnType<typeof runTranscriptGeneration>>
    | null = null;

  if (body?.audio_url?.trim()) {
    transcriptResult = await runTranscriptGeneration(
      user.id,
      {
        lecture_id: lectureId,
        audio_url: body.audio_url.trim(),
        language: body?.language ?? 'ko',
        stt_provider: body?.stt_provider?.trim(),
        stt_model: body?.stt_model?.trim(),
      },
      'cloudflare',
      c.env as RuntimeBindings | undefined,
    );

    if (!transcriptResult.ok) {
      return jsonFailure('TRANSCRIPT_FAILED', '오디오 전사를 생성할 수 없습니다.', 400);
    }
  }

  const result = createAudioExtraction(user.id, {
    lecture_id: lectureId,
    video_url: body?.video_url?.trim(),
    video_asset_key: body?.video_asset_key?.trim(),
    source_file_name: body?.source_file_name?.trim(),
    source_content_type: body?.source_content_type?.trim(),
    source_size_bytes: body?.source_size_bytes,
    audio_url: body?.audio_url?.trim(),
  });

  if (!result) {
    return jsonFailure('AUDIO_EXTRACTION_FAILED', '오디오 추출을 생성할 수 없습니다.', 400);
  }

  return jsonSuccess(
    {
      extraction_id: result.extraction.id,
      lecture_id: result.extraction.lecture_id,
      audio_format: result.extraction.audio_format,
      audio_duration_ms: result.extraction.audio_duration_ms,
      sample_rate: result.extraction.sample_rate,
      channels: result.extraction.channels,
      status: result.extraction.status,
      transcript_id: result.extraction.transcript_id,
      audio_url: result.extraction.audio_url,
      video_url: result.extraction.source_url,
      video_asset_key: result.extraction.source_video_key,
      pipeline: result.pipeline,
    },
    '오디오 추출이 생성되었습니다.',
    201,
  );
});

media.get('/transcript/:lectureId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(listLectureTranscripts(lectureId)[0] ?? null);
});

media.get('/notes/:lectureId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(listLectureNotes(lectureId));
});

media.get('/audio-extractions/:lectureId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(listAudioExtractions(lectureId));
});

media.get('/pipeline/:lectureId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  const lectureId = c.req.param('lectureId');

  if (!ensureLectureExists(lectureId, user?.id ?? 'guest')) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(buildPipelineOverview(lectureId));
});

export default media;
