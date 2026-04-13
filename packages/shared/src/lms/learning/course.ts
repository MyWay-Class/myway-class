import { demoAudioExtractions, demoEnrollments, demoLectureProgress, demoLectureTranscripts, demoLectures, getDemoUser, instructorNames } from '../../data/demo-data';
import type { Course, CourseCard, CourseThumbnailPalette, Lecture } from '../../types';

export function getLectureInstructorName(instructorId: string): string {
  return getDemoUser(instructorId)?.name ?? instructorNames[instructorId] ?? '알 수 없는 강사';
}

export function getCourseLectures(courseId: string): Lecture[] {
  return demoLectures
    .filter((lecture) => lecture.course_id === courseId)
    .sort((a, b) => {
      const weekA = a.week_number ?? 0;
      const weekB = b.week_number ?? 0;
      if (weekA !== weekB) {
        return weekA - weekB;
      }

      const sessionA = a.session_number ?? a.order_index + 1;
      const sessionB = b.session_number ?? b.order_index + 1;
      if (sessionA !== sessionB) {
        return sessionA - sessionB;
      }

      return a.order_index - b.order_index;
  });
}

export function getLectureDisplayDurationMinutes(lecture: Pick<Lecture, 'duration_minutes'> & Partial<Lecture>): number {
  if (lecture.id) {
    const transcript = demoLectureTranscripts.find((item) => item.lecture_id === lecture.id);
    if (transcript?.duration_ms) {
      return Math.max(1, Math.ceil(transcript.duration_ms / 60_000));
    }
  }

  const extraction = lecture.id ? demoAudioExtractions.find((item) => item.lecture_id === lecture.id && item.audio_duration_ms > 0) : undefined;
  if (extraction?.audio_duration_ms) {
    return Math.max(1, Math.ceil(extraction.audio_duration_ms / 60_000));
  }

  return lecture.duration_minutes;
}

export function getLectureDurationMinutes(lecture: Lecture): number {
  return getLectureDisplayDurationMinutes(lecture);
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
  return getCourseLectures(courseId).reduce((sum, lecture) => sum + getLectureDisplayDurationMinutes(lecture), 0);
}

export function getLectureKeywords(lecture: Lecture): string[] {
  const keywordMap: Record<string, string[]> = {
    lec_ai_001: ['AI', '개념', '머신러닝', '딥러닝'],
    lec_ai_002: ['학습 데이터', '라벨링', '검증', '모델'],
    lec_ai_003: ['서비스 흐름', '데이터', '배포', '운영'],
    lec_econ_seed_001: ['경제', '희소성', '선택', '기회비용'],
    lec_econ_seed_002: ['수요', '공급', '균형', '가격'],
    lec_econ_seed_003: ['경기', '정책', '금융', '순환'],
    lec_eng_seed_001: ['영어', '인사', '자기소개', '회화'],
    lec_java_seed_001: ['Java', '변수', '자료형', '출력'],
    lec_java_seed_002: ['조건문', '반복문', '배열', '문법'],
    lec_java_seed_003: ['클래스', '객체', '상속', '객체지향'],
    lec_python_seed_001: ['Python', '변수', '리스트', '조건문'],
    lec_python_seed_002: ['함수', '모듈', '예외 처리', '구조화'],
    lec_python_seed_003: ['파일 처리', '자동화', '실무 활용', '스크립트'],
    lec_cert_seed_001: ['자격증', '학습 전략', '출제 패턴', '루틴'],
  };

  return keywordMap[lecture.id] ?? lecture.content_text.split(/[\s,·]+/).filter(Boolean).slice(0, 4);
}

export function getLectureTranscriptExcerpt(lecture: Lecture): string {
  return lecture.content_text;
}

export function getLectureVideoUrl(lecture: Lecture): string {
  return lecture.video_url ?? '';
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
