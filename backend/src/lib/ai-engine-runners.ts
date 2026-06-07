import type {
  AIIntentRequest,
  AIIntentResult,
  AIAnswerRequest,
  AIAnswerResult,
  AIProviderName,
  MediaRepository,
} from '@myway/shared';
import { getAIProviderSelectionForRuntime } from './ai-provider';
import type { RuntimeBindings } from './runtime-env';
import { runProviderFallbackChain } from './ai-engine-runner-helpers';
import {
  getGeminiModel,
  OLLAMA_TIMEOUT_MS,
  getAnswerFallback,
  getIntentFallback,
  getOllamaModel,
  parseJsonObject,
  pickAction,
  pickConfidence,
  pickIntent,
  pickString,
  toStringArray,
} from './ai-engine-utils';
import { buildAnswerPrompt, buildIntentPrompt } from './ai-engine-prompts';
export { runAIQuizWithEngine, runAISummaryWithEngine } from './ai-engine-summary-quiz-runners';

export type AIEngineExecution<T> = {
  result: T;
  provider: AIProviderName | 'demo';
  model: string;
};

const DEMO_INTENT_MODEL = 'demo-intent-v1';
const DEMO_ANSWER_MODEL = 'demo-answer-v1';

async function runOllamaStructuredIntent(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIIntentResult>> {
  const fallback = getIntentFallback(input);

  const providerPlan = getAIProviderSelectionForRuntime('intent', env, preferredProvider);
  if (providerPlan.current_provider === 'demo') {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_INTENT_MODEL,
    };
  }

  const messages = buildIntentPrompt(input, fallback);
  const { response, provider: responseProvider } = await runProviderFallbackChain(
    providerPlan.fallback_chain,
    messages,
    OLLAMA_TIMEOUT_MS,
    env,
    0.1,
  );

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
    provider: responseProvider ?? 'demo',
    model: responseProvider === 'gemini' ? getGeminiModel(env) : getOllamaModel(env),
  };
}

async function runOllamaStructuredAnswer(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIAnswerResult>> {
  const fallback = await getAnswerFallback(input, repository);

  const providerPlan = getAIProviderSelectionForRuntime('answer', env, preferredProvider);
  if (providerPlan.current_provider === 'demo') {
    return {
      result: fallback,
      provider: 'demo',
      model: DEMO_ANSWER_MODEL,
    };
  }

  const messages = buildAnswerPrompt(input, fallback);
  const { response, provider: responseProvider } = await runProviderFallbackChain(
    providerPlan.fallback_chain,
    messages,
    OLLAMA_TIMEOUT_MS,
    env,
    0.2,
  );

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
    provider: responseProvider ?? 'demo',
    model: responseProvider === 'gemini' ? getGeminiModel(env) : getOllamaModel(env),
  };
}

export async function runAIIntentWithExecution(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIIntentResult>> {
  return runOllamaStructuredIntent(input, preferredProvider, env, repository);
}

export async function runAIIntentWithEngine(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIIntentResult> {
  return (await runAIIntentWithExecution(input, preferredProvider, env, repository)).result;
}

export async function runAIAnswerWithExecution(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIAnswerResult>> {
  return runOllamaStructuredAnswer(input, preferredProvider, env, repository);
}

export async function runAIAnswerWithEngine(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIAnswerResult> {
  return (await runAIAnswerWithExecution(input, preferredProvider, env, repository)).result;
}
