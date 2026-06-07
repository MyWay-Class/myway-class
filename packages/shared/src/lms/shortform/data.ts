import { demoCourses, demoEnrollments, demoLectures } from '../../data/demo-data';
import type {
  ShortformCandidate,
  ShortformClip,
  ShortformExtraction,
  ShortformLike,
  ShortformSave,
  ShortformShare,
  ShortformStyle,
  ShortformVideo,
  ShortformVideoDetail,
} from '../../types';

export const demoShortformExtractions: ShortformExtraction[] = [];
export const demoShortformCandidates: ShortformCandidate[] = [];
export const demoShortformVideos: ShortformVideo[] = [];
export const demoShortformClips: ShortformClip[] = [];
export const demoShortformShares: ShortformShare[] = [];
export const demoShortformSaves: ShortformSave[] = [];
export const demoShortformLikes: ShortformLike[] = [];

export function now(): string {
  return new Date().toISOString();
}

export function createId(prefix: string, size: number): string {
  return `${prefix}_${String(size + 1).padStart(3, '0')}`;
}

export function isEnrolled(userId: string, courseId: string): boolean {
  return demoEnrollments.some((enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId && enrollment.status === 'active');
}

export function getCourseLectures(courseId: string) {
  return demoLectures
    .filter((lecture) => lecture.course_id === courseId)
    .sort((a, b) => a.order_index - b.order_index);
}

export function getStyleLabel(style: ShortformStyle): string {
  return {
    highlight: '핵심 하이라이트',
    exam_prep: '시험 대비',
    quick_review: '빠른 복습',
    deep_dive: '심화 정리',
    custom: '사용자 지정',
  }[style];
}

export function buildCandidateText(lectureTitle: string, style: ShortformStyle, index: number): string {
  const styleLabels: Record<ShortformStyle, string[]> = {
    highlight: ['핵심 개념', '중요 포인트', '정리 구간'],
    exam_prep: ['정의', '비교 포인트', '암기 구간'],
    quick_review: ['짧은 복습', '바로 보기', '재확인 포인트'],
    deep_dive: ['심화 설명', '연결 관계', '응용 맥락'],
    custom: ['사용자 정의', '개별 목표', '자유 편집'],
  };

  return styleLabels[style][index % styleLabels[style].length] ?? lectureTitle;
}

export function normalizeShortformDescription(text: string, fallback: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return fallback;
  }

  const questionCount = (normalized.match(/\?/g) ?? []).length;
  const readableCount = normalized.replace(/[^\p{L}\p{N}\p{Script=Hangul}\s]/gu, '').length;
  const readability = readableCount / Math.max(normalized.length, 1);

  if (questionCount >= 3 || readability < 0.45) {
    return fallback;
  }

  return normalized;
}

export function getExtraction(extractionId: string): ShortformExtraction | undefined {
  return demoShortformExtractions.find((item) => item.id === extractionId);
}

export function getVideo(videoId: string): ShortformVideo | undefined {
  return demoShortformVideos.find((item) => item.id === videoId);
}

export function updateVideoExport(
  videoId: string,
  partial: Partial<
    Pick<
      ShortformVideo,
      | 'export_status'
      | 'export_job_id'
      | 'export_result_url'
      | 'export_failure_reason'
      | 'export_error_message'
      | 'export_retry_count'
      | 'video_url'
      | 'updated_at'
    >
  >,
): ShortformVideo | null {
  const current = getVideo(videoId);
  if (!current) {
    return null;
  }

  const next: ShortformVideo = {
    ...current,
    ...partial,
    updated_at: partial.updated_at ?? now(),
  };

  const index = demoShortformVideos.findIndex((item) => item.id === videoId);
  if (index >= 0) {
    demoShortformVideos[index] = next;
  }

  return next;
}

export function buildVideoDetail(video: ShortformVideo): ShortformVideoDetail {
  return {
    ...video,
    clips: demoShortformClips
      .filter((clip) => clip.shortform_id === video.id)
      .sort((a, b) => a.order_index - b.order_index),
  };
}
