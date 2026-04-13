import { demoLectures } from '../../data/demo-data';
import type {
  ShortformCandidate,
  ShortformComposeRequest,
  ShortformExtraction,
  ShortformExtractionDetail,
  ShortformGenerateRequest,
  ShortformSelectRequest,
  ShortformStyle,
  ShortformVideo,
} from '../../types';
import {
  buildCandidateText,
  demoShortformCandidates,
  demoShortformExtractions,
  createId,
  getCourseLectures,
  getExtraction,
  getStyleLabel,
  now,
} from './data';
import {
  createShortformCandidate,
  createShortformVideoFromCandidates,
  getSelectedShortformCandidates,
} from './helpers';

type TranscriptSegmentLike = {
  start_ms: number;
  end_ms: number;
  text: string;
};

function buildTranscriptCandidates(
  extractionId: string,
  lectureId: string,
  lectureTitle: string,
  courseId: string,
  style: ShortformStyle,
  segments: TranscriptSegmentLike[],
  startOrderIndex: number,
): ShortformCandidate[] {
  const validSegments = segments.filter((segment) => segment.text.trim().length > 0);
  if (validSegments.length === 0) {
    return [];
  }

  const clipCount = Math.min(3, validSegments.length);
  const chunkSize = Math.ceil(validSegments.length / clipCount);

  return Array.from({ length: clipCount }, (_, clipIndex) => {
    const startIndex = clipIndex * chunkSize;
    const chunk = validSegments.slice(startIndex, startIndex + chunkSize);
    const start = chunk[0]?.start_ms ?? 0;
    const end = chunk[chunk.length - 1]?.end_ms ?? start + 30_000;
    const description = chunk.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim().slice(0, 120);

    return {
      id: createId('cand', demoShortformCandidates.length + startOrderIndex + clipIndex),
      extraction_id: extractionId,
      lecture_id: lectureId,
      lecture_title: lectureTitle,
      course_id: courseId,
      start_time_ms: start,
      end_time_ms: Math.max(end, start + 1_000),
      label: `${lectureTitle} 전사 ${clipIndex + 1}`,
      description: description || buildCandidateText(lectureTitle, style, clipIndex),
      importance: Math.max(0.4, 0.94 - clipIndex * 0.08),
      order_index: startOrderIndex + clipIndex,
      is_selected: clipIndex < 3,
    };
  });
}

export function listShortformCandidates(extractionId: string): ShortformCandidate[] {
  return demoShortformCandidates
    .filter((candidate) => candidate.extraction_id === extractionId)
    .sort((a, b) => a.order_index - b.order_index);
}

export function generateShortformExtraction(userId: string, input: ShortformGenerateRequest) {
  let lectureIds: string[];
  if (input.mode === 'single' && input.lecture_id) {
    lectureIds = [input.lecture_id];
  } else {
    lectureIds = getCourseLectures(input.course_id).map((lecture) => lecture.id);
  }

  const extraction: ShortformExtraction = {
    id: createId('sfe', demoShortformExtractions.length),
    user_id: userId,
    course_id: input.course_id,
    mode: input.mode ?? 'cross',
    lecture_ids: lectureIds,
    style: input.style ?? 'highlight',
    target_duration_sec: input.target_duration_sec ?? 300,
    language: input.language ?? 'ko',
    ai_model: 'demo-shortform-v1',
    ai_response: `Generated ${getStyleLabel(input.style ?? 'highlight')} shortform candidates`,
    total_candidates: 0,
    created_at: now(),
  };

  demoShortformExtractions.push(extraction);
  lectureIds.forEach((lectureId, lectureIndex) => {
    const lecture = demoLectures.find((item) => item.id === lectureId);
    if (!lecture) {
      return;
    }

    const transcriptSegments = input.transcript_segments_by_lecture?.[lecture.id];
    const baseOrderIndex = demoShortformCandidates.filter((item) => item.extraction_id === extraction.id).length;
    const candidates =
      transcriptSegments && transcriptSegments.length > 0
        ? buildTranscriptCandidates(
            extraction.id,
            lecture.id,
            lecture.title,
            lecture.course_id,
            extraction.style,
            transcriptSegments,
            baseOrderIndex,
          )
        : Array.from({ length: 3 }, (_, index) =>
            createShortformCandidate(
              extraction.id,
              lecture.id,
              lecture.title,
              lecture.course_id,
              lectureIndex * 60_000 + index * 30_000,
              lectureIndex * 60_000 + index * 30_000 + 45_000,
              extraction.style,
              baseOrderIndex + index,
            ),
          );
    demoShortformCandidates.push(...candidates);
  });

  extraction.total_candidates = demoShortformCandidates.filter((item) => item.extraction_id === extraction.id).length;

  return {
    extraction,
    candidates: demoShortformCandidates
      .filter((item) => item.extraction_id === extraction.id)
      .sort((a, b) => a.order_index - b.order_index),
  };
}

export function toggleShortformCandidateSelection(input: ShortformSelectRequest): ShortformCandidate[] {
  const selected = new Set(input.candidate_ids);
  return demoShortformCandidates.map((candidate) => {
    if (!selected.has(candidate.id)) {
      return candidate;
    }

    return {
      ...candidate,
      is_selected: input.is_selected,
    };
  });
}

export function composeShortformVideo(userId: string, input: ShortformComposeRequest): ShortformVideo | null {
  const extraction = getExtraction(input.extraction_id);
  if (!extraction) {
    return null;
  }

  const candidates = getSelectedShortformCandidates(input.extraction_id, input.candidate_ids);
  return createShortformVideoFromCandidates(userId, extraction, input.title, input.description ?? '', candidates);
}

export function getShortformExtractionById(extractionId: string): ShortformExtractionDetail | undefined {
  const extraction = getExtraction(extractionId);
  if (!extraction) {
    return undefined;
  }

  return {
    ...extraction,
    candidates: demoShortformCandidates
      .filter((candidate) => candidate.extraction_id === extractionId)
      .sort((a, b) => a.order_index - b.order_index),
  };
}
