import type { AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';

type AdminDashboardPageProps = {
  dashboard: Dashboard | null;
  users: AuthUser[];
  courses: CourseCard[];
  insights: AIInsights | null;
};

export function AdminDashboardPage({ dashboard, users, courses, insights }: AdminDashboardPageProps) {
  return (
    <div className="space-y-5">
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
