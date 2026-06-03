import type { AIInsights, CourseCard, Dashboard } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';
import { StatePanel } from '../components/StatePanel';
import { DashboardHero, InstructorDashboardToolsSection } from './DashboardPageSections';

type InstructorDashboardPageProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  insights: AIInsights | null;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function InstructorDashboardPage({ dashboard, courses, insights }: InstructorDashboardPageProps) {
  const avgProgress = Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const managedCount = courses.length;
  const activeCount = courses.filter((course) => course.progress_percent > 0 && course.progress_percent < 100).length;
  const stats =
    dashboard?.stats ?? [
      {
        id: 'courses',
        label: '개설 강의',
        value: String(managedCount),
        hint: '운영 중인 코스 수',
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
        value: `${avgProgress}%`,
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
  const nextAction = dashboard?.next_action ?? '최근 업로드 자료와 공지를 확인하고 학생 진도 변화를 점검하세요.';

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
          <DashboardTimeline
            title="최근 활동"
            subtitle="자료 업로드, 공지, 수강자 진도와 AI 요청을 확인합니다."
            activities={activities}
            emptyMessage="아직 최근 활동이 없습니다. 자료 업로드나 공지 등록이 여기에 표시됩니다."
          />

          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">운영 중인 강의</h3>
                <p className="mt-1 text-[12px] text-slate-500">진도와 러닝타임을 기준으로 빠르게 상태를 훑습니다.</p>
              </div>
              <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">{courses.length}개</div>
            </div>

            <div className="mt-4 space-y-3">
              {courses.length ? (
                courses.map((course) => (
                  <article key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-1 text-cyan-700">{course.category}</span>
                          <span>{course.lecture_count}차시</span>
                          <span>{formatDuration(course.total_duration_minutes)}</span>
                        </div>
                        <div className="mt-2 text-[14px] font-bold text-slate-900">{course.title}</div>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-6 text-slate-500">{course.description}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[20px] text-cyan-700 shadow-sm">
                        <i className="ri-play-circle-line" />
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(course.progress_percent, 8)}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{course.instructor_name}</span>
                      <span>{course.progress_percent}% 진행</span>
                    </div>
                  </article>
                ))
              ) : (
                <StatePanel
                  compact
                  icon="ri-book-shelf-line"
                  tone="slate"
                  title="운영 중인 강의가 없습니다."
                  description="강의를 개설하면 이 영역에서 진도와 운영 상태를 바로 확인할 수 있습니다."
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <InstructorDashboardToolsSection />

          {insights ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <i className="ri-lightbulb-flash-line text-cyan-700" />
                AI 인사이트
              </h3>
              <p className="mt-3 text-[13px] leading-6 text-slate-500">
                최근 {insights.summary.recent_window_days}일 동안 AI 요청 {insights.summary.total_requests}회, 성공률 {insights.summary.success_rate}%입니다.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-[11px] font-semibold text-slate-400">성공률</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{insights.summary.success_rate}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-[11px] font-semibold text-slate-400">최근 창</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{insights.summary.recent_window_days}일</div>
                </div>
              </div>
            </section>
          ) : (
            <StatePanel
              icon="ri-lightbulb-flash-line"
              tone="slate"
              title="AI 인사이트가 아직 없습니다."
              description="AI 요청이 쌓이면 강의별 활용 현황과 효율 개선 포인트를 이 영역에서 바로 확인할 수 있습니다."
            />
          )}
        </div>
      </section>
    </div>
  );
}
