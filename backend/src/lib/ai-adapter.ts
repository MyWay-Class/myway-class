import {
  searchAIContent,
  type AIAnswerRequest,
  type AIAnswerResult,
  type AIIntentRequest,
  type AIIntentResult,
  type AIProviderCapability,
  type AIProviderName,
  type AIQuizRequest,
  type AIQuizResult,
  type AISearchRequest,
  type AISearchResult,
  type AISummaryRequest,
  type AISummaryResult,
} from '@myway/shared';
import { type AIEngineExecution, runAIAnswerWithEngine, runAIIntentWithEngine, runAIQuizWithEngine, runAISummaryWithEngine } from './ai-engine';
import { getAIProviderSelectionForRuntime } from './ai-provider';
import type { RuntimeBindings } from './runtime-env';
import type { MediaRepository } from '@myway/shared';

export type AIAdapterResultMap = {
  intent: AIIntentResult;
  search: AISearchResult;
  answer: AIAnswerResult;
  summary: AISummaryResult | null;
  quiz: AIQuizResult | null;
};

type AIAdapterFeature = keyof AIAdapterResultMap;

type AIAdapterInputMap = {
  intent: AIIntentRequest;
  search: AISearchRequest;
  answer: AIAnswerRequest;
  summary: AISummaryRequest;
  quiz: AIQuizRequest;
};

function resolveProvider(feature: AIProviderCapability, preferredProvider?: AIProviderName): AIProviderName {
  return getAIProviderSelectionForRuntime(feature, undefined, preferredProvider).current_provider;
}

export async function runAIIntent(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIIntentResult> {
  resolveProvider('intent', preferredProvider);
  return runAIIntentWithEngine(input, preferredProvider, env, repository);
}

export async function runAISearch(
  input: AISearchRequest,
  preferredProvider?: AIProviderName,
  repository?: MediaRepository,
): Promise<AISearchResult> {
  void resolveProvider('search', preferredProvider);
  return await searchAIContent(input, repository);
}

export async function runAIAnswer(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIAnswerResult> {
  resolveProvider('answer', preferredProvider);
  return runAIAnswerWithEngine(input, preferredProvider, env, repository);
}

export async function runAISummary(
  input: AISummaryRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AISummaryResult> | null> {
  resolveProvider('summary', preferredProvider);
  return runAISummaryWithEngine(input, preferredProvider, env, repository);
}

export async function runAIQuiz(
  input: AIQuizRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIEngineExecution<AIQuizResult> | null> {
  resolveProvider('quiz', preferredProvider);
  return runAIQuizWithEngine(input, preferredProvider, env, repository);
}

export async function runAIFeature<TFeature extends AIAdapterFeature>(
  feature: TFeature,
  input: AIAdapterInputMap[TFeature],
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<AIAdapterResultMap[TFeature]> {
  switch (feature) {
    case 'intent':
      return (await runAIIntent(input as AIIntentRequest, preferredProvider, env, repository)) as AIAdapterResultMap[TFeature];
    case 'search':
      return (await runAISearch(input as AISearchRequest, preferredProvider, repository)) as AIAdapterResultMap[TFeature];
    case 'answer':
      return (await runAIAnswer(input as AIAnswerRequest, preferredProvider, env, repository)) as AIAdapterResultMap[TFeature];
    case 'summary':
      return (await runAISummary(input as AISummaryRequest, preferredProvider, env, repository)) as AIAdapterResultMap[TFeature];
    case 'quiz':
      return (await runAIQuiz(input as AIQuizRequest, preferredProvider, env, repository)) as AIAdapterResultMap[TFeature];
    default:
      throw new Error(`Unsupported AI feature: ${String(feature)}`);
  }
}
