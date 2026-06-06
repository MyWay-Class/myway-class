export type JsonObject = Record<string, unknown>;

export const OLLAMA_TIMEOUT_MS = 60_000;
export const OLLAMA_QUIZ_TIMEOUT_MS = 120_000;

export function normalizeText(value: string): string {
  return value.replaceAll(/\s+/g, ' ').trim();
}

export function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit).trim()}...`;
}

export function extractJsonCandidate(value: string): string | null {
  const fencedMatch = value.match(/```json\s*([\s\S]*?)```/i) ?? value.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fencedMatch?.[1] ?? value).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

export function parseJsonObject(value: string): JsonObject | null {
  const candidate = extractJsonCandidate(value);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as JsonObject;
  } catch {
    return null;
  }
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function pickString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function pickDifficulty(value: unknown, fallback: import('@myway/shared').AIQuizResult['difficulty']): import('@myway/shared').AIQuizResult['difficulty'] {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  return fallback;
}

export function pickIntent(value: unknown, fallback: import('@myway/shared').AIIntent): import('@myway/shared').AIIntent {
  const allowed: import('@myway/shared').AIIntent[] = [
    'request_summary',
    'generate_quiz',
    'search_content',
    'ask_concept',
    'ask_recommendation',
    'explain_deeper',
    'translate',
    'compare',
    'create_shortform',
    'extract_audio',
    'analyze_progress',
    'general_chat',
    'clarify',
  ];

  return typeof value === 'string' && allowed.includes(value as import('@myway/shared').AIIntent) ? (value as import('@myway/shared').AIIntent) : fallback;
}

export function pickAction(value: unknown, fallback: import('@myway/shared').AIAction): import('@myway/shared').AIAction {
  return value === 'SEARCH' || value === 'DIRECT_ANSWER' || value === 'CLARIFY' || value === 'DECOMPOSE' ? value : fallback;
}

export function pickConfidence(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0.35, Math.min(0.98, value));
  }

  return fallback;
}
