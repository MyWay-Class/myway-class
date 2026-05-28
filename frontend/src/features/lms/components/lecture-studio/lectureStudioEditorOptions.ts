import type {
  LectureStudioAssignmentMode,
  LectureStudioAudience,
  LectureStudioDeliveryMode,
  LectureStudioExamMode,
  LectureStudioPace,
  LectureStudioQuizMode,
} from './types';

export const deliveryModes: Array<{ value: LectureStudioDeliveryMode; label: string; hint: string }> = [
  { value: 'online', label: '온라인', hint: '화상 강의 중심' },
  { value: 'offline', label: '오프라인', hint: '교실 운영' },
  { value: 'hybrid', label: '혼합형', hint: '온라인 + 오프라인 병행' },
];

export const audienceOptions: Array<{ value: LectureStudioAudience; label: string; hint: string }> = [
  { value: 'beginner', label: '입문', hint: '기초 개념 중심' },
  { value: 'intermediate', label: '중급', hint: '실습과 응용 포함' },
  { value: 'advanced', label: '심화', hint: '프로젝트와 토론 중심' },
];

export const paceOptions: Array<{ value: LectureStudioPace; label: string; hint: string }> = [
  { value: 'weekly', label: '주차형', hint: '정규 커리큘럼' },
  { value: 'bootcamp', label: '집중형', hint: '짧고 빠른 몰입형' },
  { value: 'self-paced', label: '자율형', hint: '개별 진도 허용' },
];

export const assignmentModes: Array<{ value: LectureStudioAssignmentMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '과제 없이 운영' },
  { value: 'light', label: '가벼운 과제', hint: '복습용 제출' },
  { value: 'project', label: '프로젝트형', hint: '결과물 중심' },
];

export const examModes: Array<{ value: LectureStudioExamMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '시험 미운영' },
  { value: 'quiz-only', label: '퀴즈형', hint: '중간 점검 중심' },
  { value: 'midterm-final', label: '중간/기말', hint: '정식 평가 운영' },
];

export const quizModes: Array<{ value: LectureStudioQuizMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '퀴즈 미운영' },
  { value: 'manual', label: '수동', hint: '직접 작성' },
  { value: 'auto', label: '자동', hint: 'AI가 생성' },
  { value: 'mixed', label: '혼합', hint: '수동 + 자동 병행' },
];
