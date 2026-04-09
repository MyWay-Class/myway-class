import type { AIRecommendationOverview, CourseCard, Dashboard, LectureDetail } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';

type StudentDashboardPageProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  highlightedLecture: LectureDetail | null;
  recommendations: AIRecommendationOverview | null;
  onSelectCourse: (courseId: string) => void;
};

export function StudentDashboardPage({
  dashboard,
  courses,
  highlightedLecture,
  recommendations,
  onSelectCourse,
}: StudentDashboardPageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const stats =
    dashboard?.stats ?? [
      {
        id: 'courses',
        label: '수강 중 강의',
        value: String(courses.filter((course) => course.enrolled).length),
        hint: '현재 활성화된 학습 코스',
        icon: 'ri-book-open-line',
        tone: 'indigo' as const,
      },
      {
        id: 'completed',
        label: '완료 강의',
        value: String(courses.reduce((sum, course) => sum + course.completed_lectures, 0)),
        hint: '누적 완료한 강의 수',
        icon: 'ri-check-double-line',
        tone: 'emerald' as const,
      },
      {
        id: 'progress',
        label: '평균 진도',
        value: `${averageProgress}%`,
        hint: '전체 코스 기준 평균 진도',
        icon: 'ri-line-chart-line',
        tone: 'violet' as const,
      },
      {
        id: 'minutes',
        label: '총 학습 시간',
        value: `${Math.round(courses.reduce((sum, course) => sum + course.total_duration_minutes * (course.progress_percent / 100), 0))}분`,
        hint: '진도 기준 예상 학습 시간',
        icon: 'ri-time-line',
        tone: 'amber' as const,
      },
    ];
  const activities = dashboard?.recent_activities ?? [];
  const nextAction = dashboard?.next_action ?? '로그인 후 개인 학습 흐름을 확인할 수 있습니다.';

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-200">Dashboard</div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.04em]">학습 흐름과 최근 활동을 한눈에 확인합니다.</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">{nextAction}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">{dashboard?.learner_name ?? '학습자'}</div>
            <div className="mt-1">{dashboard?.role ?? 'STUDENT'}</div>
          </div>
        </div>
      </section>

      <DashboardStatsGrid stats={stats} />

      <DashboardTimeline
        title="최근 활동"
        subtitle="수강 신청, 강의 완료, AI 요청을 시간순으로 확인합니다."
        activities={activities}
        emptyMessage="최근 활동이 아직 없습니다. 첫 수강 신청이나 강의 완료가 생기면 여기에 표시됩니다."
      />

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <i className="ri-graduation-cap-line text-indigo-600" />
          수강 중인 강의
        </h3>
        <div className="mt-3 space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-indigo-50 text-[15px] text-indigo-600">
                <i className="ri-book-open-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">
                  {course.instructor_name} · {course.completed_lectures}/{course.lecture_count}차시
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                {course.progress_percent}%
              </span>
            </button>
          ))}
        </div>
      </section>

      {highlightedLecture ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <i className="ri-play-circle-line text-indigo-600" />
            지금 이어볼 강의
          </h3>
          <div className="mt-3 rounded-2xl border border-slate-200 px-4 py-4">
            <div className="text-[14px] font-semibold text-slate-900">{highlightedLecture.title}</div>
            <div className="mt-1 text-[12px] text-slate-500">
              {highlightedLecture.course_title} · {highlightedLecture.course_instructor}
            </div>
          </div>
        </section>
      ) : null}

      {recommendations?.recommendations.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <i className="ri-robot-line text-indigo-600" />
            AI 추천
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recommendations.recommendations.slice(0, 2).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="text-[13px] font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-[12px] leading-6 text-slate-500">{item.reason}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
