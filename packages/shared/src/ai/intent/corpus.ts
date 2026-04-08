import { demoLectures } from '../../data/demo-data';
import { getLectureDetail } from '../../lms/learning';
import { getLectureTranscript, listLectureNotes } from '../../lms/media';
import type { AIChunkSource, AIReference, AISearchHit } from '../../types';
import { buildChunkText as buildChunkTextFromText, scoreChunk as scoreChunkFromText } from './helpers';

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

export function collectLectureReferences(lectureId: string): AIReference[] {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return [];
  }

  const references: AIReference[] = [];
  const lectureChunks = buildChunkText(`${lecture.title}. ${lecture.content_text}`, 2);

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

  const transcript = getLectureTranscript(lecture.id);
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

  const note = listLectureNotes(lecture.id)[0];
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

  return references;
}

export function buildSearchCandidates(lectureId?: string): AISearchHit[] {
  return listTargetLectureIds(lectureId).flatMap((id) => collectLectureReferences(id));
}
