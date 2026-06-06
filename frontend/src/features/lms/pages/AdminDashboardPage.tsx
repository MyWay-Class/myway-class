import type { AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';
import { demoCourses, demoDashboard, demoInsights, demoUsers } from '../data/demo';
import { DashboardHero } from './DashboardPageSections';
import {
  AdminDashboardCoursesSection,
  AdminDashboardInsightsSection,
  AdminDashboardOverviewSection,
  AdminDashboardUsersSection,
} from './AdminDashboardPageSections';

type AdminDashboardPageProps = {
  dashboard: Dashboard | null;
  users: AuthUser[];
  courses: CourseCard[];
  insights: AIInsights | null;
};

export function AdminDashboardPage({ dashboard, users, courses, insights }: AdminDashboardPageProps) {
  const resolvedDashboard = dashboard ?? demoDashboard;
  const resolvedUsers = users.length > 0 ? users : demoUsers;
  const resolvedCourses = courses.length > 0 ? courses : demoCourses;
  const resolvedInsights = insights ?? demoInsights;
  const stats =
    resolvedDashboard.stats ?? [
      {
        id: 'enrollments',
        label: '활성 수강',
        value: String(resolvedDashboard.active_enrollments ?? 0),
        hint: '현재 운영 중인 수강 등록',
        icon: 'ri-user-follow-line',
        tone: 'emerald' as const,
      },
      {
        id: 'ai',
        label: 'AI 요청',
        value: String(resolvedInsights.summary.total_requests ?? 0),
        hint: '최근 AI 사용량',
        icon: 'ri-robot-line',
        tone: 'violet' as const,
      },
      {
        id: 'courses',
        label: '전체 강의',
        value: String(resolvedCourses.length),
        hint: '시스템에 등록된 강의 수',
        icon: 'ri-book-shelf-line',
        tone: 'amber' as const,
      },
      {
        id: 'users',
        label: '전체 사용자',
        value: String(resolvedUsers.length),
        hint: '운영 중인 학습자와 관리자',
        icon: 'ri-team-line',
        tone: 'indigo' as const,
      },
    ];
  const activities = resolvedDashboard.recent_activities ?? [];
  return (
    <div className="space-y-6">
      <DashboardHero
        badge="관리자 대시보드"
        title="운영 관리자 대시보드"
        description={resolvedDashboard.next_action ?? '운영 통계와 AI 사용량을 확인하고 병목이 생긴 코스를 점검하세요.'}
        summaryLabel="역할 분포"
        summaryValue={`운영자 ${resolvedUsers.filter((user) => user.role === 'ADMIN').length} · 강사 ${resolvedUsers.filter((user) => user.role === 'INSTRUCTOR').length} · 학생 ${resolvedUsers.filter((user) => user.role === 'STUDENT').length}`}
        icon="ri-shield-star-line"
        secondaryLabel="전체 강의"
        secondaryValue={`${resolvedCourses.length}개`}
        footerLabel="AI 요청"
        footerValue={`${resolvedInsights.summary.total_requests}회`}
      />

      <DashboardStatsGrid stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <DashboardTimeline
            title="최근 활동"
            subtitle="운영 등록, 수강 흐름, AI 사용 현황을 시간순으로 확인합니다."
            activities={activities}
            emptyMessage="아직 최근 활동이 없습니다. 수강 등록이나 AI 요청이 발생하면 여기에 표시됩니다."
          />
          <AdminDashboardOverviewSection users={resolvedUsers} courses={resolvedCourses} dashboard={resolvedDashboard} insights={resolvedInsights} />
        </div>

        <div className="space-y-6">
          <AdminDashboardUsersSection users={resolvedUsers} />
          <AdminDashboardCoursesSection courses={resolvedCourses} />
          <AdminDashboardInsightsSection insights={resolvedInsights} />
        </div>
      </section>
    </div>
  );
}
