import type {
  AIIntentRequest,
  AIIntentResult,
  AIAnswerRequest,
  AIAnswerResult,
  AIQuizRequest,
  AIQuizResult,
  AISummaryRequest,
  AISummaryResult,
  AIProviderName,
} from '@myway/shared';
import { runOllamaChat } from './providers';
import type { RuntimeBindings } from './runtime-env';
import {
  OLLAMA_TIMEOUT_MS,
  getAnswerFallback,
  getIntentFallback,
  getQuizFallback,
  getSummaryFallback,
  getLectureSourceText,
  getOllamaModel,
  isRemoteFeatureEnabled,
  normalizeQuizQuestion,
  parseJsonObject,
  pickAction,
  pickConfidence,
  pickDifficulty,
  pickIntent,
  pickString,
  toStringArray,
  truncate,
} from './ai-engine-utils';
import { buildAnswerPrompt, buildIntentPrompt, buildQuizPrompt, buildSummaryPrompt } from './ai-engine-prompts';

async function runOllamaStructuredIntent(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIIntentResult> {
  const fallback = getIntentFallback(input);

  if (!isRemoteFeatureEnabled('intent', preferredProvider)) {
    return fallback;
  }

  const response = await runOllamaChat(buildIntentPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.1,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return fallback;
  }

  return {
    ...fallback,
    intent: pickIntent(parsed.intent, fallback.intent),
    confidence: pickConfidence(parsed.confidence, fallback.confidence),
    action: pickAction(parsed.action, fallback.action),
    entities: toStringArray(parsed.entities).slice(0, 6) || fallback.entities,
    reason: pickString(parsed.reason, fallback.reason),
    needs_clarification: typeof parsed.needs_clarification === 'boolean' ? parsed.needs_clarification : fallback.needs_clarification,
  };
}

async function runOllamaStructuredAnswer(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIAnswerResult> {
  const fallback = getAnswerFallback(input);

  if (!isRemoteFeatureEnabled('answer', preferredProvider)) {
    return fallback;
  }

  const response = await runOllamaChat(buildAnswerPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.2,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return fallback;
  }

  const answer = pickString(parsed.answer, fallback.answer);
  if (!answer) {
    return fallback;
  }

  return {
    ...fallback,
    answer,
    suggestions: toStringArray(parsed.suggestions).slice(0, 2).concat(fallback.suggestions).slice(0, 2),
  };
}

export async function runAIIntentWithEngine(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIIntentResult> {
  return runOllamaStructuredIntent(input, preferredProvider, env);
}

export async function runAIAnswerWithEngine(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIAnswerResult> {
  return runOllamaStructuredAnswer(input, preferredProvider, env);
}

export async function runAISummaryWithEngine(
  input: AISummaryRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AISummaryResult | null> {
  const fallback = getSummaryFallback(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);
  if (!source || !isRemoteFeatureEnabled('summary', preferredProvider) || input.style === 'timeline') {
    return fallback;
  }

  const messages = buildSummaryPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input.style, input.language);
  const response = await runOllamaChat(messages, env, {
    model: getOllamaModel(env),
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  if (!response) {
    return fallback;
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return fallback;
  }

  const title = pickString(parsed.title, fallback.title ?? `${source.lectureTitle} · 요약`);
  const content = pickString(parsed.content, fallback.content ?? '');
  const keyPoints = toStringArray(parsed.key_points);

  if (!content) {
    return fallback;
  }

  return {
    lecture_id: input.lecture_id,
    title,
    style: input.style ?? 'brief',
    language: input.language ?? 'ko',
    content,
    key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : fallback.key_points,
    references: fallback.references,
  };
}

export async function runAIQuizWithEngine(
  input: AIQuizRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIQuizResult | null> {
  const fallback = getQuizFallback(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);
  if (!source || !isRemoteFeatureEnabled('quiz', preferredProvider)) {
    return fallback;
  }

  const messages = buildQuizPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input);
  const response = await runOllamaChat(messages, env, {
    model: getOllamaModel(env),
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  if (!response) {
    return fallback;
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return fallback;
  }

  const fallbackQuestions = fallback.questions ?? [];
  const engineQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (fallbackQuestions.length === 0 || engineQuestions.length === 0) {
    return fallback;
  }

  const questions = fallbackQuestions.map((fallbackQuestion, index) =>
    normalizeQuizQuestion(engineQuestions[index] as Record<string, unknown> | undefined, fallbackQuestion),
  );

  return {
    lecture_id: input.lecture_id,
    title: pickString(parsed.title, fallback.title),
    difficulty: pickDifficulty(parsed.difficulty, fallback.difficulty),
    questions,
  };
}
