import type { CourseCard, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';

type HomePageProps = {
  session: LoginResponse;
  dashboard: Dashboard | null;
  courses: CourseCard[];
  highlightedLecture: LectureDetail | null;
  onNavigate: (page: 'home' | 'dashboard' | 'courses' | 'shortform' | 'community' | 'my-shortforms' | 'ai-chat') => void;
  onSelectCourse: (courseId: string) => void;
};

function formatStudyHours(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return '0시간';
  }
  return `${Math.round(totalMinutes / 60)}시간`;
}

function getPopularKeywords(courses: CourseCard[]) {
  const keywords = courses.flatMap((course) => [course.category, ...(Array.isArray(course.tags) ? course.tags : [])]);
  return [...new Set(keywords)].filter(Boolean).slice(0, 6);
}

function courseVisualClasses(palette: CourseCard['thumbnail_palette']) {
  if (palette === 'emerald') return 'from-emerald-900 via-emerald-700 to-teal-500';
  if (palette === 'violet') return 'from-violet-950 via-purple-700 to-fuchsia-500';
  if (palette === 'amber') return 'from-amber-950 via-amber-700 to-orange-400';
  return 'from-blue-950 via-cyan-800 to-sky-500';
}

export function HomePage({ session, dashboard, courses, highlightedLecture, onNavigate, onSelectCourse }: HomePageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const enrolledCourses = dashboard?.courses?.filter((course) => course.enrolled).length ?? 0;
  const totalLectures = courses.reduce((sum, course) => sum + course.lecture_count, 0);
  const totalCompletedLectures = courses.reduce((sum, course) => sum + course.completed_lectures, 0);
  const totalStudyMinutes = courses.reduce(
    (sum, course) => sum + Math.round(course.total_duration_minutes * (Math.max(course.progress_percent, 0) / 100)),
    0,
  );
  const achievements = Math.max(Math.round(totalCompletedLectures / 3), 0);
  const popularKeywords = getPopularKeywords(courses);
  const continueCourse = highlightedLecture
    ? courses.find((course) => course.id === highlightedLecture.course_id) ?? courses[0] ?? null
    : courses[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-cyan-200/35 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.28),transparent_32%),radial-gradient(circle_at_75%_30%,rgba(14,116,144,0.45),transparent_45%),linear-gradient(120deg,#031d3a_0%,#05345f_55%,#0a4168_100%)] p-6 text-white shadow-[0_20px_60px_rgba(8,47,73,0.45)] lg:p-8">
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full border border-cyan-300/30" />
        <div className="pointer-events-none absolute right-16 top-24 h-44 w-44 rounded-full border border-cyan-300/15" />
        <div className="pointer-events-none absolute bottom-8 right-10 h-20 w-20 rounded-2xl border border-cyan-200/25 bg-cyan-300/10 backdrop-blur" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
          <div>
            <span className="inline-flex rounded-full border border-cyan-200/40 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.03em] text-cyan-100">
              AI Learning Home · {session.user.name}
            </span>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.2] tracking-[-0.03em] text-white lg:text-[46px]">
              AI로 배우고,
              <br />
              성장하는 실력
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-cyan-50/90">
              2026년, 학습부터 실전까지 이어지는 개인 맞춤형 러닝 허브. 강의 탐색부터 AI 질문, 숏폼 복습까지 한 흐름으로 시작하세요.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className="rounded-xl bg-cyan-300 px-5 py-2.5 text-[13px] font-bold text-cyan-950 transition hover:bg-cyan-200"
              >
                강의 탐색 시작
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ai-chat')}
                className="rounded-xl border border-cyan-100/30 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-cyan-50 backdrop-blur transition hover:bg-white/20"
              >
                AI 도우미 열기
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="absolute inset-0 rounded-[28px] bg-cyan-300/15 blur-2xl" />
            <div className="relative rounded-[28px] border border-cyan-100/25 bg-white/10 p-6 backdrop-blur">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[26px] border border-cyan-200/35 bg-gradient-to-br from-cyan-200/95 to-cyan-400/70 text-[48px] font-black text-slate-900 shadow-[0_20px_40px_rgba(34,211,238,0.35)]">
                AI
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/35 px-3 py-2">
                  <div className="text-[11px] text-cyan-100/80">진행률</div>
                  <div className="mt-1 text-[18px] font-extrabold text-cyan-100">{averageProgress}%</div>
                </div>
                <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/35 px-3 py-2">
                  <div className="text-[11px] text-cyan-100/80">수강 강의</div>
                  <div className="mt-1 text-[18px] font-extrabold text-cyan-100">{enrolledCourses}개</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-2 rounded-[22px] border border-cyan-200/20 bg-[linear-gradient(145deg,#0a2f56_0%,#0b3c63_45%,#11496f_100%)] p-5 text-cyan-50 shadow-[0_16px_36px_rgba(8,47,73,0.35)] lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)] lg:items-center">
          <div>
            <h3 className="text-[28px] font-extrabold tracking-[-0.02em]">원하는 강의를 찾아보세요</h3>
            <div className="mt-4 flex items-center rounded-2xl border border-cyan-100/30 bg-white/95 px-4 py-3 text-slate-700">
              <i className="ri-search-line text-[18px] text-slate-500" />
              <input
                type="text"
                value="강의명, 키워드, 스킬 등을 검색해보세요"
                readOnly
                className="ml-3 w-full bg-transparent text-[14px] text-slate-700 outline-none"
                aria-label="강의 검색"
              />
              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-cyan-600"
              >
                이동
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(popularKeywords.length > 0 ? popularKeywords : ['프롬프트 엔지니어링', 'ChatGPT 활용', '파이썬']).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onNavigate('courses')}
                  className="rounded-full border border-cyan-100/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-50/95 transition hover:bg-white/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-4 backdrop-blur">
            <div className="text-[12px] font-semibold text-cyan-100/85">AI 맞춤 추천</div>
            <div className="mt-2 text-[15px] font-bold text-white">{session.user.name}님에게 맞는 코스</div>
            <p className="mt-1 text-[12px] leading-6 text-cyan-100/80">학습 기록과 관심 카테고리를 기반으로 오늘의 추천 강의를 준비했습니다.</p>
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-cyan-200/35 bg-cyan-300/20 px-3 py-1.5 text-[12px] font-semibold text-cyan-100 transition hover:bg-cyan-300/30"
            >
              추천 강의 보기
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">내 학습 현황</h3>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 transition hover:text-cyan-900"
          >
            학습 통계 전체 보기
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-[12px] font-semibold text-slate-500">학습 진행률</div>
            <div className="mt-2 text-[36px] font-black tracking-[-0.03em] text-slate-900">{averageProgress}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(averageProgress, 6)}%` }} />
            </div>
            <div className="mt-2 text-[11px] text-slate-500">전체 진도 {totalCompletedLectures} / {Math.max(totalLectures, 0)} 강의</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-[12px] font-semibold text-slate-500">연속 학습일</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{Math.max(enrolledCourses * 3, 1)}일</div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <i className="ri-fire-line text-[20px]" />
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">최근 학습 흐름 유지 중</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-[12px] font-semibold text-slate-500">학습 시간</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{formatStudyHours(totalStudyMinutes)}</div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <i className="ri-time-line text-[20px]" />
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">누적 기반 환산 시간</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-[12px] font-semibold text-slate-500">획득 배지</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{achievements}개</div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <i className="ri-trophy-line text-[20px]" />
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">다음 배지까지 1개</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-slate-900">지금 이어볼 강의</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">학습 재개</span>
          </div>

          {highlightedLecture && continueCourse ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-[11px] font-semibold text-cyan-700">CONTINUE</div>
              <div className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-slate-900">{highlightedLecture.title}</div>
              <div className="mt-1 text-[13px] text-slate-500">{highlightedLecture.course_title} · {highlightedLecture.course_instructor}</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(continueCourse.progress_percent, 8)}%` }} />
              </div>
              <div className="mt-2 text-[12px] text-slate-500">
                {continueCourse.completed_lectures}/{continueCourse.lecture_count}차시 완료 · {continueCourse.progress_percent}% 진행
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourse(highlightedLecture.course_id);
                    onNavigate('courses');
                  }}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500"
                >
                  강의로 이동
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('shortform')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  숏폼 복습
                </button>
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

      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">추천 강의</h3>
          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 transition hover:text-cyan-900"
          >
            전체 보기
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {courses.slice(0, 6).map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                onSelectCourse(course.id);
                onNavigate('courses');
              }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`relative h-32 bg-gradient-to-br ${courseVisualClasses(course.thumbnail_palette)}`}>
                <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {course.difficulty === 'advanced' ? 'BEST' : 'NEW'}
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
                <div className="absolute bottom-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {course.category}
                </div>
              </div>
              <div className="space-y-2 px-3 py-3">
                <div className="line-clamp-1 text-[15px] font-bold tracking-[-0.02em] text-slate-900">{course.title}</div>
                <div className="line-clamp-1 text-[12px] text-slate-500">{course.description}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">
                    {course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}
                  </span>
                  <span>
                    {Math.max(course.total_duration_minutes, 0) > 60
                      ? `${Math.round(course.total_duration_minutes / 60)}시간`
                      : `${course.total_duration_minutes}분`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>★ {Number.isFinite(course.rating) ? course.rating.toFixed(1) : '4.8'}</span>
                  <span>수강 {Number.isFinite(course.student_count) ? course.student_count : 0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
