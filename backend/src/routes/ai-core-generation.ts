import { Hono } from 'hono';
import { type AIQuizRequest, type AISummaryRequest } from '@myway/shared';
import { runAIQuiz, runAISummary } from '../lib/ai-adapter';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { createMediaRepository } from '../lib/media-repository';
import type { RuntimeBindings } from '../lib/runtime-env';
import { buildResponseMetadata, ensureLectureExists, recordUsageLog } from './ai-route-helpers';

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

export function registerAiGenerationRoutes(ai: Hono): void {
  ai.post('/summary', async (c) => {
    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'summary');
    if (access instanceof Response) {
      return access;
    }

    const { user } = access;
    const body = await readJsonBody<AISummaryRequest>(c.req.raw);
    const lectureId = body?.lecture_id?.trim();

    if (!lectureId) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    if (!ensureLectureExists(lectureId)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const env = c.env as RuntimeBindings | undefined;
    const execution = await runAISummary(
      {
        lecture_id: lectureId,
        style: body?.style ?? 'brief',
        language: body?.language ?? 'ko',
      },
      undefined,
      env,
      getMediaRepository(env),
    );

    if (!execution) {
      return jsonFailure('SUMMARY_FAILED', '요약을 생성할 수 없습니다.', 400);
    }

    const metadata = { provider: execution.provider, model: execution.model };
    const result = execution.result;

    if (user) {
      recordUsageLog({
        user_id: user.id,
        feature: 'summary',
        provider: metadata.provider,
        model: metadata.model,
        input_text: lectureId,
        output_text: result.content,
        success: true,
      });
    }

    return jsonSuccess({ ...result, provider: metadata.provider, model: metadata.model }, '요약이 생성되었습니다.');
  });

  ai.post('/quiz', async (c) => {
    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'quiz');
    if (access instanceof Response) {
      return access;
    }

    const { user } = access;
    const body = await readJsonBody<AIQuizRequest>(c.req.raw);
    const lectureId = body?.lecture_id?.trim();

    if (!lectureId) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    if (!ensureLectureExists(lectureId)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const env = c.env as RuntimeBindings | undefined;
    const execution = await runAIQuiz(
      {
        lecture_id: lectureId,
        count: body?.count,
        difficulty: body?.difficulty,
      },
      undefined,
      env,
      getMediaRepository(env),
    );

    if (!execution) {
      return jsonFailure('QUIZ_FAILED', '퀴즈를 생성할 수 없습니다.', 400);
    }

    const metadata = { provider: execution.provider, model: execution.model };
    const result = execution.result;

    if (user) {
      recordUsageLog({
        user_id: user.id,
        feature: 'quiz',
        provider: metadata.provider,
        model: metadata.model,
        input_text: lectureId,
        output_text: JSON.stringify(result.questions),
        success: true,
      });
    }

    return jsonSuccess({ ...result, provider: metadata.provider, model: metadata.model }, '퀴즈가 생성되었습니다.');
  });
}
