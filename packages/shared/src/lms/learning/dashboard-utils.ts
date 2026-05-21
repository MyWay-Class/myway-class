import {
  demoCourses,
  demoLectures,
} from '../../data/demo-data';
import type { DashboardActivity, DashboardStat } from '../../types';

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function getCourseTitle(courseId: string): string {
  return demoCourses.find((course) => course.id === courseId)?.title ?? '알 수 없는 강의';
}

export function getLectureTitle(lectureId: string): string {
  return demoLectures.find((lecture) => lecture.id === lectureId)?.title ?? '알 수 없는 강의';
}

export function getActivityTone(type: DashboardActivity['type']): DashboardStat['tone'] {
  if (type === 'enrollment') return 'emerald';
  if (type === 'lecture_complete') return 'indigo';
  if (type === 'material' || type === 'notice') return 'violet';
  if (type === 'insight') return 'amber';
  return 'slate';
}

export function getActivityIcon(type: DashboardActivity['type']): string {
  if (type === 'enrollment') return 'ri-book-open-line';
  if (type === 'lecture_complete') return 'ri-check-double-line';
  if (type === 'ai_summary') return 'ri-file-text-line';
  if (type === 'quiz') return 'ri-question-line';
  if (type === 'shortform') return 'ri-scissors-cut-line';
  if (type === 'material') return 'ri-folder-3-line';
  if (type === 'notice') return 'ri-megaphone-line';
  if (type === 'insight') return 'ri-lightbulb-flash-line';
  return 'ri-chat-3-line';
}

export function createActivity(input: Omit<DashboardActivity, 'icon' | 'tone'> & { type: DashboardActivity['type'] }): DashboardActivity {
  return {
    ...input,
    icon: getActivityIcon(input.type),
    tone: getActivityTone(input.type),
  };
}

export function stat(id: string, label: string, value: string, hint: string, icon: string, tone: DashboardStat['tone']): DashboardStat {
  return { id, label, value, hint, icon, tone };
}
