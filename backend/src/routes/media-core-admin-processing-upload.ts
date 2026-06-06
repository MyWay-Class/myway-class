import { Hono } from 'hono';
import { type TranscriptCreateRequest } from '@myway/shared';
import { hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { guardAiRequest } from '../lib/ai-controls';
import type { RuntimeBindings } from '../lib/runtime-env';
import { transcribeLectureAction, uploadLectureVideoAction } from './media-route-actions';
import { ensureLectureExists, getMediaRepository, requireUser } from './media-route-guards';

export function registerMediaAdminProcessingUploadRoutes(media: Hono): void {
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
}
