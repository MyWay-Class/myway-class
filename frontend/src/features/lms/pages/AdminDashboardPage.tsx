import type { AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';
import { demoCourses, demoDashboard, demoInsights, demoUsers } from '../data/demo';

type AdminDashboardPageProps = {
  dashboard: Dashboard | null;
  users: AuthUser[];
  courses: CourseCard[];
  insights: AIInsights | null;
};

function countByRole(users: AuthUser[]) {
  return {
    ADMIN: users.filter((user) => user.role === 'ADMIN').length,
    INSTRUCTOR: users.filter((user) => user.role === 'INSTRUCTOR').length,
    STUDENT: users.filter((user) => user.role === 'STUDENT').length,
  };
}

function formatProgress(value: number): string {
  return `${Math.round(value)}%`;
}

export function AdminDashboardPage({ dashboard, users, courses, insights }: AdminDashboardPageProps) {
  const resolvedDashboard = dashboard ?? demoDashboard;
  const resolvedUsers = users.length > 0 ? users : demoUsers;
  const resolvedCourses = courses.length > 0 ? courses : demoCourses;
  const resolvedInsights = insights ?? demoInsights;
  const roleCounts = countByRole(resolvedUsers);
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <i className="ri-shield-star-line" />
              Admin Dashboard
            </div>
            <h2 className="mt-4 text-[24px] font-bold text-slate-900 lg:text-[28px]">운영 관리자 대시보드</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
              {resolvedDashboard.next_action ?? '운영 통계와 AI 사용량을 확인하고 병목이 생긴 코스를 점검하세요.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">역할 분포</div>
            <div className="mt-4 space-y-3">
              {[
                { label: '운영자', count: roleCounts.ADMIN, color: 'bg-amber-400' },
                { label: '교강사', count: roleCounts.INSTRUCTOR, color: 'bg-emerald-400' },
                { label: '수강생', count: roleCounts.STUDENT, color: 'bg-cyan-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${Math.max((item.count / Math.max(resolvedUsers.length, 1)) * 100, item.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-[12px] font-semibold text-slate-700">
                    {item.label}
                    <span className="ml-1 text-slate-400">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DashboardStatsGrid stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <DashboardTimeline
            title="최근 활동"
            subtitle="운영 등록, 수강 흐름, AI 사용 현황을 시간순으로 확인합니다."
            activities={activities}
            emptyMessage="아직 최근 활동이 없습니다. 수강 등록이나 AI 요청이 발생하면 여기에 표시됩니다."
          />

          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">운영 핵심 수치</h3>
                <p className="mt-1 text-[12px] text-slate-500">사용자와 강의의 기본 규모를 운영 흐름에 맞게 정리합니다.</p>
              </div>
              <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">{resolvedUsers.length}명</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold text-slate-400">전체 사용자</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">{resolvedUsers.length}</div>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold text-slate-400">전체 강의</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">{resolvedCourses.length}</div>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold text-slate-400">활성 수강</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">{resolvedDashboard.active_enrollments ?? 0}</div>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold text-slate-400">AI 요청</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">{resolvedInsights.summary.total_requests ?? 0}</div>
              </article>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-team-line text-cyan-700" />
              최근 사용자
            </h3>
            <div className="mt-4 space-y-2">
              {resolvedUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-[13px] font-bold text-cyan-700">
                    {user.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-900">{user.name}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{user.department}</div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-700">{user.role}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-pie-chart-2-line text-cyan-700" />
              역할 비율
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { label: '운영자', count: roleCounts.ADMIN, tone: 'bg-amber-500' },
                { label: '교강사', count: roleCounts.INSTRUCTOR, tone: 'bg-emerald-500' },
                { label: '수강생', count: roleCounts.STUDENT, tone: 'bg-cyan-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
                    <span>{item.label}</span>
                    <span>{item.count}명</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.tone}`}
                      style={{ width: `${Math.max((item.count / Math.max(resolvedUsers.length, 1)) * 100, item.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {resolvedInsights ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <i className="ri-lightbulb-flash-line text-cyan-700" />
                AI 인사이트
              </h3>
              <p className="mt-3 text-[13px] leading-6 text-slate-500">
                최근 {resolvedInsights.summary.recent_window_days}일 동안 AI 요청 {resolvedInsights.summary.total_requests}회, 성공률 {formatProgress(resolvedInsights.summary.success_rate)}입니다.
              </p>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
