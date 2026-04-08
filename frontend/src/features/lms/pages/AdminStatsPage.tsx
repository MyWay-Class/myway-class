import type { AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';

type AdminStatsPageProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  users: AuthUser[];
  insights: AIInsights | null;
};

export function AdminStatsPage({ dashboard, courses, users, insights }: AdminStatsPageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));

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
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{averageProgress}%</div>
          <div className="mt-1 text-[12px] text-slate-500">평균 진도</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.total_requests ?? 0}</div>
          <div className="mt-1 text-[12px] text-slate-500">AI 요청 수</div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">운영 현황</h2>
        <p className="mt-3 text-[13px] leading-7 text-slate-500">
          전체 {users.length}명 사용자 중 수강생, 교강사, 운영자가 함께 사용 중이며, 현재 등록된 강의는 {courses.length}개입니다.
          평균 학습 진도는 {averageProgress}%이고, 최근 AI 기능 호출 수는 {insights?.summary.total_requests ?? 0}회입니다.
        </p>
      </section>
    </div>
  );
}
