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
import { getAIProviderSelection } from './ai-provider';
import { runGeminiJsonPrompt, runOllamaChat } from './providers';
import type { RuntimeBindings } from './runtime-env';
import {
  getGeminiModel,
  OLLAMA_TIMEOUT_MS,
  getAnswerFallback,
  getIntentFallback,
  getQuizFallback,
  getSummaryFallback,
  getLectureSourceText,
  getOllamaModel,
  isRemoteFeatureEnabled,
  OLLAMA_QUIZ_TIMEOUT_MS,
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

export type AIEngineExecution<T> = {
  result: T;
  provider: AIProviderName | 'demo';
  model: string;
};

const DEMO_INTENT_MODEL = 'demo-intent-v1';
const DEMO_ANSWER_MODEL = 'demo-answer-v1';

async function runStructuredJsonFallback(
  feature: 'summary' | 'quiz',
  messages: ReturnType<typeof buildSummaryPrompt> | ReturnType<typeof buildQuizPrompt>,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<string | null> {
  const providerPlan = getAIProviderSelection(feature, preferredProvider);

  for (const provider of providerPlan.fallback_chain) {
    if (provider === 'ollama') {
      const response = await runOllamaChat(messages, env, {
        model: getOllamaModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      if (response) {
        return response;
      }
    }

    if (provider === 'gemini') {
      const response = await runGeminiJsonPrompt(messages, env, {
        model: getGeminiModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      if (response) {
        return response;
      }
    }
  }

  return null;
}

async function runOllamaStructuredIntent(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIEngineExecution<AIIntentResult>> {
  const fallback = getIntentFallback(input);

  if (!isRemoteFeatureEnabled('intent', preferredProvider)) {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_INTENT_MODEL,
    };
  }

  const response = await runOllamaChat(buildIntentPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.1,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_INTENT_MODEL,
    };
  }

  return {
    result: {
      ...fallback,
      intent: pickIntent(parsed.intent, fallback.intent),
      confidence: pickConfidence(parsed.confidence, fallback.confidence),
      action: pickAction(parsed.action, fallback.action),
      entities: toStringArray(parsed.entities).slice(0, 6) || fallback.entities,
      reason: pickString(parsed.reason, fallback.reason),
      needs_clarification: typeof parsed.needs_clarification === 'boolean' ? parsed.needs_clarification : fallback.needs_clarification,
    },
    provider: 'ollama',
    model: getOllamaModel(env),
  };
}

async function runOllamaStructuredAnswer(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIEngineExecution<AIAnswerResult>> {
  const fallback = getAnswerFallback(input);

  if (!isRemoteFeatureEnabled('answer', preferredProvider)) {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_ANSWER_MODEL,
    };
  }

  const response = await runOllamaChat(buildAnswerPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.2,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_ANSWER_MODEL,
    };
  }

  const answer = pickString(parsed.answer, fallback.answer);
  if (!answer) {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_ANSWER_MODEL,
    };
  }

  return {
    result: {
      ...fallback,
      answer,
      suggestions: toStringArray(parsed.suggestions).slice(0, 2).concat(fallback.suggestions).slice(0, 2),
    },
    provider: 'ollama',
    model: getOllamaModel(env),
  };
}

export async function runAIIntentWithExecution(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIEngineExecution<AIIntentResult>> {
  return runOllamaStructuredIntent(input, preferredProvider, env);
}

export async function runAIIntentWithEngine(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIIntentResult> {
  return (await runAIIntentWithExecution(input, preferredProvider, env)).result;
}

export async function runAIAnswerWithExecution(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIEngineExecution<AIAnswerResult>> {
  return runOllamaStructuredAnswer(input, preferredProvider, env);
}

export async function runAIAnswerWithEngine(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIAnswerResult> {
  return (await runAIAnswerWithExecution(input, preferredProvider, env)).result;
}

export async function runAISummaryWithEngine(
  input: AISummaryRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIEngineExecution<AISummaryResult> | null> {
  const fallback = getSummaryFallback(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);
  if (!source || !isRemoteFeatureEnabled('summary', preferredProvider) || input.style === 'timeline') {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-summary-v1',
    };
  }

  const messages = buildSummaryPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input.style, input.language);
  const providerPlan = getAIProviderSelection('summary', preferredProvider);
  let response: string | null = null;
  let responseProvider: AIProviderName | null = null;

  for (const provider of providerPlan.fallback_chain) {
    if (provider === 'ollama') {
      response = await runOllamaChat(messages, env, {
        model: getOllamaModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      responseProvider = response ? 'ollama' : null;
    }

    if (!response && provider === 'gemini') {
      response = await runGeminiJsonPrompt(messages, env, {
        model: getGeminiModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      responseProvider = response ? 'gemini' : responseProvider;
    }

    if (response) {
      break;
    }
  }

  if (!response) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-summary-v1',
    };
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-summary-v1',
    };
  }

  const title = pickString(parsed.title, fallback.title ?? `${source.lectureTitle} · 요약`);
  const content = pickString(parsed.content, fallback.content ?? '');
  const keyPoints = toStringArray(parsed.key_points);

  if (!content) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-summary-v1',
    };
  }

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
): Promise<AIEngineExecution<AIQuizResult> | null> {
  const fallback = getQuizFallback(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);
  if (!source || !isRemoteFeatureEnabled('quiz', preferredProvider)) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-quiz-v1',
    };
  }

  const messages = buildQuizPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input);
  const providerPlan = getAIProviderSelection('quiz', preferredProvider);
  let response: string | null = null;
  let responseProvider: AIProviderName | null = null;

  for (const provider of providerPlan.fallback_chain) {
    if (provider === 'ollama') {
      response = await runOllamaChat(messages, env, {
        model: getOllamaModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      responseProvider = response ? 'ollama' : null;
    }

    if (!response && provider === 'gemini') {
      response = await runGeminiJsonPrompt(messages, env, {
        model: getGeminiModel(env),
        timeoutMs: OLLAMA_QUIZ_TIMEOUT_MS,
      });
      responseProvider = response ? 'gemini' : responseProvider;
    }

    if (response) {
      break;
    }
  }

  if (!response) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-quiz-v1',
    };
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-quiz-v1',
    };
  }

  const fallbackQuestions = fallback.questions ?? [];
  const engineQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (fallbackQuestions.length === 0 || engineQuestions.length === 0) {
    return {
      result: fallback,
      provider: 'demo',
      model: 'demo-quiz-v1',
    };
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
