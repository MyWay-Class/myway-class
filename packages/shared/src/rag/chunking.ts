import type { AIRagChunk, AIRagRequest } from '../types';
import { memoryMediaRepository, type MediaRepository } from '../lms/media';
import {
  buildChunkText as buildChunkTextFromIntentCorpus,
  buildCorpus as buildIntentCorpus,
  buildCorpusForCourse as buildIntentCorpusForCourse,
  buildCorpusForLecture as buildIntentCorpusForLecture,
  rankChunks as rankIntentChunks,
} from '../ai/intent/corpus';

export function buildChunkText(text: string, maxChunks = 3): string[] {
  return buildChunkTextFromIntentCorpus(text, maxChunks);
}

export async function buildCorpusForLecture(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  return await buildIntentCorpusForLecture(lectureId, repository);
}

export async function buildCorpusForCourse(
  courseId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  return await buildIntentCorpusForCourse(courseId, repository);
}

export async function buildCorpus(
  input: AIRagRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  return await buildIntentCorpus(input, repository);
}

export async function rankChunks(query: string, chunks: AIRagChunk[], limit: number): Promise<AIRagChunk[]> {
  return await rankIntentChunks(query, chunks, limit);
}
