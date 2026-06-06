import { Hono } from 'hono';
import {
  type AudioExtractionCallbackRequest,
  type AudioExtractionRequest,
  type MediaSummaryRequest,
  type STTProviderCatalog,
  type TranscriptCreateRequest,
} from '@myway/shared';
import { hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { getSTTProviderOverview } from '../lib/stt-provider';
import { guardAiRequest } from '../lib/ai-controls';
import type { RuntimeBindings } from '../lib/runtime-env';
import {
  extractAudioAction,
  extractionCallbackAction,
  summarizeLectureAction,
  transcribeLectureAction,
  uploadLectureVideoAction,
} from './media-route-actions';
import { ensureLectureExists, getMediaRepository, requireUser } from './media-route-guards';
import { loadMediaProcessorHealth, verifyMediaCallbackSecret } from '../lib/media-processor';

export function registerMediaAdminRoutes(media: Hono): void {
  media.post('/upload-video', async (c) => {
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;
    const { user } = auth;

    if (!hasRole(user, ['INSTRUCTOR', 'ADMIN'])) {
      return jsonFailure('FORBIDDEN', '영상 업로드는 강사와 운영자만 사용할 수 있습니다.', 403);
    }

    const formData = await c.req.formData();
    const lectureId = String(formData.get('lecture_id') ?? '').trim();
    const file = formData.get('video_file');
    const videoFile = typeof file === 'string' ? null : file;

    if (!lectureId) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    if (!ensureLectureExists(lectureId, user.id)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    if (!videoFile) {
      return jsonFailure('VIDEO_FILE_REQUIRED', 'video_file이 필요합니다.');
    }

    const upload = await uploadLectureVideoAction(lectureId, videoFile, c.req.url, c.env as RuntimeBindings | undefined);

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
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;
    const { user } = auth;

    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'stt');
    if (access instanceof Response) {
      return access;
    }

    const body = await readJsonBody<TranscriptCreateRequest>(c.req.raw);
    const lectureId = body?.lecture_id?.trim();

    if (!lectureId) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    if (!ensureLectureExists(lectureId, user.id)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const transcription = await transcribeLectureAction(
      user,
      body,
      c.env as RuntimeBindings | undefined,
      getMediaRepository(c.env as RuntimeBindings | undefined),
    );
    if ('error' in transcription) {
      if (transcription.error === 'STT_INPUT_TOO_LONG') return jsonFailure('STT_INPUT_TOO_LONG', '오디오 길이는 3분 이하만 허용됩니다.', 413);
      return jsonFailure('TRANSCRIPT_FAILED', '트랜스크립트를 생성할 수 없습니다.', 400);
    }
    const { result } = transcription;

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
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;

    const health = await loadMediaProcessorHealth(c.env as RuntimeBindings | undefined);
    if (!health) {
      return jsonFailure('MEDIA_PROCESSOR_UNAVAILABLE', '미디어 처리 서비스 상태를 가져올 수 없습니다.', 503);
    }

    return jsonSuccess(health, '미디어 처리 서비스 상태를 조회했습니다.');
  });

  media.post('/summarize', async (c) => {
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;
    const { user } = auth;

    const body = await readJsonBody<MediaSummaryRequest>(c.req.raw);
    const lectureId = body?.lecture_id?.trim();

    if (!lectureId) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    if (!ensureLectureExists(lectureId, user.id)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const summary = await summarizeLectureAction(user, body, getMediaRepository(c.env as RuntimeBindings | undefined));
    if ('error' in summary) {
      return jsonFailure('SUMMARY_FAILED', '요약을 생성할 수 없습니다.', 400);
    }
    const { result } = summary;

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
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;
    const { user } = auth;

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

    const extraction = await extractAudioAction(user, body, c.req.url, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));
    if ('error' in extraction) {
      if (extraction.error === 'INVALID_BODY') return jsonFailure('INVALID_BODY', '요청 본문이 올바르지 않습니다.');
      if (extraction.error === 'LECTURE_ID_REQUIRED') return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
      const status = extraction.error === 'processor_not_configured' ? 503 : extraction.error === 'dispatch_failed' ? 502 : 400;
      return jsonFailure(extraction.error.toUpperCase(), extraction.message ?? '오디오 추출 요청을 처리할 수 없습니다.', status);
    }

    return jsonSuccess(
      extraction.payload,
      extraction.message,
      201,
    );
  });

  media.post('/extract-audio/callback', async (c) => {
    if (!verifyMediaCallbackSecret(c.req.raw, c.env as RuntimeBindings | undefined)) {
      return jsonFailure('FORBIDDEN', '유효한 callback secret이 필요합니다.', 403);
    }

    const body = await readJsonBody<AudioExtractionCallbackRequest>(c.req.raw);
    const callback = await extractionCallbackAction(body, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));
    if ('error' in callback) {
      if (callback.error === 'CALLBACK_INVALID') {
        return jsonFailure('CALLBACK_INVALID', 'callback payload가 올바르지 않습니다.', 400);
      }
      const status = callback.error === 'extraction_not_found' ? 404 : callback.error === 'transcript_failed' ? 502 : 400;
      return jsonFailure(callback.error.toUpperCase(), callback.message ?? 'callback 처리에 실패했습니다.', status);
    }

    if (!callback.payload) {
      return jsonFailure('CALLBACK_INVALID', 'callback payload가 올바르지 않습니다.', 400);
    }

    return jsonSuccess(
      callback.payload,
      '오디오 추출 callback이 반영되었습니다.',
    );
  });
}
