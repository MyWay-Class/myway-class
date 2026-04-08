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

    const startBase = lectureIndex * 60_000;
    const candidates = Array.from({ length: 3 }, (_, index) =>
      createShortformCandidate(
        extraction.id,
        lecture.id,
        lecture.title,
        lecture.course_id,
        startBase + index * 30_000,
        startBase + index * 30_000 + 45_000,
        extraction.style,
        demoShortformCandidates.filter((item) => item.extraction_id === extraction.id).length + index,
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
