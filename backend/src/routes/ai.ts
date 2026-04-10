import { Hono } from 'hono';
import {
  appendAIIntentLog,
  appendAIQuestionLog,
  appendAIUsageLog,
  getLectureDetail,
  type AIAnswerRequest,
  type AIIntentRequest,
  type AIQuizRequest,
  type AISearchRequest,
  type AISummaryRequest,
} from '@myway/shared';
import { runAIAnswer, runAIIntent, runAIQuiz, runAISearch, runAISummary } from '../lib/ai-adapter';
import { getAIProviderSelectionForRuntime } from '../lib/ai-provider';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { getGeminiRuntimeSettings, type RuntimeBindings } from '../lib/runtime-env';

const ai = new Hono();

type AISnapshot = {
  lecture_id: string | null;
  course_id: string | null;
};

function ensureLectureExists(lectureId: string): boolean {
  return Boolean(getLectureDetail(lectureId));
}

function getLectureSnapshot(lectureId?: string): AISnapshot {
  if (!lectureId) {
    return { lecture_id: null, course_id: null };
  }

  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return { lecture_id: lectureId, course_id: null };
  }

  return {
    lecture_id: lecture.id,
    course_id: lecture.course_id,
  };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateLatencyMs(inputText: string, outputText: string): number {
  return Math.max(1, Math.round((inputText.length + outputText.length) * 2));
}

function getOllamaModel(env?: RuntimeBindings): string {
  return env?.MYWAY_OLLAMA_MODEL ?? env?.OLLAMA_MODEL ?? 'llama3.1';
}

function buildResponseMetadata(feature: 'intent' | 'search' | 'answer' | 'summary' | 'quiz', env?: RuntimeBindings) {
  if (feature === 'search') {
    return { provider: 'demo', model: 'demo-search-v1' };
  }

  const provider = getAIProviderSelectionForRuntime(feature, env).current_provider;
  const model =
    provider === 'gemini'
      ? getGeminiRuntimeSettings(env).model ?? 'gemini-2.0-flash'
      : provider === 'ollama'
        ? getOllamaModel(env)
        : `demo-${feature}-v1`;

  return { provider, model };
}

function recordUsageLog(input: {
  user_id: string | null;
  feature: string;
  provider: string;
  model: string;
  input_text: string;
  output_text: string;
  success: boolean;
  error_message?: string | null;
}) {
  appendAIUsageLog({
    user_id: input.user_id,
    feature: input.feature,
    provider: input.provider,
    model: input.model,
    input_tokens: estimateTokens(input.input_text),
    output_tokens: estimateTokens(input.output_text),
    latency_ms: estimateLatencyMs(input.input_text, input.output_text),
    success: input.success ? 1 : 0,
    error_message: input.error_message ?? (input.success ? null : 'request_failed'),
  });
}

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
  const result = runAISearch({
    query,
    lecture_id: lectureId,
    limit: body?.limit,
  });

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

export default ai;
