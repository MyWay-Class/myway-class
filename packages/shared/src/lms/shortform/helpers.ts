import type {
  ShortformCandidate,
  ShortformExtraction,
  ShortformStyle,
  ShortformVideo,
} from '../../types';
import {
  buildCandidateText,
  createId,
  demoShortformCandidates,
  demoShortformClips,
  demoShortformVideos,
  isEnrolled,
  now,
} from './data';

export function createShortformCandidate(
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

export function getSelectedShortformCandidates(
  extractionId: string,
  candidateIds?: string[],
): ShortformCandidate[] {
  const candidates = demoShortformCandidates
    .filter((candidate) => candidate.extraction_id === extractionId)
    .sort((a, b) => a.order_index - b.order_index);

  if (!candidateIds || candidateIds.length === 0) {
    return candidates.filter((candidate) => candidate.is_selected);
  }

  const selected = new Set(candidateIds);
  return candidates.filter((candidate) => selected.has(candidate.id));
}

export function createShortformVideoFromCandidates(
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

export function canAccessShortformCommunityVideo(userId: string, video: ShortformVideo, courseId: string): boolean {
  return isEnrolled(userId, courseId) && video.course_id === courseId;
}
