import { getSTTProviderCatalog, getSTTProviderPlan, type STTProviderCapability, type STTProviderName } from '@myway/shared';

export type STTProviderSelection = {
  feature: STTProviderCapability;
  current_provider: STTProviderName;
  recommended_chain: STTProviderName[];
  fallback_chain: STTProviderName[];
};

const DEFAULT_FALLBACK_ORDER: Record<STTProviderCapability, STTProviderName[]> = {
  transcribe: ['cloudflare', 'gemini', 'demo'],
  segment: ['cloudflare', 'gemini', 'demo'],
  pipeline: ['cloudflare', 'gemini', 'demo'],
};

function uniqueProviders(chain: STTProviderName[]): STTProviderName[] {
  return Array.from(new Set(chain));
}

export function getSTTProviderSelection(feature: STTProviderCapability, preferredProvider?: STTProviderName): STTProviderSelection {
  const plan = getSTTProviderPlan(feature);
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

export function getSTTProviderOverview() {
  return getSTTProviderCatalog();
}
