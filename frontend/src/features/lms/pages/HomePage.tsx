import type { CourseCard, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { CourseExploreCard } from '../components/CourseExploreCard';
import { CourseExploreFilters } from '../components/CourseExploreFilters';
import { StatePanel } from '../components/StatePanel';

type HomePageProps = {
  session: LoginResponse;
  dashboard: Dashboard | null;
  courses: CourseCard[];
  highlightedLecture: LectureDetail | null;
  onNavigate: (page: 'home' | 'dashboard' | 'courses' | 'shortform' | 'community' | 'my-shortforms' | 'ai-chat') => void;
  onSelectCourse: (courseId: string) => void;
};

const quickActions = [
  { page: 'courses' as const, label: '내 강의', icon: 'ri-book-open-line', hint: '수강 중인 강의와 진도 확인' },
  { page: 'shortform' as const, label: '숏폼', icon: 'ri-scissors-cut-line', hint: '핵심 장면으로 다시 보기' },
  { page: 'ai-chat' as const, label: 'AI 챗봇', icon: 'ri-robot-line', hint: '강의 질문 바로 하기' },
  { page: 'dashboard' as const, label: '대시보드', icon: 'ri-dashboard-3-line', hint: '학습 현황을 다시 보기' },
];

function countUnique(values: string[]): number {
  return new Set(values).size;
}

function circularProgress(value: number) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(Math.min(value, 100), 0);
  const offset = circumference - (progress / 100) * circumference;
  return { circumference, offset, progress };
}

export function HomePage({ session, dashboard, courses, highlightedLecture, onNavigate, onSelectCourse }: HomePageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const categories = [...new Set(courses.map((item) => item.category).filter((category): category is string => Boolean(category)))];
  const tags = [...new Set(courses.flatMap((course) => (Array.isArray(course.tags) ? course.tags : [])))].slice(0, 5);
  const continueCourse = highlightedLecture
    ? courses.find((course) => course.id === highlightedLecture.course_id) ?? courses[0] ?? null
    : courses[0] ?? null;
  const progress = circularProgress(averageProgress);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:px-8">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.30),transparent_55%)]" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            AI 기반 학습 플랫폼 · {session.user.name}
          </span>
          <h2 className="mt-4 text-[26px] font-bold text-slate-900 lg:text-[30px]">학습 홈</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-slate-500">
            강의, 스크립트, 타임스탬프, 숏폼, AI 챗봇까지 한 곳에서 이어집니다.
            홈에서 시작해 바로 학습 흐름으로 들어가세요.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-indigo-500"
            >
              강의 탐색하기
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              로그인 후 계속
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length > 0 ? tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                #{tag}
              </span>
            )) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                추천 태그가 없습니다.
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <button
            key={action.page}
            type="button"
            onClick={() => onNavigate(action.page)}
            className="group rounded-2xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:border-indigo-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[22px] text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
              <i className={action.icon} />
            </div>
            <div className="mt-4 text-[14px] font-bold text-[var(--app-text)]">{action.label}</div>
            <div className="mt-1 text-[12px] leading-6 text-[var(--app-text-muted)]">{action.hint}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--app-text)]">지금 이어볼 강의</h3>
              <p className="mt-1 text-[12px] text-[var(--app-text-muted)]">로그인 후 처음 보는 홈에서도 바로 다음 학습으로 이동합니다.</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              {dashboard?.courses?.filter((course) => course.enrolled).length ?? 0}개 수강 중
            </div>
          </div>

          {highlightedLecture && continueCourse ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                  홈 시작
                </div>
                <div className="mt-4 text-[20px] font-bold text-slate-900">{highlightedLecture.title}</div>
                <div className="mt-2 text-[13px] leading-6 text-slate-500">
                  {highlightedLecture.course_title} · {highlightedLecture.course_instructor}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCourse(highlightedLecture.course_id);
                      onNavigate('courses');
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                  >
                    내 강의 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('ai-chat')}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    챗봇으로 질문
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-indigo-600">진도</div>
                    <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-[var(--app-text)]">
                      {continueCourse.progress_percent}%
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[var(--app-text-muted)]">
                    <div>
                      {continueCourse.completed_lectures}/{continueCourse.lecture_count}차시
                    </div>
                    <div>{Math.round(continueCourse.total_duration_minutes * (continueCourse.progress_percent / 100))}분 진행</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(continueCourse.progress_percent, 8)}%` }} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold text-[var(--app-text-muted)]">카테고리</div>
                    <div className="mt-1 text-[13px] font-semibold text-[var(--app-text)]">{continueCourse.category}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold text-[var(--app-text-muted)]">다음 행동</div>
                    <div className="mt-1 text-[13px] font-semibold text-[var(--app-text)]">
                      {highlightedLecture.next_lecture_id ? '다음 차시로 이동' : '복습 또는 숏폼 제작'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <StatePanel
                compact
                icon="ri-play-circle-line"
                tone="indigo"
                title="이어볼 강의가 없습니다."
                description="수강 중인 강의가 생기면 홈에서 바로 이어서 학습할 수 있습니다."
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--app-text)]">학습 요약</h3>
                <p className="mt-1 text-[12px] text-[var(--app-text-muted)]">홈에서 한 번에 현재 상태를 확인합니다.</p>
              </div>
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgb(79, 70, 229)"
                  strokeWidth="2.5"
                  strokeDasharray={`${progress.circumference} ${progress.circumference}`}
                  strokeDashoffset={progress.offset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[var(--app-surface-soft)] px-4 py-3">
                <div className="text-[11px] text-[var(--app-text-muted)]">수강 중</div>
                <div className="mt-1 text-[18px] font-extrabold text-[var(--app-text)]">
                  {dashboard?.courses?.filter((course) => course.enrolled).length ?? 0}
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--app-surface-soft)] px-4 py-3">
                <div className="text-[11px] text-[var(--app-text-muted)]">평균 진도</div>
                <div className="mt-1 text-[18px] font-extrabold text-[var(--app-text)]">{averageProgress}%</div>
              </div>
              <div className="rounded-2xl bg-[var(--app-surface-soft)] px-4 py-3">
                <div className="text-[11px] text-[var(--app-text-muted)]">카테고리</div>
                <div className="mt-1 text-[18px] font-extrabold text-[var(--app-text)]">{categories.length}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-[var(--app-text)]">추천 카테고리</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.length > 0 ? categories.map((category) => (
                <span key={category} className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--app-text-secondary)]">
                  {category}
                </span>
              )) : (
                <span className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--app-text-secondary)]">
                  강의가 없습니다.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <CourseExploreFilters
          categories={categories}
          activeCategory=""
          onCategoryChange={() => undefined}
          activeStatus="all"
          onStatusChange={() => undefined}
          resultCount={courses.length}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseExploreCard
              key={course.id}
              course={course}
              selected={false}
              onSelect={(courseId) => {
                onSelectCourse(courseId);
                onNavigate('courses');
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
