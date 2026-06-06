import type { AuthUser, CourseCard, Dashboard } from '@myway/shared';
import type { AIInsights } from '@myway/shared';

export function AdminDashboardOverviewSection({
  users,
  courses,
  dashboard,
  insights,
}: {
  users: AuthUser[];
  courses: CourseCard[];
  dashboard: Dashboard;
  insights: AIInsights;
}) {
  return (
    <section className="rounded-2xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">운영 핵심 수치</h3>
          <p className="mt-1 text-[12px] text-slate-500">사용자와 강의의 기본 규모를 운영 흐름에 맞게 정리합니다.</p>
        </div>
        <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">{users.length}명</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="전체 사용자" value={users.length} />
        <MetricCard label="전체 강의" value={courses.length} />
        <MetricCard label="활성 수강" value={dashboard.active_enrollments ?? 0} />
        <MetricCard label="AI 요청" value={insights.summary.total_requests ?? 0} />
      </div>
    </section>
  );
}

export function AdminDashboardUsersSection({ users }: { users: AuthUser[] }) {
  return (
    <section className="rounded-2xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-team-line text-cyan-700" />
        최근 사용자
      </h3>
      <div className="mt-4 space-y-2">
        {users.slice(0, 5).map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-[#dce9f7] bg-[#f4faff] px-4 py-3">
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
  );
}

export function AdminDashboardCoursesSection({ courses }: { courses: CourseCard[] }) {
  const lowProgressCourses = [...courses].sort((left, right) => left.progress_percent - right.progress_percent).slice(0, 3);

  return (
    <section className="rounded-2xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-alert-line text-cyan-700" />
        집중 관리 코스
      </h3>
      <div className="mt-4 space-y-3">
        {lowProgressCourses.map((course) => (
          <div key={course.id}>
            <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
              <span className="truncate">{course.title}</span>
              <span>{course.progress_percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(course.progress_percent, 6)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminDashboardInsightsSection({ insights }: { insights: AIInsights }) {
  return (
    <section className="rounded-2xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-lightbulb-flash-line text-cyan-700" />
        AI 인사이트
      </h3>
      <p className="mt-3 text-[13px] leading-6 text-slate-500">
        최근 {insights.summary.recent_window_days}일 동안 AI 요청 {insights.summary.total_requests}회, 성공률 {Math.round(insights.summary.success_rate)}%입니다.
      </p>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[#dce9f7] bg-[#f4faff] px-4 py-4">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">{value}</div>
    </article>
  );
}
