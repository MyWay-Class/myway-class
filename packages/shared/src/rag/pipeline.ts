import { demoCourses } from '../data/demo-data';
import { getLectureDetail } from '../lms/learning';
import { classifyAIIntent } from '../ai/ai-intent';
import { memoryMediaRepository, type MediaRepository } from '../lms/media';
import type {
  AIAnswerResult,
  AIIntentResult,
  AIRagRequest,
  AIRagResult,
  AISearchResult,
} from '../types';
import { buildAnswerText, buildProviderPlan, buildSuggestions, extractEntities } from './entities';
import { buildCorpus, rankChunks } from './chunking';

function resolveLabel(input: AIRagRequest): string {
  if (input.lecture_id) {
    return getLectureDetail(input.lecture_id)?.title ?? '이 강의';
  }

  if (input.course_id) {
    return demoCourses.find((course) => course.id === input.course_id)?.title ?? '이 과목';
  }

  return '현재 강의';
}

function buildSearchResult(query: string, lectureId: string | null, chunks: Awaited<ReturnType<typeof rankChunks>>): AISearchResult {
  return {
    query,
    lecture_id: lectureId,
    hits: chunks,
  };
}

function buildAnswerResult(
  query: string,
  lectureId: string | null,
  intent: AIIntentResult,
  chunks: Awaited<ReturnType<typeof rankChunks>>,
  label: string,
): AIAnswerResult {
  return {
    question: query,
    lecture_id: lectureId,
    intent,
    answer: buildAnswerText(query, intent.intent, chunks, label),
    references: chunks,
    suggestions: buildSuggestions(intent.intent, label),
  };
}

export async function buildAIRAGOverview(
  input: AIRagRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagResult> {
  const query = input.query.replaceAll(/\s+/g, ' ').trim();
  const intent = classifyAIIntent({
    message: query,
    lecture_id: input.lecture_id,
    context: input.context,
  });
  const chunks = await rankChunks(query, await buildCorpus(input, repository), Math.max(1, Math.min(6, input.limit ?? 4)));
  const label = resolveLabel(input);

  return {
    query,
    lecture_id: input.lecture_id ?? null,
    course_id: input.course_id ?? null,
    intent,
    entities: extractEntities(input),
    chunks,
    search: buildSearchResult(query, input.lecture_id ?? null, chunks),
    answer: buildAnswerResult(query, input.lecture_id ?? null, intent, chunks, label),
    provider: buildProviderPlan(input.preferred_provider),
  };
}

export async function collectAIRagChunks(input: AIRagRequest, repository: MediaRepository = memoryMediaRepository) {
  return await buildCorpus(input, repository);
}

export function collectAIRagEntities(input: AIRagRequest) {
  return extractEntities(input);
}

export async function buildAIRagSearch(input: AIRagRequest, repository: MediaRepository = memoryMediaRepository): Promise<AISearchResult> {
  const query = input.query.replaceAll(/\s+/g, ' ').trim();
  const chunks = await rankChunks(query, await buildCorpus(input, repository), Math.max(1, Math.min(6, input.limit ?? 4)));
  return buildSearchResult(query, input.lecture_id ?? null, chunks);
}
