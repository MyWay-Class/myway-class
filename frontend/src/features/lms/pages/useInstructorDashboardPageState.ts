import type { AIInsights, CourseCard, Dashboard } from '@myway/shared';

type InstructorDashboardPageStateArgs = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  insights: AIInsights | null;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function useInstructorDashboardPageState({ dashboard, courses, insights }: InstructorDashboardPageStateArgs) {
  const avgProgress = Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const managedCount = courses.length;
  const activeCount = courses.filter((course) => course.progress_percent > 0 && course.progress_percent < 100).length;
  const stats =
    dashboard?.stats ?? [
      {
        id: 'courses',
        label: '개설 강의',
        value: String(managedCount),
        hint: '운영 중인 코스 수',
        icon: 'ri-book-shelf-line',
        tone: 'indigo' as const,
      },
      {
        id: 'materials',
        label: '자료 업로드',
        value: String(courses.length * 2),
        hint: '자료와 실습 콘텐츠를 확장하세요',
        icon: 'ri-folder-3-line',
        tone: 'emerald' as const,
      },
      {
        id: 'progress',
        label: '평균 진도',
        value: `${avgProgress}%`,
        hint: '강의별 진도 평균',
        icon: 'ri-line-chart-line',
        tone: 'violet' as const,
      },
      {
        id: 'ai',
        label: 'AI 요청',
        value: String(insights?.summary.total_requests ?? 0),
        hint: '강의 보조 기능 사용량',
        icon: 'ri-robot-line',
        tone: 'amber' as const,
      },
    ];
  const activities = dashboard?.recent_activities ?? [];
  const nextAction = dashboard?.next_action ?? '최근 업로드 자료와 공지를 확인하고 학생 진도 변화를 점검하세요.';

  return {
    avgProgress,
    managedCount,
    activeCount,
    stats,
    activities,
    nextAction,
    formatDuration,
  };
}
