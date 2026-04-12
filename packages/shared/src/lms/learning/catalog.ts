import { demoCourses, demoLectureProgress, demoLectures } from '../../data/courses';
import { demoMaterials, demoNotices } from '../../data/media';
import type { Course, CourseCard, CourseCreateRequest, CourseDetail, Lecture, LectureDetail, Material, Notice } from '../../types';
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

  const completedLectureIds = new Set(
    demoLectureProgress
      .filter((progress) => progress.user_id === userId && progress.is_completed)
      .map((progress) => progress.lecture_id),
  );

  return {
    ...createCourseCard(course, userId),
    lectures: getCourseLectures(courseId).map((lecture) => ({
      ...lecture,
      is_completed: completedLectureIds.has(lecture.id),
    })),
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

function createCourseId(): string {
  return `crs_custom_${String(demoCourses.length + 1).padStart(3, '0')}`;
}

function splitLines(value?: string): string[] {
  return value
    ?.split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function buildDefaultLectureContent(course: Course, lectureTitle: string): string {
  return `${course.title}의 ${lectureTitle} 차시에서는 ${course.description}`;
}

export function createCourseRecord(
  instructorId: string,
  input: CourseCreateRequest,
): CourseDetail {
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const lectureTitles = splitLines(input.lecture_titles.join('\n'));
  const normalizedLectureTitles = lectureTitles.length > 0 ? lectureTitles : [title];
  const courseId = createCourseId();
  const lectureBaseCount = demoLectures.length;

  const course: Course = {
    id: courseId,
    instructor_id: instructorId,
    title,
    description,
    category,
    difficulty: input.difficulty,
    is_published: input.is_published ?? true,
    tags: input.tags?.length ? input.tags.map((tag) => tag.trim()).filter(Boolean) : [category],
  };

  const lectures: Lecture[] = normalizedLectureTitles.map((lectureTitle, index) => {
    const lectureNumber = index + 1;
    return {
      id: `lec_custom_${String(lectureBaseCount + index + 1).padStart(3, '0')}`,
      course_id: courseId,
      title: lectureTitle,
      order_index: lectureBaseCount + index,
      week_number: lectureNumber,
      session_number: lectureNumber,
      content_type: 'video',
      content_text: buildDefaultLectureContent(course, lectureTitle),
      duration_minutes: 20 + index * 5,
      is_published: course.is_published,
    };
  });

  const material: Material = {
    id: `mat_custom_${String(demoMaterials.length + 1).padStart(3, '0')}`,
    course_id: courseId,
    title: `${title} 개요 자료`,
    summary: `${title} 강의의 기본 개요와 학습 포인트를 담은 자료입니다.`,
    file_name: `${courseId}-overview.pdf`,
    uploaded_by: instructorId,
    uploaded_at: new Date().toISOString(),
  };

  const notice: Notice = {
    id: `ntc_custom_${String(demoNotices.length + 1).padStart(3, '0')}`,
    course_id: courseId,
    title: `${title} 개설 안내`,
    content: `${title} 강의가 개설되었습니다. 목차와 자료를 확인한 뒤 수업 준비를 진행해 주세요.`,
    pinned: true,
    author_id: instructorId,
    created_at: new Date().toISOString(),
  };

  demoCourses.push(course);
  demoLectures.push(...lectures);
  demoMaterials.push(material);
  demoNotices.push(notice);

  return {
    ...createCourseCard(course, instructorId),
    lectures,
    materials: [material],
    notices: [notice],
  };
}
