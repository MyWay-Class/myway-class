import {
  answerAIQuestion,
  classifyAIIntent,
  createAISummary,
  generateAIQuiz,
  getLectureDetail,
  getLectureTranscript,
  listLectureNotes,
  type MediaRepository,
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
import { normalizeText, type JsonObject, pickString, toStringArray } from './ai-engine-utils-text';

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

export async function getLectureSourceText(
  lectureId: string,
  repository?: MediaRepository,
): Promise<{ lectureTitle: string; courseTitle: string; sourceText: string } | null> {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return null;
  }

  const transcript = await getLectureTranscript(lecture.id, repository);
  const note = (await listLectureNotes(lecture.id, repository))[0];
  const sourceText = normalizeText(transcript?.full_text ?? note?.content ?? lecture.content_text);

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

export async function getAnswerFallback(
  input: AIAnswerRequest,
  repository?: MediaRepository,
): Promise<AIAnswerResult> {
  return await answerAIQuestion(input, repository);
}

export async function getSummaryFallback(
  input: AISummaryRequest,
  repository?: MediaRepository,
): Promise<AISummaryResult | null> {
  return await createAISummary(input, repository);
}

export async function getQuizFallback(
  input: AIQuizRequest,
  repository?: MediaRepository,
): Promise<AIQuizResult | null> {
  return await generateAIQuiz(input, repository);
}
