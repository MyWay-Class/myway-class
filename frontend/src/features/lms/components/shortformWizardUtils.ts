import { getLectureDisplayDurationMinutes, normalizeShortformDescription, type CourseDetail } from '@myway/shared';
import type { ClipSuggestion } from './ShortformWizardTypes';

export const MIN_CLIP_MS = 1_000;
export const MAX_CLIP_MS = 300_000;

export type TranscriptSnapshot = {
  segments: Array<{ start_ms: number; end_ms: number; text: string }>;
  duration_ms: number;
} | null;

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function mapComposeError(code?: string, message?: string): string {
  switch (code) {
    case 'INVALID_CLIP_RANGE':
      return '클립 종료 시간이 시작 시간보다 커야 합니다.';
    case 'CLIP_DURATION_EXCEEDED':
      return '클립 길이는 최대 5분까지 가능합니다.';
    case 'COURSE_LECTURE_MISMATCH':
      return '선택한 강의와 클립의 코스가 일치하지 않습니다.';
    case 'LECTURE_NOT_FOUND':
      return '선택한 강의를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.';
    case 'FORBIDDEN':
      return '해당 강의 클립을 조합할 권한이 없습니다.';
    default:
      return message ?? '숏폼 생성에 실패했습니다.';
  }
}

export function clipKey(clip: ClipSuggestion): string {
  return clip.id;
}

function buildTranscriptSuggestions(course: CourseDetail, lectureId: string, transcript: TranscriptSnapshot): ClipSuggestion[] {
  const lectures = Array.isArray(course.lectures) ? course.lectures : [];
  const lecture = lectures.find((item) => item.id === lectureId);
  const segments = transcript?.segments ?? [];
  if (!lecture || segments.length === 0) return [];

  const validSegments = segments.filter((segment) => segment.text.trim().length > 0);
  if (validSegments.length === 0) return [];

  const clipCount = Math.min(3, validSegments.length);
  const chunkSize = Math.ceil(validSegments.length / clipCount);

  return Array.from({ length: clipCount }, (_, clipIndex) => {
    const startIndex = clipIndex * chunkSize;
    const chunk = validSegments.slice(startIndex, startIndex + chunkSize);
    const start = chunk[0]?.start_ms ?? 0;
    const end = chunk[chunk.length - 1]?.end_ms ?? start + 30_000;
    const description = normalizeShortformDescription(
      chunk.map((segment) => segment.text).join(' ').slice(0, 120),
      `${lecture.title} 전사 구간`,
    );

    return {
      id: `${lecture.id}:${start}:${end}:${clipIndex}`,
      extraction_id: '',
      lecture_id: lecture.id,
      lecture_title: lecture.title,
      start_time_ms: start,
      end_time_ms: Math.max(end, start + 1_000),
      label: `${lecture.title} 전사 ${clipIndex + 1}`,
      description,
    };
  });
}

export function buildClipSuggestions(course: CourseDetail | null, transcriptMap: Record<string, TranscriptSnapshot>): ClipSuggestion[] {
  if (!course) return [];

  const lectures = Array.isArray(course.lectures) ? course.lectures : [];
  return lectures.flatMap((lecture, lectureIndex) => {
    const transcriptSnapshot = transcriptMap[lecture.id] ?? null;
    if (transcriptSnapshot?.segments && transcriptSnapshot.segments.length > 0) {
      return buildTranscriptSuggestions(course, lecture.id, transcriptSnapshot);
    }

    const totalMs = Math.max(transcriptSnapshot?.duration_ms ?? getLectureDisplayDurationMinutes(lecture) * 60_000, 1);
    const segment = Math.max(Math.round(totalMs / 3), 30_000);

    return Array.from({ length: 3 }, (_, clipIndex) => {
      const start_time_ms = Math.min(clipIndex * segment, Math.max(totalMs - segment, 0));
      const end_time_ms = Math.min(start_time_ms + segment, totalMs);
      const description = normalizeShortformDescription((lecture.content_text ?? '').slice(0, 120), `${lecture.title} 요약 구간`);

      return {
        id: `${lecture.id}:${start_time_ms}:${end_time_ms}:${clipIndex}`,
        extraction_id: '',
        lecture_id: lecture.id,
        lecture_title: lecture.title,
        start_time_ms,
        end_time_ms,
        label: `${lecture.title} 핵심 ${clipIndex + 1} · ${lectureIndex + 1}차시`,
        description,
      };
    });
  });
}
