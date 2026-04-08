import type { AIInsights, CourseCard } from '@myway/shared';

type InstructorDashboardPageProps = {
  courses: CourseCard[];
  insights: AIInsights | null;
};

const tools = [
  {
    icon: 'ri-file-text-line',
    iconClass: 'bg-indigo-50 text-indigo-600',
    title: 'AI 강의 요약',
    description: '전사와 요약 기반으로 강의 내용을 빠르게 정리합니다.',
  },
  {
    icon: 'ri-question-line',
    iconClass: 'bg-emerald-50 text-emerald-600',
    title: '시험·퀴즈 자동 생성',
    description: '강의 자료를 기반으로 문제를 자동 생성합니다.',
  },
  {
    icon: 'ri-scissors-cut-line',
    iconClass: 'bg-violet-50 text-violet-600',
    title: '숏폼 제작',
    description: '핵심 구간을 숏폼 콘텐츠로 빠르게 재구성합니다.',
  },
];

export function InstructorDashboardPage({ courses, insights }: InstructorDashboardPageProps) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tools.map((tool) => (
          <article key={tool.title} className="rounded-3xl border border-slate-200 bg-white px-5 py-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] ${tool.iconClass}`}>
              <i className={tool.icon} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">{tool.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">{tool.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <i className="ri-book-shelf-line text-indigo-600" />
          강의 관리
        </h3>
        <div className="mt-3 space-y-2">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-slate-50">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-violet-50 text-[15px] text-violet-600">
                <i className="ri-book-open-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">
                  {course.category} · {course.lecture_count}차시
                </div>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-600">운영 중</span>
            </div>
          ))}
        </div>
      </section>

      {insights ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <i className="ri-lightbulb-flash-line text-indigo-600" />
            AI 인사이트
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">
            최근 {insights.summary.recent_window_days}일 동안 AI 요청 {insights.summary.total_requests}회,
            성공률 {insights.summary.success_rate}%입니다.
          </p>
        </section>
      ) : null}
    </div>
  );
}
