import {
  demoCourses,
  demoEnrollments,
  demoLectureProgress,
  demoLectures,
  getDemoUser,
  instructorNames,
} from './demo-data';
import type {
  Course,
  CourseCard,
  CourseDetail,
  Dashboard,
  Enrollment,
  Lecture,
  LectureCompletionResult,
  LectureDetail,
} from './types';

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

export function listCourseCards(userId: string): CourseCard[] {
  return demoCourses.map((course) => createCourseCard(course, userId));
}

export function getCourseDetail(courseId: string, userId: string): CourseDetail | undefined {
  const course = demoCourses.find((item) => item.id === courseId);
  if (!course) {
    return undefined;
  }

  return {
    ...createCourseCard(course, userId),
    lectures: getCourseLectures(courseId),
  };
}

export function getLectureDetail(lectureId: string, userId?: string): LectureDetail | undefined {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return undefined;
  }

  const lectures = getCourseLectures(lecture.course_id);
  const index = lectures.findIndex((item) => item.id === lecture.id);

  return {
    ...lecture,
    course_title: demoCourses.find((item) => item.id === lecture.course_id)?.title ?? '알 수 없는 강의',
    course_instructor:
      getLectureInstructorName(demoCourses.find((item) => item.id === lecture.course_id)?.instructor_id ?? ''),
    previous_lecture_id: index > 0 ? lectures[index - 1]?.id : undefined,
    next_lecture_id: index >= 0 && index < lectures.length - 1 ? lectures[index + 1]?.id : undefined,
    is_completed: userId
      ? demoLectureProgress.some((progress) => progress.user_id === userId && progress.lecture_id === lectureId && progress.is_completed)
      : undefined,
  };
}

export function getDashboard(userId: string): Dashboard {
  const courses = listCourseCards(userId);
  const activeEnrollments = courses.filter((course) => course.enrolled).length;
  const user = getDemoUser(userId);
  const averageProgress =
    courses.length === 0
      ? 0
      : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  return {
    learner_name: user?.name ?? '학습자',
    role: user?.role ?? 'STUDENT',
    total_courses: courses.length,
    active_enrollments: activeEnrollments,
    average_progress: averageProgress,
    courses,
  };
}

export function completeLectureProgress(userId: string, lectureId: string): LectureCompletionResult {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return { ok: false, reason: 'lecture_not_found' };
  }

  const enrollment = demoEnrollments.find(
    (item) => item.user_id === userId && item.course_id === lecture.course_id && item.status === 'active',
  );

  if (!enrollment) {
    return { ok: false, reason: 'enrollment_required' };
  }

  const existingProgress = demoLectureProgress.find(
    (progress) => progress.user_id === userId && progress.lecture_id === lectureId,
  );

  if (existingProgress) {
    existingProgress.is_completed = true;
  } else {
    demoLectureProgress.push({
      id: `prg_${String(demoLectureProgress.length + 1).padStart(3, '0')}`,
      user_id: userId,
      lecture_id: lectureId,
      is_completed: true,
    });
  }

  const courseLectures = getCourseLectures(lecture.course_id);
  const completedLectureIds = new Set(
    demoLectureProgress
      .filter((progress) => progress.user_id === userId && progress.is_completed)
      .map((progress) => progress.lecture_id),
  );

  const completedLectures = courseLectures.filter((item) => completedLectureIds.has(item.id)).length;
  const totalLectures = courseLectures.length;
  const progressPercent = totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100);

  enrollment.progress_percent = progressPercent;

  return {
    ok: true,
    lecture_id: lectureId,
    course_id: lecture.course_id,
    progress_percent: progressPercent,
    completed_lectures: completedLectures,
    total_lectures: totalLectures,
  };
}

export function enrollUser(userId: string, courseId: string): Enrollment {
  const existing = demoEnrollments.find(
    (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId,
  );

  if (existing) {
    return existing;
  }

  const enrollment: Enrollment = {
    id: `enr_${String(demoEnrollments.length + 1).padStart(3, '0')}`,
    user_id: userId,
    course_id: courseId,
    status: 'active',
    progress_percent: 0,
  };

  demoEnrollments.push(enrollment);
  return enrollment;
}
