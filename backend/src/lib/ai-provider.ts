import { getAIProviderCatalog, getAIProviderPlan, type AIProviderCapability, type AIProviderName } from '@myway/shared';

export type AIProviderSelection = {
  feature: AIProviderCapability;
  current_provider: AIProviderName;
  recommended_chain: AIProviderName[];
  fallback_chain: AIProviderName[];
};

const DEFAULT_FALLBACK_ORDER: Record<AIProviderCapability, AIProviderName[]> = {
  intent: ['ollama', 'gemini', 'cloudflare', 'demo'],
  search: ['ollama', 'gemini', 'cloudflare', 'demo'],
  answer: ['ollama', 'gemini', 'cloudflare', 'demo'],
  summary: ['ollama', 'gemini', 'cloudflare', 'demo'],
  quiz: ['ollama', 'gemini', 'cloudflare', 'demo'],
  smart: ['ollama', 'gemini', 'cloudflare', 'demo'],
  insights: ['ollama', 'gemini', 'cloudflare', 'demo'],
  recommendations: ['ollama', 'gemini', 'cloudflare', 'demo'],
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

export function getAIProviderOverview() {
  return getAIProviderCatalog();
}
