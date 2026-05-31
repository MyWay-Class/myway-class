import {
  appendAIUsageLog,
  getLectureDetail,
} from '@myway/shared';
import { getAIProviderSelectionForRuntime } from '../lib/ai-provider';
import { getGeminiRuntimeSettings, type RuntimeBindings } from '../lib/runtime-env';

type AISnapshot = {
  lecture_id: string | null;
  course_id: string | null;
};

export function ensureLectureExists(lectureId: string): boolean {
  return Boolean(getLectureDetail(lectureId));
}

export function getLectureSnapshot(lectureId?: string): AISnapshot {
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

export function buildResponseMetadata(feature: 'intent' | 'search' | 'answer' | 'summary' | 'quiz', env?: RuntimeBindings) {
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

export function recordUsageLog(input: {
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
