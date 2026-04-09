import type { AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';

type AdminDashboardPageProps = {
  dashboard: Dashboard | null;
  users: AuthUser[];
  courses: CourseCard[];
  insights: AIInsights | null;
};

export function AdminDashboardPage({ dashboard, users, courses, insights }: AdminDashboardPageProps) {
  const stats =
    dashboard?.stats ?? [
      {
        id: 'users',
        label: '전체 사용자',
        value: String(users.length),
        hint: '운영 중인 학습자와 관리자',
        icon: 'ri-team-line',
        tone: 'indigo' as const,
      },
      {
        id: 'courses',
        label: '전체 강의',
        value: String(courses.length),
        hint: '시스템에 등록된 강의 수',
        icon: 'ri-book-shelf-line',
        tone: 'emerald' as const,
      },
      {
        id: 'enrollments',
        label: '활성 수강',
        value: String(dashboard?.active_enrollments ?? 0),
        hint: '현재 활성 상태의 수강 등록',
        icon: 'ri-user-follow-line',
        tone: 'violet' as const,
      },
      {
        id: 'ai',
        label: 'AI 요청',
        value: String(insights?.summary.total_requests ?? 0),
        hint: '최근 AI 사용량',
        icon: 'ri-robot-line',
        tone: 'amber' as const,
      },
    ];
  const activities = dashboard?.recent_activities ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-200">Admin Dashboard</div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.04em]">운영 현황과 최근 학습 흐름을 함께 확인합니다.</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">
              {dashboard?.next_action ?? '운영 통계와 AI 사용량을 확인하고 병목이 생긴 코스를 점검하세요.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">{dashboard?.learner_name ?? '운영자'}</div>
            <div className="mt-1">{dashboard?.role ?? 'ADMIN'}</div>
          </div>
        </div>
      </section>

      <DashboardStatsGrid stats={stats} />

      <DashboardTimeline
        title="최근 활동"
        subtitle="운영 등록, 수강 흐름, AI 사용 현황을 시간순으로 확인합니다."
        activities={activities}
        emptyMessage="아직 최근 활동이 없습니다. 수강 등록이나 AI 요청이 발생하면 여기에 표시됩니다."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{users.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">전체 사용자</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{courses.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">전체 강의</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{dashboard?.active_enrollments ?? 0}</div>
          <div className="mt-1 text-[12px] text-slate-500">활성 수강</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.total_requests ?? 0}</div>
          <div className="mt-1 text-[12px] text-slate-500">AI 요청 수</div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">운영 개요</h2>
        <p className="mt-3 text-[13px] leading-7 text-slate-500">
          운영자는 이 화면에서 전체 사용자, 강의, 활성 수강, AI 사용량을 빠르게 확인하고 상세 운영 화면으로 이동할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
