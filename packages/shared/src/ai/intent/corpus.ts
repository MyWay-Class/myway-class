import { demoLectures } from '../../data/demo-data';
import { getLectureDetail } from '../../lms/learning';
import { getLectureTranscript, listLectureNotes, type MediaRepository, memoryMediaRepository } from '../../lms/media';
import type { AIChunkSource, AIReference, AISearchHit, AIRagChunk, AIRagRequest } from '../../types';
import { buildChunkText as buildChunkTextFromText, scoreChunk as scoreChunkFromText } from './helpers';
import { buildEmbedding, cosineSimilarity, tokenize } from '../../rag/vector';

export type LectureSourceSnapshot = {
  lecture: NonNullable<ReturnType<typeof getLectureDetail>>;
  transcript: Awaited<ReturnType<typeof getLectureTranscript>> | null;
  note: Awaited<ReturnType<typeof listLectureNotes>>[number] | null;
  source_text: string;
};

function listTargetLectureIds(lectureId?: string): string[] {
  if (lectureId) {
    return [lectureId];
  }

  return demoLectures.map((lecture) => lecture.id);
}

export function buildChunkText(text: string, maxChunks = 3): string[] {
  return buildChunkTextFromText(text, maxChunks);
}

export function scoreChunk(queryTokens: string[], candidateText: string, title: string): number {
  return scoreChunkFromText(queryTokens, candidateText, title);
}

export async function buildLectureSourceSnapshot(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LectureSourceSnapshot | null> {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return null;
  }

  const transcript = await getLectureTranscript(lecture.id, repository);
  const note = (await listLectureNotes(lecture.id, repository))[0] ?? null;

  return {
    lecture,
    transcript,
    note,
    source_text: [transcript?.full_text, note?.content, lecture.content_text].filter(Boolean).join('\n\n'),
  };
}

function countTokens(text: string): number {
  return tokenize(text).length;
}

export function createReference(
  lectureId: string,
  sourceType: AIChunkSource,
  sourceId: string,
  title: string,
  excerpt: string,
  chunkIndex: number,
  similarity: number,
): AIReference {
  return {
    id: `${sourceType}_${sourceId}_${String(chunkIndex + 1).padStart(2, '0')}`,
    lecture_id: lectureId,
    source_type: sourceType,
    source_id: sourceId,
    title,
    content: excerpt.slice(0, 240),
    excerpt: excerpt.slice(0, 240),
    similarity,
    chunk_index: chunkIndex,
  };
}

export async function collectLectureReferences(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIReference[]> {
  const snapshot = await buildLectureSourceSnapshot(lectureId, repository);
  if (!snapshot) {
    return [];
  }

  const { lecture, transcript, note } = snapshot;
  const references: AIReference[] = [];
  const lectureChunks = buildChunkText(`${lecture.title}. ${lecture.content_text}`, 2);
  transcript?.segments.slice(0, 2).forEach((segment, index) => {
    references.push(
      createReference(
        lecture.id,
        'transcript',
        transcript.id,
        `${lecture.title} · 트랜스크립트`,
        segment.text,
        index,
        0.9 - index * 0.05,
      ),
    );
  });

  if (note) {
    const noteChunks = buildChunkText(`${note.title}. ${note.content}`, 2);
    noteChunks.slice(0, 2).forEach((chunk, index) => {
      references.push(
        createReference(
          lecture.id,
          'note',
          note.id,
          `${lecture.title} · 요약 노트`,
          chunk,
          index,
          0.88 - index * 0.05,
        ),
      );
    });
  }

  if (!transcript && !note) {
    lectureChunks.forEach((chunk, index) => {
      references.push(
        createReference(
          lecture.id,
          'lecture',
          lecture.id,
          `${lecture.course_title} · ${lecture.title} · 강의 본문`,
          chunk,
          index,
          0.82 - index * 0.05,
        ),
      );
    });
  }

  return references;
}

export async function buildSearchCandidates(
  lectureId?: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AISearchHit[]> {
  return Promise.all(listTargetLectureIds(lectureId).map((id) => collectLectureReferences(id, repository))).then((items) => items.flat());
}

export async function buildCorpusForLecture(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  const snapshot = await buildLectureSourceSnapshot(lectureId, repository);
  if (!snapshot) {
    return [];
  }

  const { lecture, transcript, note } = snapshot;
  const chunks: AIRagChunk[] = [];
  const hasExtractedSource = Boolean(transcript || note);

  transcript?.segments.forEach((segment) => {
    const content = segment.text.trim();
    if (!content) {
      return;
    }

    chunks.push({
      id: `transcript_${transcript.id}_${String(segment.index + 1).padStart(2, '0')}`,
      lecture_id: lecture.id,
      source_type: 'transcript',
      source_id: transcript.id,
      title: `${lecture.title} · 트랜스크립트`,
      content: content.slice(0, 240),
      excerpt: content.slice(0, 240),
      similarity: 0,
      chunk_index: segment.index,
      source_scope: 'transcript',
      token_count: countTokens(content),
      start_ms: segment.start_ms,
      end_ms: segment.end_ms,
      retrieval_mode: 'hybrid',
      vector_embedding: buildEmbedding(`${lecture.title} ${content}`),
    });
  });

  if (note) {
    const noteChunks = buildChunkText(`${note.title}. ${note.content}`, 2);
    noteChunks.forEach((chunk, index) => {
      chunks.push({
        id: `note_${note.id}_${String(index + 1).padStart(2, '0')}`,
        lecture_id: lecture.id,
        source_type: 'note',
        source_id: note.id,
        title: `${lecture.title} · 요약 노트`,
        content: chunk.slice(0, 240),
        excerpt: chunk.slice(0, 240),
        similarity: 0,
        chunk_index: index,
        source_scope: 'note',
        token_count: countTokens(chunk),
        retrieval_mode: 'hybrid',
        vector_embedding: buildEmbedding(`${lecture.title} ${chunk}`),
      });
    });
  }

  if (!hasExtractedSource) {
    const lectureChunks = buildChunkText(`${lecture.title}. ${lecture.content_text}`, 2);
    lectureChunks.forEach((chunk, index) => {
      chunks.push({
        id: `lecture_${lecture.id}_${String(index + 1).padStart(2, '0')}`,
        lecture_id: lecture.id,
        source_type: 'lecture',
        source_id: lecture.id,
        title: `${lecture.course_title} · ${lecture.title} · 강의 본문`,
        content: chunk.slice(0, 240),
        excerpt: chunk.slice(0, 240),
        similarity: 0,
        chunk_index: index,
        source_scope: 'lecture',
        token_count: countTokens(chunk),
        retrieval_mode: 'hybrid',
        vector_embedding: buildEmbedding(`${lecture.title} ${chunk}`),
      });
    });
  }

  return chunks;
}

export async function buildCorpusForCourse(
  courseId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  const lectures = demoLectures.filter((lecture) => lecture.course_id === courseId);
  return Promise.all(lectures.map((lecture) => buildCorpusForLecture(lecture.id, repository))).then((items) => items.flat());
}

export async function buildCorpus(
  input: AIRagRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIRagChunk[]> {
  if (input.lecture_id) {
    return await buildCorpusForLecture(input.lecture_id, repository);
  }

  if (input.course_id) {
    return await buildCorpusForCourse(input.course_id, repository);
  }

  return Promise.all(demoLectures.map((lecture) => buildCorpusForLecture(lecture.id, repository))).then((items) => items.flat());
}

function scoreCorpusChunk(query: string, chunk: AIRagChunk): number {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    if (chunk.source_scope === 'transcript') {
      return 0.62;
    }
    if (chunk.source_scope === 'note') {
      return 0.58;
    }
    return 0.55;
  }

  const haystackTokens = tokenize(`${chunk.title} ${chunk.content}`);
  const overlap = queryTokens.filter((token) => haystackTokens.includes(token)).length;
  const coverage = overlap / Math.max(3, queryTokens.length);
  const exactMatch = chunk.content.includes(query) ? 0.14 : 0;
  const titleBoost = chunk.title.includes(query) ? 0.06 : 0;
  let scopeBoost = 0;
  if (chunk.source_scope === 'transcript') {
    scopeBoost = 0.05;
  } else if (chunk.source_scope === 'note') {
    scopeBoost = 0.03;
  }
  return Math.min(0.99, coverage + exactMatch + titleBoost + scopeBoost);
}

export async function rankChunks(query: string, chunks: AIRagChunk[], limit: number): Promise<AIRagChunk[]> {
  const queryEmbedding = buildEmbedding(query);
  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      keyword_similarity: Math.round(scoreCorpusChunk(query, chunk) * 1000) / 1000,
      vector_similarity: Math.round(cosineSimilarity(queryEmbedding, chunk.vector_embedding ?? buildEmbedding(`${chunk.title} ${chunk.content}`)) * 1000) / 1000,
    }))
    .map((chunk) => ({
      ...chunk,
      hybrid_similarity: Math.round(Math.min(0.99, Math.max(0.0, (chunk.keyword_similarity ?? 0) * 0.68 + (chunk.vector_similarity ?? 0) * 0.32)) * 1000) / 1000,
      similarity: Math.round(Math.min(0.99, Math.max(0.0, (chunk.keyword_similarity ?? 0) * 0.68 + (chunk.vector_similarity ?? 0) * 0.32)) * 1000) / 1000,
      retrieval_mode: 'hybrid' as const,
      score_breakdown: {
        keyword: chunk.keyword_similarity ?? 0,
        vector: chunk.vector_similarity ?? 0,
        hybrid: Math.round(Math.min(0.99, Math.max(0.0, (chunk.keyword_similarity ?? 0) * 0.68 + (chunk.vector_similarity ?? 0) * 0.32)) * 1000) / 1000,
      },
    }))
    .filter((chunk) => (chunk.similarity ?? 0) > 0 || query.trim().length === 0);
  rankedChunks.sort((left, right) => (right.hybrid_similarity ?? 0) - (left.hybrid_similarity ?? 0) || (right.vector_similarity ?? 0) - (left.vector_similarity ?? 0) || left.title.localeCompare(right.title));
  return rankedChunks.slice(0, limit);
}
