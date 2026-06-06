import type { AIProviderName, SmartChatResult, SmartChatRoute } from '@myway/shared';

export type SmartChatMetadata = {
  provider: AIProviderName;
  model: string;
};

export const DEMO_SMART_MODEL = 'demo-smart-v1';

export function logSmartChatTiming(stage: string, startedAt: number, details: Record<string, unknown>): void {
  const elapsedMs = Math.round(performance.now() - startedAt);
  console.info('[smart-chat]', JSON.stringify({ stage, elapsed_ms: elapsedMs, ...details }));
}

export function normalizeRoute(intent: SmartChatResult['intent']['intent']): SmartChatRoute {
  if (intent === 'request_summary') return 'summary';
  if (intent === 'generate_quiz') return 'quiz';
  if (intent === 'search_content') return 'search';
  if (intent === 'translate') return 'translate';
  if (intent === 'compare') return 'compare';
  if (intent === 'clarify') return 'clarify';
  return 'answer';
}

export function attachMetadata(result: SmartChatResult, metadata: SmartChatMetadata): SmartChatResult {
  return {
    ...result,
    provider: metadata.provider,
    model: metadata.model,
  };
}
