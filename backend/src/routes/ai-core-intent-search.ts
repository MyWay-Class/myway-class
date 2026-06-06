import { Hono } from 'hono';
import { appendAIIntentLog, type AIIntentRequest, type AISearchRequest } from '@myway/shared';
import { runAIIntent, runAISearch } from '../lib/ai-adapter';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { createMediaRepository } from '../lib/media-repository';
import type { RuntimeBindings } from '../lib/runtime-env';
import { buildResponseMetadata, ensureLectureExists, getLectureSnapshot, recordUsageLog } from './ai-route-helpers';

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

export function registerAiIntentSearchRoutes(ai: Hono): void {
  ai.post('/intent', async (c) => {
    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'intent');
    if (access instanceof Response) {
      return access;
    }

    const { user } = access;
    const body = await readJsonBody<AIIntentRequest>(c.req.raw);
    const message = body?.message?.trim();

    if (!message) {
      return jsonFailure('MESSAGE_REQUIRED', 'message가 필요합니다.');
    }

    const env = c.env as RuntimeBindings | undefined;
    const metadata = buildResponseMetadata('intent', env);
    const result = await runAIIntent(
      {
        message,
        lecture_id: body?.lecture_id?.trim(),
        context: body?.context,
      },
      undefined,
      env,
      getMediaRepository(env),
    );

    if (user) {
      const lectureSnapshot = getLectureSnapshot(result.lecture_id ?? body?.lecture_id?.trim());
      recordUsageLog({
        user_id: user.id,
        feature: 'intent',
        provider: metadata.provider,
        model: metadata.model,
        input_text: message,
        output_text: result.reason,
        success: true,
      });
      appendAIIntentLog({
        user_id: user.id,
        message,
        detected_intent: result.intent,
        confidence: result.confidence,
        feature: 'intent',
        success: true,
        action_taken: result.action,
        lecture_id: lectureSnapshot.lecture_id,
        course_id: lectureSnapshot.course_id,
      });
    }

    return jsonSuccess({ ...result, provider: metadata.provider, model: metadata.model }, '인텐트가 분류되었습니다.');
  });

  ai.post('/search', async (c) => {
    const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'search');
    if (access instanceof Response) {
      return access;
    }

    const { user } = access;
    const body = await readJsonBody<AISearchRequest>(c.req.raw);
    const query = body?.query?.trim();

    if (!query) {
      return jsonFailure('QUERY_REQUIRED', 'query가 필요합니다.');
    }

    const lectureId = body?.lecture_id?.trim();
    if (lectureId && !ensureLectureExists(lectureId)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const env = c.env as RuntimeBindings | undefined;
    const metadata = buildResponseMetadata('search', env);
    const result = await runAISearch({
      query,
      lecture_id: lectureId,
      limit: body?.limit,
    }, undefined, getMediaRepository(env));

    if (user) {
      recordUsageLog({
        user_id: user.id,
        feature: 'search',
        provider: metadata.provider,
        model: metadata.model,
        input_text: query,
        output_text: JSON.stringify(result.hits),
        success: true,
      });
    }

    return jsonSuccess({ ...result, provider: metadata.provider, model: metadata.model }, '검색 결과를 조회했습니다.');
  });
}
