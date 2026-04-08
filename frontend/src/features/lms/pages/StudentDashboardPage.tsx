import type { AIRecommendationOverview, CourseCard, Dashboard, LectureDetail } from '@myway/shared';

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

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-[18px] text-indigo-600">
            <i className="ri-book-open-line" />
          </div>
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{courses.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">수강 중인 강의</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[18px] text-emerald-600">
            <i className="ri-check-double-line" />
          </div>
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{averageProgress}%</div>
          <div className="mt-1 text-[12px] text-slate-500">평균 학습 진도</div>
        </article>
      </section>

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
