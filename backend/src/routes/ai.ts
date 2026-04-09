import { Hono } from 'hono';
import {
  getLectureDetail,
  type AIAnswerRequest,
  type AIIntentRequest,
  type AIQuizRequest,
  type AISearchRequest,
  type AISummaryRequest,
} from '@myway/shared';
import { runAIAnswer, runAIIntent, runAIQuiz, runAISearch, runAISummary } from '../lib/ai-adapter';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import type { RuntimeBindings } from '../lib/runtime-env';

const ai = new Hono();

function ensureLectureExists(lectureId: string): boolean {
  return Boolean(getLectureDetail(lectureId));
}

ai.post('/intent', async (c) => {
  const body = await readJsonBody<AIIntentRequest>(c.req.raw);
  const message = body?.message?.trim();

  if (!message) {
    return jsonFailure('MESSAGE_REQUIRED', 'message가 필요합니다.');
  }

  const result = runAIIntent({
    message,
    lecture_id: body?.lecture_id?.trim(),
    context: body?.context,
  });

  return jsonSuccess(result, '인텐트가 분류되었습니다.');
});

ai.post('/search', async (c) => {
  const body = await readJsonBody<AISearchRequest>(c.req.raw);
  const query = body?.query?.trim();

  if (!query) {
    return jsonFailure('QUERY_REQUIRED', 'query가 필요합니다.');
  }

  const lectureId = body?.lecture_id?.trim();
  if (lectureId && !ensureLectureExists(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(
    runAISearch({
      query,
      lecture_id: lectureId,
      limit: body?.limit,
    }),
    '검색 결과를 조회했습니다.',
  );
});

ai.post('/answer', async (c) => {
  const body = await readJsonBody<AIAnswerRequest>(c.req.raw);
  const question = body?.question?.trim();

  if (!question) {
    return jsonFailure('QUESTION_REQUIRED', 'question가 필요합니다.');
  }

  const lectureId = body?.lecture_id?.trim();
  if (lectureId && !ensureLectureExists(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(
    runAIAnswer({
      question,
      lecture_id: lectureId,
      intent_hint: body?.intent_hint,
      limit: body?.limit,
    }),
    '답변을 생성했습니다.',
  );
});

ai.post('/summary', async (c) => {
  const body = await readJsonBody<AISummaryRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const env = c.env as RuntimeBindings | undefined;
  const result = await runAISummary({
    lecture_id: lectureId,
    style: body?.style ?? 'brief',
    language: body?.language ?? 'ko',
  }, undefined, env);

  if (!result) {
    return jsonFailure('SUMMARY_FAILED', '요약을 생성할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '요약이 생성되었습니다.');
});

ai.post('/quiz', async (c) => {
  const body = await readJsonBody<AIQuizRequest>(c.req.raw);
  const lectureId = body?.lecture_id?.trim();

  if (!lectureId) {
    return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
  }

  if (!ensureLectureExists(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const env = c.env as RuntimeBindings | undefined;
  const result = await runAIQuiz({
    lecture_id: lectureId,
    count: body?.count,
    difficulty: body?.difficulty,
  }, undefined, env);

  if (!result) {
    return jsonFailure('QUIZ_FAILED', '퀴즈를 생성할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '퀴즈가 생성되었습니다.');
});

export default ai;
