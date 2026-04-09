import { demoEnrollments, demoLectureProgress, demoLectures, getDemoUser, instructorNames } from '../../data/demo-data';
import type { Course, CourseCard, CourseThumbnailPalette, Lecture } from '../../types';

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

export function getCourseThumbnailPalette(course: Course): CourseThumbnailPalette {
  if (course.category === 'AI') {
    return course.difficulty === 'advanced' ? 'violet' : 'indigo';
  }

  if (course.category === 'Web') {
    return 'emerald';
  }

  return 'amber';
}

export function getCourseRating(course: Course): number {
  if (course.difficulty === 'beginner') return 4.7;
  if (course.difficulty === 'intermediate') return 4.8;
  return 4.9;
}

export function getCourseStudentCount(courseId: string): number {
  return demoEnrollments.filter((enrollment) => enrollment.course_id === courseId && enrollment.status === 'active').length;
}

export function getCourseTotalDurationMinutes(courseId: string): number {
  return getCourseLectures(courseId).reduce((sum, lecture) => sum + lecture.duration_minutes, 0);
}

export function getLectureKeywords(lecture: Lecture): string[] {
  const keywordMap: Record<string, string[]> = {
    lec_ai_001: ['AI', '머신러닝', '딥러닝', '정의'],
    lec_ai_002: ['데이터셋', '라벨링', '검증', '모델'],
    lec_web_001: ['React', '컴포넌트', '상태 관리', 'props'],
    lec_web_002: ['TypeScript', '폼', '검증', '타입 안정성'],
    lec_llm_001: ['RAG', '청킹', '임베딩', '검색'],
    lec_llm_002: ['요약', '질문응답', '학습 흐름', '챗봇'],
  };

  return keywordMap[lecture.id] ?? lecture.content_text.split(/[\s,·]+/).filter(Boolean).slice(0, 4);
}

export function getLectureTranscriptExcerpt(lecture: Lecture): string {
  return lecture.content_text;
}

export function getLectureVideoUrl(lectureId: string): string {
  return `/static/media/${lectureId}.mp4`;
}

export function createCourseCard(course: Course, userId: string): CourseCard {
  return {
    ...course,
    instructor_name: getLectureInstructorName(course.instructor_id),
    lecture_count: getLectureCount(course.id),
    enrolled: isEnrolled(userId, course.id),
    progress_percent: getCourseProgress(userId, course.id),
    completed_lectures: getCompletedLectureCount(userId, course.id),
    thumbnail_palette: getCourseThumbnailPalette(course),
    rating: getCourseRating(course),
    student_count: getCourseStudentCount(course.id),
    total_duration_minutes: getCourseTotalDurationMinutes(course.id),
  };
}
