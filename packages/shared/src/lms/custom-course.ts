import { demoCourses, demoLectures, getDemoUser } from '../data/demo-data';
import { getCourseDetail, isEnrolled } from './learning';
import type {
  CustomCourse,
  CustomCourseClip,
  CustomCourseCommunityItem,
  CustomCourseComposeRequest,
  CustomCourseCopyRequest,
  CustomCourseDetail,
  CustomCourseLibraryItem,
  CustomCourseShare,
  CustomCourseShareRequest,
} from '../types';

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string, size: number): string {
  return `${prefix}_${String(size + 1).padStart(3, '0')}`;
}

function normalizeCourseClips(clips: CustomCourseComposeRequest['clips'], courseId: string): CustomCourseClip[] | null {
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

function baseCourseStatus(clipCount: number): CustomCourse['status'] {
  return clipCount > 0 ? 'READY' : 'DRAFT';
}

function createCourseRecord(
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

export const demoCustomCourses: CustomCourse[] = [];
export const demoCustomCourseClips: CustomCourseClip[] = [];
export const demoCustomCourseShares: CustomCourseShare[] = [];

export function composeCustomCourse(userId: string, input: CustomCourseComposeRequest): CustomCourseDetail | null {
  return createCourseRecord(userId, input);
}

export function getCustomCourseDetail(customCourseId: string): CustomCourseDetail | undefined {
  const customCourse = demoCustomCourses.find((item) => item.id === customCourseId);
  if (!customCourse) {
    return undefined;
  }

  return {
    ...customCourse,
    clips: demoCustomCourseClips
      .filter((clip) => clip.custom_course_id === customCourseId)
      .sort((a, b) => a.order_index - b.order_index),
    shares: demoCustomCourseShares
      .filter((share) => share.custom_course_id === customCourseId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export function listMyCustomCourses(userId: string): CustomCourseLibraryItem[] {
  return demoCustomCourses
    .filter((course) => course.owner_id === userId)
    .map((course) => ({
      ...getCustomCourseDetail(course.id)!,
      ownership: course.copied_from_id ? 'copied' : 'owned',
    }));
}

export function listCommunityCustomCourses(userId: string, courseId?: string): CustomCourseCommunityItem[] {
  return demoCustomCourseShares
    .filter((share) => {
      const customCourse = getCustomCourseDetail(share.custom_course_id);
      if (!customCourse) {
        return false;
      }

      const enrolled = isEnrolled(userId, share.course_id);
      const matchesCourse = courseId ? share.course_id === courseId : true;
      return enrolled && matchesCourse && share.visibility === 'course';
    })
    .map((share) => {
      const customCourse = getCustomCourseDetail(share.custom_course_id)!;
      return {
        ...customCourse,
        shared_by_name: getDemoUser(share.shared_by)?.name ?? '공유자',
        course_title: demoCourses.find((course) => course.id === share.course_id)?.title ?? '알 수 없는 강의',
        is_copied_by_user: demoCustomCourses.some((course) => course.owner_id === userId && course.copied_from_id === customCourse.id),
      };
    });
}

export function shareCustomCourse(
  userId: string,
  customCourseId: string,
  input: CustomCourseShareRequest,
): CustomCourseShare | null {
  const customCourse = getCustomCourseDetail(customCourseId);
  if (!customCourse || customCourse.owner_id !== userId) {
    return null;
  }

  if (demoCustomCourseShares.some((share) => share.custom_course_id === customCourseId && share.shared_by === userId)) {
    return null;
  }

  const share: CustomCourseShare = {
    id: createId('ccs', demoCustomCourseShares.length),
    custom_course_id: customCourseId,
    course_id: customCourse.course_id,
    shared_by: userId,
    visibility: 'course',
    message: input.message?.trim() || null,
    created_at: now(),
  };

  demoCustomCourseShares.push(share);
  const record = demoCustomCourses.find((item) => item.id === customCourseId);
  if (record) {
    record.share_count += 1;
    record.status = 'SHARED';
    record.updated_at = now();
  }

  return share;
}

export function copyCustomCourse(
  userId: string,
  input: CustomCourseCopyRequest,
): CustomCourseDetail | null {
  const source = getCustomCourseDetail(input.custom_course_id);
  if (!source || !isEnrolled(userId, source.course_id)) {
    return null;
  }

  const copied = createCourseRecord(
    userId,
    {
      course_id: source.course_id,
      title: input.title?.trim() || `${source.title} 복사본`,
      description: input.description?.trim() || source.description,
      clips: source.clips.map((clip) => ({
        lecture_id: clip.lecture_id,
        start_time_ms: clip.start_time_ms,
        end_time_ms: clip.end_time_ms,
        label: clip.label,
        description: clip.description,
      })),
    },
    'copied',
    source.id,
  );

  if (!copied) {
    return null;
  }

  const record = demoCustomCourses.find((item) => item.id === copied.id);
  if (record) {
    record.status = 'COPIED';
    record.copied_from_id = source.id;
    record.copy_count = 0;
    record.updated_at = now();
  }

  const sourceRecord = demoCustomCourses.find((item) => item.id === source.id);
  if (sourceRecord) {
    sourceRecord.copy_count += 1;
    sourceRecord.updated_at = now();
  }

  return { ...copied, status: 'COPIED', copied_from_id: source.id };
}

export function getCustomCourseById(customCourseId: string): CustomCourseDetail | undefined {
  return getCustomCourseDetail(customCourseId);
}
