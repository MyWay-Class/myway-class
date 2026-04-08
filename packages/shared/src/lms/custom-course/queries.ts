import { demoCourses, getDemoUser } from '../../data/demo-data';
import type { CustomCourseCommunityItem, CustomCourseDetail, CustomCourseLibraryItem } from '../../types';
import { demoCustomCourseClips, demoCustomCourseShares, demoCustomCourses } from './data';
import { isEnrolled } from '../learning';

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

export function getCustomCourseById(customCourseId: string): CustomCourseDetail | undefined {
  return getCustomCourseDetail(customCourseId);
}
