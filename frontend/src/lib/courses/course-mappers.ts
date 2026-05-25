import type { CourseDetail, Lecture } from '@myway/shared';

const COURSE_ID_ALIASES: Record<string, string> = {
  crs_demo_ai: 'crs_react_01',
  crs_demo_data: 'crs_java_01',
};

const LECTURE_ID_ALIASES: Record<string, string> = {
  lec_ai_001: 'lec_react_01',
  lec_ai_seed_001: 'lec_react_01',
  lec_demo_ai_1: 'lec_react_01',
  lec_demo_ai_2: 'lec_react_02',
};

export function normalizeCourseId(courseId: string): string {
  return COURSE_ID_ALIASES[courseId] ?? courseId;
}

export function normalizeLectureId(lectureId: string): string {
  return LECTURE_ID_ALIASES[lectureId] ?? lectureId;
}

export function normalizeLectureVideoFields(lecture: Lecture, fallbackLecture?: Lecture): Lecture {
  return {
    ...fallbackLecture,
    ...lecture,
    video_url: lecture.video_url ?? fallbackLecture?.video_url,
    video_asset_key: lecture.video_asset_key ?? fallbackLecture?.video_asset_key,
  };
}

export function mergeCourseDetailWithFallback(primary: CourseDetail, fallback: CourseDetail | null | undefined): CourseDetail {
  if (!fallback) {
    return primary;
  }

  const fallbackLectureMap = new Map(fallback.lectures.map((lecture) => [lecture.id, lecture]));
  const mergedLectures = primary.lectures.map((lecture) => normalizeLectureVideoFields(lecture, fallbackLectureMap.get(lecture.id)));

  return {
    ...fallback,
    ...primary,
    lectures: mergedLectures,
    materials: Array.isArray(primary.materials) ? primary.materials : fallback.materials,
    notices: Array.isArray(primary.notices) ? primary.notices : fallback.notices,
  };
}
