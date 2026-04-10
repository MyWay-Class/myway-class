import {
  answerAIQuestion,
  classifyAIIntent,
  createAISummary,
  generateAIQuiz,
  getLectureDetail,
  getLectureTranscript,
  listLectureNotes,
  type AIAction,
  type AIIntent,
  type AIIntentRequest,
  type AIIntentResult,
  type AIAnswerRequest,
  type AIAnswerResult,
  type AIQuizQuestion,
  type AIQuizRequest,
  type AIQuizResult,
  type AISummaryRequest,
  type AISummaryResult,
  type AIProviderName,
} from '@myway/shared';
import { getAIProviderSelectionForRuntime } from './ai-provider';
import type { RuntimeBindings } from './runtime-env';

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

export function pickDifficulty(value: unknown, fallback: AIQuizResult['difficulty']): AIQuizResult['difficulty'] {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  return fallback;
}

export function pickIntent(value: unknown, fallback: AIIntent): AIIntent {
  const allowed: AIIntent[] = [
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

  return typeof value === 'string' && allowed.includes(value as AIIntent) ? (value as AIIntent) : fallback;
}

export function pickAction(value: unknown, fallback: AIAction): AIAction {
  return value === 'SEARCH' || value === 'DIRECT_ANSWER' || value === 'CLARIFY' || value === 'DECOMPOSE' ? value : fallback;
}

export function pickConfidence(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0.35, Math.min(0.98, value));
  }

  return fallback;
}

export function normalizeQuizQuestion(
  candidate: JsonObject | undefined,
  fallback: AIQuizQuestion,
): AIQuizQuestion {
  if (!candidate) {
    return fallback;
  }

  const question = pickString(candidate.question, fallback.question);
  const mergedChoices = [...toStringArray(candidate.choices)];

  for (const choice of fallback.choices) {
    if (mergedChoices.length >= 4) {
      break;
    }

    if (!mergedChoices.includes(choice)) {
      mergedChoices.push(choice);
    }
  }

  while (mergedChoices.length < 4) {
    mergedChoices.push(fallback.choices[mergedChoices.length] ?? fallback.choices[0]);
  }

  const correctChoiceIndex =
    typeof candidate.correct_choice_index === 'number' &&
    Number.isInteger(candidate.correct_choice_index) &&
    candidate.correct_choice_index >= 0 &&
    candidate.correct_choice_index < mergedChoices.length
      ? candidate.correct_choice_index
      : fallback.correct_choice_index;

  return {
    ...fallback,
    question,
    choices: mergedChoices.slice(0, 4),
    correct_choice_index: correctChoiceIndex,
    explanation: pickString(candidate.explanation, fallback.explanation),
  };
}

export function getLectureSourceText(lectureId: string): { lectureTitle: string; courseTitle: string; sourceText: string } | null {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return null;
  }

  const transcript = getLectureTranscript(lecture.id);
  const note = listLectureNotes(lecture.id)[0];
  const sourceText = normalizeText(note?.content ?? transcript?.full_text ?? lecture.content_text);

  return {
    lectureTitle: lecture.title,
    courseTitle: lecture.course_title,
    sourceText,
  };
}

export function getOllamaModel(env?: RuntimeBindings): string {
  return env?.MYWAY_OLLAMA_MODEL ?? env?.OLLAMA_MODEL ?? 'llama3.1';
}

export function getGeminiModel(env?: RuntimeBindings): string {
  return env?.MYWAY_GEMINI_MODEL ?? env?.GEMINI_MODEL ?? 'gemini-2.0-flash';
}

export function isRemoteFeatureEnabled(feature: 'intent' | 'answer' | 'summary' | 'quiz', env?: RuntimeBindings, preferredProvider?: AIProviderName): boolean {
  const provider = getAIProviderSelectionForRuntime(feature, env, preferredProvider);
  return provider.current_provider === 'ollama' || provider.current_provider === 'gemini';
}

export function getIntentFallback(input: AIIntentRequest): AIIntentResult {
  return classifyAIIntent(input);
}

export function getAnswerFallback(input: AIAnswerRequest): AIAnswerResult {
  return answerAIQuestion(input);
}

export function getSummaryFallback(input: AISummaryRequest): AISummaryResult | null {
  return createAISummary(input);
}

export function getQuizFallback(input: AIQuizRequest): AIQuizResult | null {
  return generateAIQuiz(input);
}
