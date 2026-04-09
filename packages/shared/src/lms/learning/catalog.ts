import { demoCourses, demoLectureProgress, demoLectures } from '../../data/demo-data';
import type { CourseCard, CourseDetail, LectureDetail } from '../../types';
import {
  createCourseCard,
  getCourseLectures,
  getLectureInstructorName,
  getLectureKeywords,
  getLectureTranscriptExcerpt,
  getLectureVideoUrl,
} from './helpers';
import { getCourseMaterials } from './content';
import { getCourseNotices } from './content';

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
    materials: getCourseMaterials(courseId),
    notices: getCourseNotices(courseId),
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
    video_url: getLectureVideoUrl(lecture.id),
    transcript_excerpt: getLectureTranscriptExcerpt(lecture),
    keywords: getLectureKeywords(lecture),
  };
}
