import type { AILogOverview, AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';

type AdminStatsOverviewCardsProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  users: AuthUser[];
  insights: AIInsights | null;
  aiLogs: AILogOverview | null;
};

export function AdminStatsOverviewCards({ dashboard, courses, users, insights, aiLogs }: AdminStatsOverviewCardsProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const aiSummary = aiLogs?.summary;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{users.length}</div>
        <div className="mt-1 text-[12px] text-slate-500">전체 사용자</div>
      </article>
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{courses.length}</div>
        <div className="mt-1 text-[12px] text-slate-500">전체 강의</div>
      </article>
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{averageProgress}%</div>
        <div className="mt-1 text-[12px] text-slate-500">평균 진도</div>
      </article>
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary?.total_requests ?? insights?.summary.total_requests ?? 0}</div>
        <div className="mt-1 text-[12px] text-slate-500">AI 요청 수</div>
      </article>
    </section>
  );
}
