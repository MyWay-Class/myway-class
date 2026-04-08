import { demoLectures } from '../data/demo-data';
import { getCourseLectures, getLectureDetail } from '../lms/learning';
import { getLectureTranscript, listLectureNotes } from '../lms/media';
import type { AIRagChunk, AIRagRequest } from '../types';

const STOP_WORDS = new Set([
  '그리고', '하지만', '때문에', '정리', '설명', '강의', '내용', '질문', '답변',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'about', 'into',
]);

function normalizeText(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function splitSentences(text: string): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function createChunkText(sentences: string[], maxChunks: number): string[] {
  if (sentences.length === 0) {
    return [];
  }

  const chunkSize = Math.max(1, Math.ceil(sentences.length / Math.max(1, maxChunks)));
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    chunks.push(sentences.slice(index, index + chunkSize).join(' '));
  }

  return chunks.filter(Boolean);
}

function countTokens(text: string): number {
  return tokenize(text).length;
}

function createHit(
  lectureId: string,
  sourceType: AIRagChunk['source_scope'],
  sourceId: string,
  title: string,
  content: string,
  chunkIndex: number,
  extra: Pick<AIRagChunk, 'token_count' | 'source_scope'> & Partial<Pick<AIRagChunk, 'start_ms' | 'end_ms'>>,
): AIRagChunk {
  return {
    id: `${sourceType}_${sourceId}_${String(chunkIndex + 1).padStart(2, '0')}`,
    lecture_id: lectureId,
    source_type: sourceType,
    source_id: sourceId,
    title,
    content: content.slice(0, 240),
    excerpt: content.slice(0, 240),
    similarity: 0,
    chunk_index: chunkIndex,
    ...extra,
  };
}

export function buildCorpusForLecture(lectureId: string): AIRagChunk[] {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return [];
  }

  const transcript = getLectureTranscript(lectureId);
  const note = listLectureNotes(lectureId)[0];
  const chunks: AIRagChunk[] = [];

  const lectureChunks = createChunkText(splitSentences(`${lecture.title}. ${lecture.content_text}`), 2);
  lectureChunks.forEach((chunk, index) => {
    chunks.push(
      createHit(
        lecture.id,
        'lecture',
        lecture.id,
        `${lecture.course_title} · ${lecture.title} · 강의 본문`,
        chunk,
        index,
        {
          token_count: countTokens(chunk),
          source_scope: 'lecture',
        },
      ),
    );
  });

  transcript?.segments.forEach((segment) => {
    const content = normalizeText(segment.text);
    if (!content) {
      return;
    }

    chunks.push(
      createHit(
        lecture.id,
        'transcript',
        transcript.id,
        `${lecture.title} · 트랜스크립트`,
        content,
        segment.index,
        {
          token_count: countTokens(content),
          source_scope: 'transcript',
          start_ms: segment.start_ms,
          end_ms: segment.end_ms,
        },
      ),
    );
  });

  if (note) {
    const noteChunks = createChunkText(splitSentences(`${note.title}. ${note.content}`), 2);
    noteChunks.forEach((chunk, index) => {
      chunks.push(
        createHit(
          lecture.id,
          'note',
          note.id,
          `${lecture.title} · 요약 노트`,
          chunk,
          index,
          {
            token_count: countTokens(chunk),
            source_scope: 'note',
          },
        ),
      );
    });
  }

  return chunks;
}

export function buildCorpusForCourse(courseId: string): AIRagChunk[] {
  return getCourseLectures(courseId).flatMap((lecture) => buildCorpusForLecture(lecture.id));
}

export function buildCorpus(input: AIRagRequest): AIRagChunk[] {
  if (input.lecture_id) {
    return buildCorpusForLecture(input.lecture_id);
  }

  if (input.course_id) {
    return buildCorpusForCourse(input.course_id);
  }

  return demoLectures.flatMap((lecture) => buildCorpusForLecture(lecture.id));
}

function scoreChunk(queryTokens: string[], query: string, chunk: AIRagChunk): number {
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
  const exactMatch = normalizeText(chunk.content).includes(normalizeText(query)) ? 0.14 : 0;
  const titleBoost = normalizeText(chunk.title).includes(normalizeText(query)) ? 0.06 : 0;
  let scopeBoost = 0;
  if (chunk.source_scope === 'transcript') {
    scopeBoost = 0.05;
  } else if (chunk.source_scope === 'note') {
    scopeBoost = 0.03;
  }
  return Math.min(0.99, coverage + exactMatch + titleBoost + scopeBoost);
}

export function rankChunks(query: string, chunks: AIRagChunk[], limit: number): AIRagChunk[] {
  const queryTokens = tokenize(query);
  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      similarity: scoreChunk(queryTokens, query, chunk),
    }))
    .filter((chunk) => chunk.similarity > 0 || queryTokens.length === 0);
  rankedChunks.sort((left, right) => right.similarity - left.similarity || left.title.localeCompare(right.title));
  return rankedChunks.slice(0, limit);
}
