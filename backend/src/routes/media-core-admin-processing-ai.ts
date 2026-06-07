import { Hono } from 'hono';
import { type AudioExtractionRequest, type MediaSummaryRequest } from '@myway/shared';
import { hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import type { RuntimeBindings } from '../lib/runtime-env';
import { extractAudioAction, summarizeLectureAction } from './media-route-actions';
import { ensureLectureExists, getMediaRepository, requireUser } from './media-route-guards';

export function registerMediaAdminProcessingAIMRoutes(media: Hono): void {
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
}
