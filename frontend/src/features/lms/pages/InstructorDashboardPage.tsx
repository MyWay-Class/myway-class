import type { AIInsights, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardHero } from './DashboardPageSections';
import {
  InstructorDashboardCoursesSection,
  InstructorDashboardInsightsSection,
  InstructorDashboardTimelineSection,
  InstructorDashboardToolsPanel,
} from './InstructorDashboardPageSections';
import { useInstructorDashboardPageState } from './useInstructorDashboardPageState';

type InstructorDashboardPageProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  insights: AIInsights | null;
};

export function InstructorDashboardPage({ dashboard, courses, insights }: InstructorDashboardPageProps) {
  const { avgProgress, managedCount, activeCount, stats, activities, nextAction, formatDuration } = useInstructorDashboardPageState({
    dashboard,
    courses,
    insights,
  });

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="강사 대시보드"
        title="강의 운영 대시보드"
        description={nextAction}
        summaryLabel="운영 상태"
        summaryValue={`${managedCount}개 강의`}
        icon="ri-presentation-line"
        secondaryLabel="진행 중"
        secondaryValue={`${activeCount}개`}
        footerLabel="평균 진도"
        footerValue={`${avgProgress}%`}
      />

      <DashboardStatsGrid stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <InstructorDashboardTimelineSection
            activities={activities}
            emptyMessage="아직 최근 활동이 없습니다. 자료 업로드나 공지 등록이 여기에 표시됩니다."
          />

          <InstructorDashboardCoursesSection courses={courses} formatDuration={formatDuration} />
        </div>

        <div className="space-y-6">
          <InstructorDashboardToolsPanel />
          <InstructorDashboardInsightsSection insights={insights} />
        </div>
      </section>
    </div>
  );
}
