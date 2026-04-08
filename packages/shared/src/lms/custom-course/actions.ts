import type { CustomCourseComposeRequest, CustomCourseCopyRequest, CustomCourseShare, CustomCourseShareRequest } from '../../types';
import { createCourseRecord, demoCustomCourseShares, demoCustomCourses, now } from './data';
import { getCustomCourseDetail } from './queries';

export function composeCustomCourse(userId: string, input: CustomCourseComposeRequest) {
  return createCourseRecord(userId, input);
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
    id: `ccs_${String(demoCustomCourseShares.length + 1).padStart(3, '0')}`,
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

export function copyCustomCourse(userId: string, input: CustomCourseCopyRequest) {
  const source = getCustomCourseDetail(input.custom_course_id);
  if (!source) {
    return null;
  }

  return createCourseRecord(
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
}
