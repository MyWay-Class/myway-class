import { demoCourses, demoEnrollments, demoLectures, getDemoUser } from './demo-data';
import type {
  ShortformCandidate,
  ShortformClip,
  ShortformComposeRequest,
  ShortformCommunityItem,
  ShortformExtraction,
  ShortformExtractionDetail,
  ShortformGenerateRequest,
  ShortformLike,
  ShortformLikeRequest,
  ShortformLibraryItem,
  ShortformSave,
  ShortformSaveRequest,
  ShortformSelectRequest,
  ShortformShare,
  ShortformShareRequest,
  ShortformStyle,
  ShortformVideo,
  ShortformVideoDetail,
} from './types';

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string, size: number): string {
  return `${prefix}_${String(size + 1).padStart(3, '0')}`;
}

function isEnrolled(userId: string, courseId: string): boolean {
  return demoEnrollments.some((enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId && enrollment.status === 'active');
}

function getCourseLectures(courseId: string) {
  return demoLectures
    .filter((lecture) => lecture.course_id === courseId)
    .sort((a, b) => a.order_index - b.order_index);
}

function getStyleLabel(style: ShortformStyle): string {
  return {
    highlight: '핵심 하이라이트',
    exam_prep: '시험 대비',
    quick_review: '빠른 복습',
    deep_dive: '심화 정리',
    custom: '사용자 지정',
  }[style];
}

function buildCandidateText(lectureTitle: string, style: ShortformStyle, index: number): string {
  const styleLabels: Record<ShortformStyle, string[]> = {
    highlight: ['핵심 개념', '중요 포인트', '정리 구간'],
    exam_prep: ['정의', '비교 포인트', '암기 구간'],
    quick_review: ['짧은 복습', '바로 보기', '재확인 포인트'],
    deep_dive: ['심화 설명', '연결 관계', '응용 맥락'],
    custom: ['사용자 정의', '개별 목표', '자유 편집'],
  };

  return styleLabels[style][index % styleLabels[style].length] ?? lectureTitle;
}

function createCandidate(
  extractionId: string,
  lectureId: string,
  lectureTitle: string,
  courseId: string,
  startTimeMs: number,
  endTimeMs: number,
  style: ShortformStyle,
  orderIndex: number,
): ShortformCandidate {
  return {
    id: createId('cand', demoShortformCandidates.length + orderIndex),
    extraction_id: extractionId,
    lecture_id: lectureId,
    lecture_title: lectureTitle,
    course_id: courseId,
    start_time_ms: startTimeMs,
    end_time_ms: endTimeMs,
    label: `${lectureTitle} ${orderIndex + 1}`,
    description: buildCandidateText(lectureTitle, style, orderIndex),
    importance: Math.max(0.4, 0.92 - orderIndex * 0.08),
    order_index: orderIndex,
    is_selected: orderIndex < 3,
  };
}

function getExtraction(extractionId: string): ShortformExtraction | undefined {
  return demoShortformExtractions.find((item) => item.id === extractionId);
}

function getVideo(videoId: string): ShortformVideo | undefined {
  return demoShortformVideos.find((item) => item.id === videoId);
}

function buildVideoDetail(video: ShortformVideo): ShortformVideoDetail {
  return {
    ...video,
    clips: demoShortformClips
      .filter((clip) => clip.shortform_id === video.id)
      .sort((a, b) => a.order_index - b.order_index),
  };
}

function getSelectedCandidates(extractionId: string, candidateIds?: string[]): ShortformCandidate[] {
  const candidates = demoShortformCandidates
    .filter((candidate) => candidate.extraction_id === extractionId)
    .sort((a, b) => a.order_index - b.order_index);

  if (!candidateIds || candidateIds.length === 0) {
    return candidates.filter((candidate) => candidate.is_selected);
  }

  const selected = new Set(candidateIds);
  return candidates.filter((candidate) => selected.has(candidate.id));
}

function createVideoFromCandidates(
  userId: string,
  extraction: ShortformExtraction,
  title: string,
  description: string,
  candidates: ShortformCandidate[],
): ShortformVideo | null {
  if (candidates.length === 0) {
    return null;
  }

  const totalDuration = candidates.reduce((sum, candidate) => sum + (candidate.end_time_ms - candidate.start_time_ms), 0);
  const video: ShortformVideo = {
    id: createId('sfv', demoShortformVideos.length),
    shortform_id: createId('sf', demoShortformVideos.length),
    user_id: userId,
    title,
    description,
    duration_ms: totalDuration,
    total_segments: candidates.length,
    course_id: extraction.course_id,
    source_lecture_ids: Array.from(new Set(candidates.map((candidate) => candidate.lecture_id))),
    status: 'GENERATED',
    video_url: `/static/shortforms/${createId('sfv', demoShortformVideos.length)}.mp4`,
    share_count: 0,
    like_count: 0,
    save_count: 0,
    view_count: 0,
    created_at: now(),
  };

  demoShortformVideos.push(video);
  candidates.forEach((candidate, index) => {
    demoShortformClips.push({
      id: createId('clip', demoShortformClips.length + index),
      shortform_id: video.id,
      lecture_id: candidate.lecture_id,
      lecture_title: candidate.lecture_title,
      course_id: candidate.course_id,
      start_time_ms: candidate.start_time_ms,
      end_time_ms: candidate.end_time_ms,
      label: candidate.label,
      description: candidate.description,
      order_index: index,
      source_video_url: `/static/media/${candidate.lecture_id}.mp4`,
    });
  });

  return video;
}

function canAccessCommunityVideo(userId: string, video: ShortformVideo, courseId: string): boolean {
  return isEnrolled(userId, courseId) && video.course_id === courseId;
}

export const demoShortformExtractions: ShortformExtraction[] = [];
export const demoShortformCandidates: ShortformCandidate[] = [];
export const demoShortformVideos: ShortformVideo[] = [];
export const demoShortformClips: ShortformClip[] = [];
export const demoShortformShares: ShortformShare[] = [];
export const demoShortformSaves: ShortformSave[] = [];
export const demoShortformLikes: ShortformLike[] = [];

export function generateShortformExtraction(userId: string, input: ShortformGenerateRequest) {
  const lectureIds = input.mode === 'single' && input.lecture_id
    ? [input.lecture_id]
    : getCourseLectures(input.course_id).map((lecture) => lecture.id);

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
      createCandidate(
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

export function listShortformCandidates(extractionId: string): ShortformCandidate[] {
  return demoShortformCandidates
    .filter((candidate) => candidate.extraction_id === extractionId)
    .sort((a, b) => a.order_index - b.order_index);
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

  const candidates = getSelectedCandidates(input.extraction_id, input.candidate_ids);
  return createVideoFromCandidates(userId, extraction, input.title, input.description ?? '', candidates);
}

export function listMyShortformVideos(userId: string): ShortformLibraryItem[] {
  return demoShortformVideos
    .filter((video) => video.user_id === userId)
    .map((video) => ({
      ...buildVideoDetail(video),
      ownership: 'owned' as const,
    }));
}

export function getShortformVideoDetail(videoId: string): ShortformVideoDetail | undefined {
  const video = getVideo(videoId);
  if (!video) {
    return undefined;
  }

  return buildVideoDetail(video);
}

export function shareShortformVideo(userId: string, input: ShortformShareRequest) {
  const video = getVideo(input.video_id);
  if (!video || video.user_id !== userId) {
    return null;
  }

  if (!canAccessCommunityVideo(userId, video, input.course_id)) {
    return null;
  }

  const existing = demoShortformShares.find((share) => share.video_id === input.video_id && share.shared_by === userId);
  if (existing) {
    return null;
  }

  const share: ShortformShare = {
    id: createId('sfs', demoShortformShares.length),
    video_id: input.video_id,
    course_id: input.course_id,
    shared_by: userId,
    visibility: input.visibility ?? 'course',
    message: input.message?.trim() || null,
    created_at: now(),
  };

  demoShortformShares.push(share);
  const record = demoShortformVideos.find((item) => item.id === input.video_id);
  if (record) {
    record.share_count += 1;
    record.status = 'PUBLIC';
  }

  return share;
}

export function listShortformCommunity(userId: string, courseId?: string): ShortformCommunityItem[] {
  return demoShortformShares
    .filter((share) => {
      const video = getVideo(share.video_id);
      if (!video) {
        return false;
      }

      const enrolled = isEnrolled(userId, share.course_id);
      const matchesCourse = courseId ? share.course_id === courseId : true;
      return enrolled && matchesCourse && share.visibility === 'course';
    })
    .map((share) => {
      const video = getVideo(share.video_id)!;
      const course = demoCourses.find((item) => item.id === share.course_id);
      return {
        ...buildVideoDetail(video),
        shared_by_name: getDemoUser(share.shared_by)?.name ?? '공유자',
        course_title: course?.title ?? '알 수 없는 강의',
        is_saved: demoShortformSaves.some((save) => save.user_id === userId && save.video_id === video.id),
        is_liked: demoShortformLikes.some((like) => like.user_id === userId && like.video_id === video.id),
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveShortformVideo(userId: string, input: ShortformSaveRequest) {
  const video = getVideo(input.video_id);
  if (!video) {
    return null;
  }

  const existing = demoShortformSaves.find((save) => save.user_id === userId && save.video_id === input.video_id);
  if (existing) {
    return null;
  }

  const save: ShortformSave = {
    id: createId('sfvsave', demoShortformSaves.length),
    user_id: userId,
    video_id: input.video_id,
    note: input.note?.trim() || null,
    folder: input.folder?.trim() || 'default',
    created_at: now(),
  };

  demoShortformSaves.push(save);
  video.save_count += 1;
  return save;
}

export function toggleShortformLike(userId: string, input: ShortformLikeRequest) {
  const video = getVideo(input.video_id);
  if (!video) {
    return null;
  }

  const existingIndex = demoShortformLikes.findIndex((like) => like.user_id === userId && like.video_id === input.video_id);
  if (existingIndex >= 0) {
    demoShortformLikes.splice(existingIndex, 1);
    video.like_count = Math.max(0, video.like_count - 1);
    return { liked: false };
  }

  demoShortformLikes.push({
    id: createId('sfl', demoShortformLikes.length),
    user_id: userId,
    video_id: input.video_id,
    created_at: now(),
  });
  video.like_count += 1;
  return { liked: true };
}

export function getShortformExtractionById(extractionId: string): ShortformExtractionDetail | undefined {
  const extraction = getExtraction(extractionId);
  if (!extraction) {
    return undefined;
  }

  return {
    ...extraction,
    candidates: listShortformCandidates(extractionId),
  };
}

export function listMyShortformLibrary(userId: string): ShortformLibraryItem[] {
  return [
    ...listMyShortformVideos(userId),
    ...demoShortformSaves
      .filter((save) => save.user_id === userId)
      .map((save) => {
        const video = getVideo(save.video_id)!;
        return {
          ...buildVideoDetail(video),
          ownership: 'saved' as const,
          save_note: save.note,
          save_folder: save.folder,
          saved_at: save.created_at,
        };
      }),
  ];
}
