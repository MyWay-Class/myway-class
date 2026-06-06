import { Hono } from 'hono';
import { appendAIQuestionLog, type AIAnswerRequest } from '@myway/shared';
import { runAIAnswer } from '../lib/ai-adapter';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { createMediaRepository } from '../lib/media-repository';
import type { RuntimeBindings } from '../lib/runtime-env';
import { buildResponseMetadata, ensureLectureExists, getLectureSnapshot, recordUsageLog } from './ai-route-helpers';

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

export function registerAiAnswerRoutes(ai: Hono): void {
  ai.post('/answer', async (c) => {
    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'answer');
    if (access instanceof Response) {
      return access;
    }

    const { user } = access;
    const body = await readJsonBody<AIAnswerRequest>(c.req.raw);
    const question = body?.question?.trim();

    if (!question) {
      return jsonFailure('QUESTION_REQUIRED', 'question가 필요합니다.');
    }

    const lectureId = body?.lecture_id?.trim();
    if (lectureId && !ensureLectureExists(lectureId)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const env = c.env as RuntimeBindings | undefined;
    const metadata = buildResponseMetadata('answer', env);
    const result = await runAIAnswer(
      {
        question,
        lecture_id: lectureId,
        intent_hint: body?.intent_hint,
        limit: body?.limit,
      },
      undefined,
      env,
      getMediaRepository(env),
    );

    if (user) {
      const lectureSnapshot = getLectureSnapshot(result.lecture_id ?? lectureId);
      recordUsageLog({
        user_id: user.id,
        feature: 'answer',
        provider: metadata.provider,
        model: metadata.model,
        input_text: question,
        output_text: result.answer,
        success: true,
      });
      appendAIQuestionLog({
        user_id: user.id,
        lecture_id: lectureSnapshot.lecture_id ?? lectureId ?? 'lec_unknown',
        course_id: lectureSnapshot.course_id ?? 'crs_unknown',
        question,
        answer: result.answer,
        model: metadata.model,
        success: true,
      });
    }

    return jsonSuccess({ ...result, provider: metadata.provider, model: metadata.model }, '답변을 생성했습니다.');
  });
}
