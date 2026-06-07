import type { AIProviderName, AIQuizRequest, AIQuizResult, AISummaryRequest, AISummaryResult, MediaRepository } from '@myway/shared';
import { getAIProviderSelectionForRuntime } from './ai-provider';
import { runProviderFallbackChain } from './ai-engine-runner-helpers';
import {
  getGeminiModel,
  getLectureSourceText,
  getOllamaModel,
  getQuizFallback,
  getSummaryFallback,
  isRemoteFeatureEnabled,
  normalizeQuizQuestion,
  OLLAMA_QUIZ_TIMEOUT_MS,
  parseJsonObject,
  pickDifficulty,
  pickString,
  toStringArray,
  truncate,
} from './ai-engine-utils';
import { buildQuizPrompt, buildSummaryPrompt } from './ai-engine-prompts';
import type { RuntimeBindings } from './runtime-env';
import type { AIEngineExecution } from './ai-engine-runners';

export async function runAISummaryWithEngine(
  input: AISummaryRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AISummaryResult> | null> {
  const fallback = await getSummaryFallback(input, repository);
  if (!fallback) return null;

  const source = await getLectureSourceText(input.lecture_id, repository);
  if (!source || !isRemoteFeatureEnabled('summary', env, preferredProvider) || input.style === 'timeline') {
    return { result: fallback, provider: 'demo', model: 'demo-summary-v1' };
  }

  const messages = buildSummaryPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input.style, input.language);
  const providerPlan = getAIProviderSelectionForRuntime('summary', env, preferredProvider);
  const { response, provider: responseProvider } = await runProviderFallbackChain(providerPlan.fallback_chain, messages, OLLAMA_QUIZ_TIMEOUT_MS, env);
  if (!response) return { result: fallback, provider: 'demo', model: 'demo-summary-v1' };

  const parsed = parseJsonObject(response);
  if (!parsed) return { result: fallback, provider: 'demo', model: 'demo-summary-v1' };

  const title = pickString(parsed.title, fallback.title ?? `${source.lectureTitle} · 요약`);
  const content = pickString(parsed.content, fallback.content ?? '');
  const keyPoints = toStringArray(parsed.key_points);
  if (!content) return { result: fallback, provider: 'demo', model: 'demo-summary-v1' };

  return {
    result: {
      lecture_id: input.lecture_id,
      title,
      style: input.style ?? 'brief',
      language: input.language ?? 'ko',
      content,
      key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : fallback.key_points,
      references: fallback.references,
    },
    provider: responseProvider ?? 'demo',
    model: responseProvider === 'gemini' ? getGeminiModel(env) : getOllamaModel(env),
  };
}

export async function runAIQuizWithEngine(
  input: AIQuizRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIQuizResult> | null> {
  const fallback = await getQuizFallback(input, repository);
  if (!fallback) return null;

  const source = await getLectureSourceText(input.lecture_id, repository);
  if (!source || !isRemoteFeatureEnabled('quiz', env, preferredProvider)) {
    return { result: fallback, provider: 'demo', model: 'demo-quiz-v1' };
  }

  const messages = buildQuizPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input);
  const providerPlan = getAIProviderSelectionForRuntime('quiz', env, preferredProvider);
  const { response, provider: responseProvider } = await runProviderFallbackChain(providerPlan.fallback_chain, messages, OLLAMA_QUIZ_TIMEOUT_MS, env);
  if (!response) return { result: fallback, provider: 'demo', model: 'demo-quiz-v1' };

  const parsed = parseJsonObject(response);
  if (!parsed) return { result: fallback, provider: 'demo', model: 'demo-quiz-v1' };

  const fallbackQuestions = fallback.questions ?? [];
  const engineQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (fallbackQuestions.length === 0 || engineQuestions.length === 0) {
    return { result: fallback, provider: 'demo', model: 'demo-quiz-v1' };
  }

  const questions = fallbackQuestions.map((fallbackQuestion, index) =>
    normalizeQuizQuestion(engineQuestions[index] as Record<string, unknown> | undefined, fallbackQuestion),
  );

  return {
    result: {
      lecture_id: input.lecture_id,
      title: pickString(parsed.title, fallback.title),
      difficulty: pickDifficulty(parsed.difficulty, fallback.difficulty),
      questions,
    },
    provider: responseProvider ?? 'demo',
    model: responseProvider === 'gemini' ? getGeminiModel(env) : getOllamaModel(env),
  };
}
