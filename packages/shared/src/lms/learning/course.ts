import { demoEnrollments, demoLectureProgress, demoLectures, getDemoUser, instructorNames } from '../../data/demo-data';
import type { Course, CourseCard, Lecture } from '../../types';

export function getLectureInstructorName(instructorId: string): string {
  return getDemoUser(instructorId)?.name ?? instructorNames[instructorId] ?? '알 수 없는 강사';
}

export function getCourseLectures(courseId: string): Lecture[] {
  return demoLectures
    .filter((lecture) => lecture.course_id === courseId)
    .sort((a, b) => a.order_index - b.order_index);
}

export function isEnrolled(userId: string, courseId: string): boolean {
  return demoEnrollments.some(
    (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId && enrollment.status === 'active',
  );
}

export function getCompletedLectureCount(userId: string, courseId: string): number {
  const lectureIds = new Set(getCourseLectures(courseId).map((lecture) => lecture.id));

  return demoLectureProgress.filter(
    (progress) => progress.user_id === userId && progress.is_completed && lectureIds.has(progress.lecture_id),
  ).length;
}

export function getLectureCount(courseId: string): number {
  return getCourseLectures(courseId).length;
}

export function getCourseProgress(userId: string, courseId: string): number {
  const lectureCount = getLectureCount(courseId);
  if (lectureCount === 0) {
    return 0;
  }

  const completed = getCompletedLectureCount(userId, courseId);
  return Math.round((completed / lectureCount) * 100);
}

export function createCourseCard(course: Course, userId: string): CourseCard {
  return {
    ...course,
    instructor_name: getLectureInstructorName(course.instructor_id),
    lecture_count: getLectureCount(course.id),
    enrolled: isEnrolled(userId, course.id),
    progress_percent: getCourseProgress(userId, course.id),
    completed_lectures: getCompletedLectureCount(userId, course.id),
  };
}
