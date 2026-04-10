import { getAIProviderCatalog, getAIProviderPlan, type AIProviderCapability, type AIProviderName } from '@myway/shared';
import { getAIRuntimePolicy, type RuntimeBindings } from './runtime-env';

export type AIProviderSelection = {
  feature: AIProviderCapability;
  current_provider: AIProviderName;
  recommended_chain: AIProviderName[];
  fallback_chain: AIProviderName[];
};

const DEFAULT_FALLBACK_ORDER: Record<AIProviderCapability, AIProviderName[]> = {
  intent: ['ollama', 'gemini', 'demo'],
  search: ['demo'],
  answer: ['ollama', 'gemini', 'demo'],
  summary: ['ollama', 'gemini', 'demo'],
  quiz: ['ollama', 'gemini', 'demo'],
  smart: ['ollama', 'gemini', 'demo'],
  insights: ['ollama', 'gemini', 'demo'],
  recommendations: ['ollama', 'gemini', 'demo'],
  stt: ['cloudflare', 'gemini', 'demo'],
  embedding: ['cloudflare', 'ollama', 'demo'],
};

function uniqueProviders(chain: AIProviderName[]): AIProviderName[] {
  return Array.from(new Set(chain));
}

export function getAIProviderSelection(feature: AIProviderCapability, preferredProvider?: AIProviderName): AIProviderSelection {
  const plan = getAIProviderPlan(feature);
  const fallback_chain = uniqueProviders([
    ...(preferredProvider ? [preferredProvider] : []),
    ...DEFAULT_FALLBACK_ORDER[feature],
  ]);

  return {
    feature: plan.feature,
    current_provider: preferredProvider ?? plan.current_provider,
    recommended_chain: plan.recommended_chain,
    fallback_chain,
  };
}

export function getAIProviderSelectionForRuntime(
  feature: AIProviderCapability,
  env?: RuntimeBindings,
  preferredProvider?: AIProviderName,
): AIProviderSelection {
  const policy = getAIRuntimePolicy(env);
  const baseChain: AIProviderName[] =
    feature === 'search'
      ? ['demo']
      : policy.public_mode === 'dev'
        ? ['ollama', 'gemini', 'demo']
        : ['gemini', 'demo'];

  const normalizedPreferred = preferredProvider && baseChain.includes(preferredProvider) ? preferredProvider : undefined;
  const fallback_chain = uniqueProviders([
    ...(normalizedPreferred ? [normalizedPreferred] : []),
    ...baseChain,
  ]);

  return {
    feature,
    current_provider: normalizedPreferred ?? baseChain[0],
    recommended_chain: baseChain,
    fallback_chain,
  };
}

export function getAIProviderOverview() {
  return getAIProviderCatalog();
}
