import type {
  CustomCourse,
  CustomCourseClip,
  CustomCourseComposeRequest,
  CustomCourseDetail,
  CustomCourseShare,
} from '../../types';
import { demoLectures } from '../../data/demo-data';
import { getCourseDetail, isEnrolled } from '../learning';

export const demoCustomCourses: CustomCourse[] = [];
export const demoCustomCourseClips: CustomCourseClip[] = [];
export const demoCustomCourseShares: CustomCourseShare[] = [];

export function now(): string {
  return new Date().toISOString();
}

export function createId(prefix: string, size: number): string {
  return `${prefix}_${String(size + 1).padStart(3, '0')}`;
}

export function normalizeCourseClips(clips: CustomCourseComposeRequest['clips'], courseId: string): CustomCourseClip[] | null {
  const courseLectures = demoLectures.filter((lecture) => lecture.course_id === courseId);
  if (courseLectures.length === 0) {
    return null;
  }

  const lectureById = new Map(courseLectures.map((lecture) => [lecture.id, lecture]));
  const normalized = clips
    .map((clip, index) => {
      const lecture = lectureById.get(clip.lecture_id);
      if (!lecture) {
        return null;
      }

      const start = Math.max(0, Math.min(clip.start_time_ms, lecture.duration_minutes * 60_000));
      const end = Math.max(start + 1000, Math.min(clip.end_time_ms, lecture.duration_minutes * 60_000));

      return {
        id: createId('cclip', index),
        custom_course_id: '',
        lecture_id: lecture.id,
        lecture_title: lecture.title,
        course_id: lecture.course_id,
        start_time_ms: start,
        end_time_ms: end,
        label: clip.label?.trim() || `${lecture.title} ${index + 1}`,
        description: clip.description?.trim() || lecture.content_text.slice(0, 100),
        order_index: index,
        source_video_url: `/static/media/${lecture.id}.mp4`,
      };
    })
    .filter((clip): clip is CustomCourseClip => Boolean(clip));

  return normalized.length === clips.length ? normalized : null;
}

export function baseCourseStatus(clipCount: number): CustomCourse['status'] {
  return clipCount > 0 ? 'READY' : 'DRAFT';
}

export function createCourseRecord(
  userId: string,
  input: CustomCourseComposeRequest,
  ownership: 'owned' | 'copied' = 'owned',
  copiedFromId: string | null = null,
): CustomCourseDetail | null {
  if (!isEnrolled(userId, input.course_id)) {
    return null;
  }

  const course = getCourseDetail(input.course_id, userId);
  if (!course) {
    return null;
  }

  const clips = normalizeCourseClips(input.clips, input.course_id);
  if (!clips || clips.length === 0) {
    return null;
  }

  const totalDuration = clips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);
  const customCourse: CustomCourse = {
    id: createId('cc', demoCustomCourses.length),
    course_id: input.course_id,
    owner_id: userId,
    title: input.title.trim(),
    description: input.description?.trim() || course.description,
    status: baseCourseStatus(clips.length),
    source_lecture_ids: Array.from(new Set(clips.map((clip) => clip.lecture_id))),
    clip_count: clips.length,
    total_duration_ms: totalDuration,
    share_count: 0,
    copy_count: 0,
    copied_from_id: copiedFromId,
    created_at: now(),
    updated_at: now(),
  };

  const withIds = clips.map((clip, index) => ({
    ...clip,
    id: createId('cclip', demoCustomCourseClips.length + index),
    custom_course_id: customCourse.id,
  }));

  demoCustomCourses.push(customCourse);
  demoCustomCourseClips.push(...withIds);

  return {
    ...customCourse,
    clips: withIds,
    shares: [],
  };
}
