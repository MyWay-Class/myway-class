import type { CourseDetail, Lecture, LectureDetail } from '@myway/shared';

export type LectureStudioDeliveryMode = 'online' | 'offline' | 'hybrid';
export type LectureStudioAudience = 'beginner' | 'intermediate' | 'advanced';
export type LectureStudioPace = 'weekly' | 'bootcamp' | 'self-paced';
export type LectureStudioAssignmentMode = 'none' | 'light' | 'project';
export type LectureStudioExamMode = 'none' | 'quiz-only' | 'midterm-final';
export type LectureStudioQuizMode = 'none' | 'manual' | 'auto' | 'mixed';
export type LectureStudioReviewState = 'draft' | 'review' | 'ready';

export type LectureStudioDraft = {
  courseId: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: string;
  audience: LectureStudioAudience;
  deliveryMode: LectureStudioDeliveryMode;
  classSize: number;
  classroom: string;
  onlineRoom: string;
  pace: LectureStudioPace;
  learningGoal: string;
  summary: string;
  prerequisites: string;
  outlineText: string;
  materialsText: string;
  assignmentMode: LectureStudioAssignmentMode;
  assignmentDue: string;
  assignmentWeight: number;
  assignmentNotes: string;
  examMode: LectureStudioExamMode;
  examScope: string;
  quizMode: LectureStudioQuizMode;
  quizCount: number;
  quizDifficulty: string;
  attendanceRequired: boolean;
  recordingEnabled: boolean;
  officeHours: string;
  aiSummaryEnabled: boolean;
  aiTimestampEnabled: boolean;
  aiShortformEnabled: boolean;
  reviewState: LectureStudioReviewState;
};

const DEFAULT_OUTLINE = ['1. 강의 소개', '2. 핵심 개념', '3. 실습', '4. 정리'];
const DEFAULT_MATERIALS = ['강의 노트', '예제 코드', '체크리스트'];

function joinLines(items: string[], fallback: string[]): string {
  const normalized = items.map((item) => item.trim()).filter(Boolean);
  return (normalized.length > 0 ? normalized : fallback).join('\n');
}

export function splitLectureStudioLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildLectureStudioDraft(course: CourseDetail | null, highlightedLecture: LectureDetail | Lecture | null): LectureStudioDraft {
  const baseLecture = highlightedLecture ?? course?.lectures[0] ?? null;
  const lectureTitles = course?.lectures.slice(0, 6).map((lecture) => `${lecture.order_index + 1}. ${lecture.title}`) ?? [];
  const materialTitles = course?.materials.slice(0, 5).map((material) => `${material.title} — ${material.summary}`) ?? [];

  return {
    courseId: course?.id ?? '',
    title: course?.title ?? '새 강의 초안',
    subtitle: course ? `${course.category} · ${course.difficulty}` : '강의를 선택하면 초안이 자동으로 채워집니다.',
    category: course?.category ?? 'AI',
    difficulty: course?.difficulty ?? 'INTERMEDIATE',
    audience: 'intermediate',
    deliveryMode: course ? 'hybrid' : 'online',
    classSize: Math.max(30, course?.student_count ?? 0, 24),
    classroom: course ? `${course.category} 강의실` : 'A-201',
    onlineRoom: 'Zoom / Google Meet',
    pace: 'weekly',
    learningGoal: baseLecture
      ? `${baseLecture.title}의 핵심 개념을 이해하고 실습 흐름까지 연결합니다.`
      : '학습 목표를 입력하세요.',
    summary: course?.description ?? '강의 소개와 제작 의도를 적어두는 자리입니다.',
    prerequisites: course ? `${course.category} 기초 개념 이해` : '수강 전 필요 조건을 적어주세요.',
    outlineText: joinLines(lectureTitles, DEFAULT_OUTLINE),
    materialsText: joinLines(materialTitles, DEFAULT_MATERIALS),
    assignmentMode: course ? 'light' : 'none',
    assignmentDue: '매주 1회',
    assignmentWeight: 20,
    assignmentNotes: '실습 제출물과 피드백 기준을 함께 안내하세요.',
    examMode: 'quiz-only',
    examScope: '중간 점검 퀴즈 + 기말 점검',
    quizMode: 'mixed',
    quizCount: 5,
    quizDifficulty: '중급',
    attendanceRequired: true,
    recordingEnabled: true,
    officeHours: '매주 금요일 15:00 - 16:00',
    aiSummaryEnabled: true,
    aiTimestampEnabled: true,
    aiShortformEnabled: true,
    reviewState: course ? 'review' : 'draft',
  };
}

export function lectureStudioModeLabel(mode: LectureStudioDeliveryMode): string {
  if (mode === 'online') return '온라인';
  if (mode === 'offline') return '오프라인';
  return '혼합형';
}

export function lectureStudioAudienceLabel(audience: LectureStudioAudience): string {
  if (audience === 'beginner') return '입문';
  if (audience === 'advanced') return '심화';
  return '중급';
}

export function lectureStudioAssignmentLabel(mode: LectureStudioAssignmentMode): string {
  if (mode === 'none') return '과제 없음';
  if (mode === 'project') return '프로젝트형 과제';
  return '가벼운 과제';
}

export function lectureStudioQuizLabel(mode: LectureStudioQuizMode): string {
  if (mode === 'none') return '퀴즈 없음';
  if (mode === 'manual') return '수동 생성';
  if (mode === 'auto') return '자동 생성';
  return '혼합 운영';
}
