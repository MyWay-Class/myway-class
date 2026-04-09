import type { AIInsights, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';

type InstructorDashboardPageProps = {
  dashboard: Dashboard | null;
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

export function InstructorDashboardPage({ dashboard, courses, insights }: InstructorDashboardPageProps) {
  const stats =
    dashboard?.stats ?? [
      {
        id: 'courses',
        label: '개설 강의',
        value: String(courses.length),
        hint: '운영 중인 내 강의 수',
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
        value: `${Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1))}%`,
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
  const nextAction = dashboard?.next_action ?? '최근 업로드 자료와 공지를 확인하고 학생 진도 변화를 살펴보세요.';

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-violet-200">Instructor Dashboard</div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.04em]">강의 운영과 학습 반응을 빠르게 확인합니다.</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">{nextAction}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">{dashboard?.learner_name ?? '강사'}</div>
            <div className="mt-1">{dashboard?.role ?? 'INSTRUCTOR'}</div>
          </div>
        </div>
      </section>

      <DashboardStatsGrid stats={stats} />

      <DashboardTimeline
        title="최근 활동"
        subtitle="자료 업로드, 공지, 수강자 진도와 AI 요청을 확인합니다."
        activities={activities}
        emptyMessage="아직 최근 활동이 없습니다. 자료 업로드나 공지 등록이 여기에 표시됩니다."
      />

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
