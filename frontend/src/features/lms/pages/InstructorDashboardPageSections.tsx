import type { AIInsights, CourseCard, DashboardActivity } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';
import { DashboardTimeline } from '../components/DashboardTimeline';
import { InstructorDashboardToolsSection } from './DashboardPageSections';

type CoursesSectionProps = {
  courses: CourseCard[];
  formatDuration: (minutes: number) => string;
};

export function InstructorDashboardCoursesSection({ courses, formatDuration }: CoursesSectionProps) {
  return (
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
  );
}

type InsightsSectionProps = {
  insights: AIInsights | null;
};

export function InstructorDashboardInsightsSection({ insights }: InsightsSectionProps) {
  return insights ? (
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
  );
}

type TimelineSectionProps = {
  activities: DashboardActivity[];
  emptyMessage: string;
};

export function InstructorDashboardTimelineSection({ activities, emptyMessage }: TimelineSectionProps) {
  return (
    <DashboardTimeline
      title="최근 활동"
      subtitle="자료 업로드, 공지, 수강자 진도와 AI 요청을 확인합니다."
      activities={activities}
      emptyMessage={emptyMessage}
    />
  );
}

export function InstructorDashboardToolsPanel() {
  return <InstructorDashboardToolsSection />;
}
