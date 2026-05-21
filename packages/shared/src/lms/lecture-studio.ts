import type { CourseDetail, Lecture, UserRole } from '../types';

export type LectureStudioDraftStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';
export type LectureStudioDeliveryMode = 'online' | 'offline' | 'hybrid';
export type LectureStudioAudience = 'beginner' | 'intermediate' | 'advanced';
export type LectureStudioPace = 'weekly' | 'bootcamp' | 'self-paced';
export type LectureStudioAssignmentMode = 'none' | 'light' | 'project';
export type LectureStudioExamMode = 'none' | 'quiz-only' | 'midterm-final';
export type LectureStudioQuizMode = 'none' | 'manual' | 'auto' | 'mixed';

export type LectureStudioDraftInput = {
  lecture_id?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  difficulty?: string;
  audience?: LectureStudioAudience;
  delivery_mode?: LectureStudioDeliveryMode;
  class_size?: number;
  classroom?: string;
  online_room?: string;
  pace?: LectureStudioPace;
  learning_goal?: string;
  summary?: string;
  prerequisites?: string;
  outline_text?: string;
  materials_text?: string;
  assignment_mode?: LectureStudioAssignmentMode;
  assignment_due?: string;
  assignment_weight?: number;
  assignment_notes?: string;
  exam_mode?: LectureStudioExamMode;
  exam_scope?: string;
  quiz_mode?: LectureStudioQuizMode;
  quiz_count?: number;
  quiz_difficulty?: string;
  attendance_required?: boolean;
  recording_enabled?: boolean;
  office_hours?: string;
  ai_summary_enabled?: boolean;
  ai_timestamp_enabled?: boolean;
  ai_shortform_enabled?: boolean;
};

export type LectureStudioDraftRecord = {
  id: string;
  course_id: string;
  course_title: string;
  lecture_id: string;
  lecture_title: string;
  instructor_id: string;
  instructor_name: string;
  status: LectureStudioDraftStatus;
  title: string;
  subtitle: string;
  category: string;
  difficulty: string;
  audience: LectureStudioAudience;
  delivery_mode: LectureStudioDeliveryMode;
  class_size: number;
  classroom: string;
  online_room: string;
  pace: LectureStudioPace;
  learning_goal: string;
  summary: string;
  prerequisites: string;
  outline: string[];
  materials: string[];
  assignment_mode: LectureStudioAssignmentMode;
  assignment_due: string;
  assignment_weight: number;
  assignment_notes: string;
  exam_mode: LectureStudioExamMode;
  exam_scope: string;
  quiz_mode: LectureStudioQuizMode;
  quiz_count: number;
  quiz_difficulty: string;
  attendance_required: boolean;
  recording_enabled: boolean;
  office_hours: string;
  ai_summary_enabled: boolean;
  ai_timestamp_enabled: boolean;
  ai_shortform_enabled: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
};

export type LectureStudioDraftSummary = Pick<
  LectureStudioDraftRecord,
  'id' | 'course_id' | 'course_title' | 'lecture_id' | 'lecture_title' | 'status' | 'title' | 'updated_at' | 'published_at'
>;

const demoLectureStudioDrafts: LectureStudioDraftRecord[] = [];

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${String(demoLectureStudioDrafts.length + 1).padStart(3, '0')}`;
}

function splitLines(value?: string): string[] {
  return value
    ?.split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function firstLectureTitle(course: CourseDetail): string {
  return course.lectures[0]?.title ?? course.title;
}

type LectureLike = Pick<Lecture, 'id' | 'title'>;

function normalizeDraft(
  course: CourseDetail,
  lecture: LectureLike,
  input: LectureStudioDraftInput,
  instructorName: string,
  existing?: LectureStudioDraftRecord,
): LectureStudioDraftRecord {
  const createdAt = existing?.created_at ?? now();
  const updatedAt = now();

  return {
    id: existing?.id ?? createId('lsd'),
    course_id: course.id,
    course_title: course.title,
    lecture_id: lecture.id,
    lecture_title: lecture.title,
    instructor_id: course.instructor_id,
    instructor_name: instructorName,
    status: existing?.status ?? 'DRAFT',
    title: input.title?.trim() || existing?.title || course.title,
    subtitle: input.subtitle?.trim() || existing?.subtitle || course.description,
    category: input.category?.trim() || existing?.category || course.category,
    difficulty: input.difficulty?.trim() || existing?.difficulty || course.difficulty,
    audience: input.audience ?? existing?.audience ?? 'intermediate',
    delivery_mode: input.delivery_mode ?? existing?.delivery_mode ?? 'hybrid',
    class_size: Number(input.class_size ?? existing?.class_size ?? 30),
    classroom: input.classroom?.trim() || existing?.classroom || `${course.category} 강의실`,
    online_room: input.online_room?.trim() || existing?.online_room || 'Zoom / Google Meet',
    pace: input.pace ?? existing?.pace ?? 'weekly',
    learning_goal: input.learning_goal?.trim() || existing?.learning_goal || `${firstLectureTitle(course)}의 핵심 개념을 이해합니다.`,
    summary: input.summary?.trim() || existing?.summary || course.description,
    prerequisites: input.prerequisites?.trim() || existing?.prerequisites || `${course.category} 기초 개념`,
    outline: splitLines(input.outline_text).length > 0 ? splitLines(input.outline_text) : existing?.outline ?? course.lectures.slice(0, 5).map((item) => `${item.order_index + 1}. ${item.title}`),
    materials: splitLines(input.materials_text).length > 0 ? splitLines(input.materials_text) : existing?.materials ?? course.materials.slice(0, 4).map((item) => `${item.title} — ${item.summary}`),
    assignment_mode: input.assignment_mode ?? existing?.assignment_mode ?? 'light',
    assignment_due: input.assignment_due?.trim() || existing?.assignment_due || '매주 1회',
    assignment_weight: Number(input.assignment_weight ?? existing?.assignment_weight ?? 20),
    assignment_notes: input.assignment_notes?.trim() || existing?.assignment_notes || '실습 제출물과 피드백 기준을 함께 안내하세요.',
    exam_mode: input.exam_mode ?? existing?.exam_mode ?? 'quiz-only',
    exam_scope: input.exam_scope?.trim() || existing?.exam_scope || '중간 점검 퀴즈 + 기말 점검',
    quiz_mode: input.quiz_mode ?? existing?.quiz_mode ?? 'mixed',
    quiz_count: Number(input.quiz_count ?? existing?.quiz_count ?? 5),
    quiz_difficulty: input.quiz_difficulty?.trim() || existing?.quiz_difficulty || '중급',
    attendance_required: Boolean(input.attendance_required ?? existing?.attendance_required ?? true),
    recording_enabled: Boolean(input.recording_enabled ?? existing?.recording_enabled ?? true),
    office_hours: input.office_hours?.trim() || existing?.office_hours || '매주 금요일 15:00 - 16:00',
    ai_summary_enabled: Boolean(input.ai_summary_enabled ?? existing?.ai_summary_enabled ?? true),
    ai_timestamp_enabled: Boolean(input.ai_timestamp_enabled ?? existing?.ai_timestamp_enabled ?? true),
    ai_shortform_enabled: Boolean(input.ai_shortform_enabled ?? existing?.ai_shortform_enabled ?? true),
    published_at: existing?.published_at,
    created_at: createdAt,
    updated_at: updatedAt,
    version: (existing?.version ?? 0) + 1,
  };
}

export function listLectureStudioDrafts(courseId?: string): LectureStudioDraftSummary[] {
  return demoLectureStudioDrafts
    .filter((item) => (courseId ? item.course_id === courseId : true))
    .map(({ id, course_id, course_title, lecture_id, lecture_title, status, title, updated_at, published_at }) => ({
      id,
      course_id,
      course_title,
      lecture_id,
      lecture_title,
      status,
      title,
      updated_at,
      published_at,
    }));
}

export function getLectureStudioDraft(draftId: string): LectureStudioDraftRecord | undefined {
  return demoLectureStudioDrafts.find((item) => item.id === draftId);
}

export function saveLectureStudioDraft(
  course: CourseDetail,
  lecture: LectureLike,
  instructorName: string,
  input: LectureStudioDraftInput,
): LectureStudioDraftRecord {
  const existing = input.lecture_id
    ? demoLectureStudioDrafts.find((item) => item.course_id === course.id && item.lecture_id === input.lecture_id)
    : demoLectureStudioDrafts.find((item) => item.course_id === course.id && item.lecture_id === lecture.id);

  const record = normalizeDraft(course, lecture, input, instructorName, existing);
  if (existing) {
    Object.assign(existing, record);
    return existing;
  }

  demoLectureStudioDrafts.push(record);
  return record;
}

export function updateLectureStudioDraft(
  draftId: string,
  course: CourseDetail,
  lecture: LectureLike,
  instructorName: string,
  input: LectureStudioDraftInput,
): LectureStudioDraftRecord | null {
  const existing = getLectureStudioDraft(draftId);
  if (!existing) {
    return null;
  }

  const record = normalizeDraft(course, lecture, input, instructorName, existing);
  Object.assign(existing, record);
  return existing;
}

export function publishLectureStudioDraft(draftId: string): LectureStudioDraftRecord | null {
  const existing = getLectureStudioDraft(draftId);
  if (!existing) {
    return null;
  }

  existing.status = 'PUBLISHED';
  existing.published_at = now();
  existing.updated_at = now();
  existing.version += 1;
  return existing;
}

export function lectureStudioRequiresInstructor(role?: UserRole): boolean {
  return role === 'INSTRUCTOR' || role === 'ADMIN';
}
