import type { AIRecommendationOverview, CourseCard, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { CourseExploreCard } from '../components/CourseExploreCard';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardTimeline } from '../components/DashboardTimeline';
import { StatePanel } from '../components/StatePanel';

type StudentDashboardPageProps = {
  session: LoginResponse;
  dashboard: Dashboard | null;
  courses: CourseCard[]; // enrolled courses only
  highlightedLecture: LectureDetail | null;
  recommendations: AIRecommendationOverview | null;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: 'dashboard' | 'courses' | 'shortform' | 'community' | 'my-shortforms' | 'ai-chat') => void;
};

const quickActions = [
  { page: 'courses' as const, label: '내 강의', icon: 'ri-book-open-line', hint: '상세와 진도율 보기' },
  { page: 'shortform' as const, label: '숏폼', icon: 'ri-scissors-cut-line', hint: '제작, 내 숏폼, 커뮤니티' },
  { page: 'ai-chat' as const, label: 'AI 챗봇', icon: 'ri-robot-line', hint: '강의 질문 바로하기' },
  { page: 'dashboard' as const, label: '진도 확인', icon: 'ri-dashboard-3-line', hint: '대시보드로 다시 보기' },
];

function circularProgress(value: number) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(Math.min(value, 100), 0);
  const offset = circumference - (progress / 100) * circumference;

  return { circumference, offset, progress };
}

export function StudentDashboardPage({
  session,
  dashboard,
  courses,
  highlightedLecture,
  recommendations,
  onSelectCourse,
  onNavigate,
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
  const continueCourse = highlightedLecture
    ? courses.find((course) => course.id === highlightedLecture.course_id) ?? courses[0] ?? null
    : courses[0] ?? null;
  const progress = circularProgress(averageProgress);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-sm lg:px-8 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[30px] bg-[linear-gradient(135deg,#6366f1,#22c55e)] text-white shadow-[0_18px_40px_rgba(79,70,229,0.22)]">
              <span className="text-[28px] font-extrabold">{session.user.name.slice(0, 1)}</span>
              <span className="absolute -bottom-2 -right-2 rounded-full border border-white bg-white p-1 text-[16px] text-indigo-600 shadow-sm">
                <i className="ri-user-3-line" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                <i className="ri-dashboard-3-line" />
                마이페이지
              </div>
              <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px] text-slate-900">
                {session.user.name}님, 오늘 학습을
                <br />
                이어갈 준비가 되어 있습니다.
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500">{nextAction}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{session.user.email}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{session.user.role}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">수강 중 {courses.length}개</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
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
              <div>
                <div className="text-[11px] font-semibold text-slate-500">평균 진도</div>
                <div className="text-[34px] font-extrabold tracking-[-0.04em] text-slate-900">{averageProgress}%</div>
                <div className="text-[11px] text-slate-500">{courses.length}개 강의 기준</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] text-slate-500">이어서 보기</div>
                <div className="mt-1 text-[18px] font-extrabold text-slate-900">{highlightedLecture ? '가능' : '대기'}</div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] text-slate-500">활동</div>
                <div className="mt-1 text-[18px] font-extrabold text-slate-900">{activities.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DashboardStatsGrid stats={stats} />

      <section className="grid gap-4 lg:grid-cols-4">
        {quickActions.map((action) => (
          <button
            key={action.page}
            type="button"
            onClick={() => onNavigate(action.page)}
            className="group rounded-[28px] border border-slate-200 bg-white px-5 py-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[22px] text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
              <i className={action.icon} />
            </div>
            <div className="mt-4 text-[14px] font-bold text-slate-900">{action.label}</div>
            <div className="mt-1 text-[12px] leading-6 text-slate-500">{action.hint}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">최근 학습</h3>
                <p className="mt-1 text-[12px] text-slate-500">레퍼런스처럼 지금 가장 먼저 다시 볼 강의를 앞에 둡니다.</p>
              </div>
              {highlightedLecture ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourse(highlightedLecture.course_id);
                    onNavigate('courses');
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  상세 열기
                </button>
              ) : null}
            </div>

            {highlightedLecture && continueCourse ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[26px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_60%,#312e81_100%)] px-5 py-5 text-white">
                  <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">지금 이어볼 강의</div>
                  <div className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">{highlightedLecture.title}</div>
                  <div className="mt-2 text-[13px] leading-6 text-white/75">
                    {highlightedLecture.course_title} · {highlightedLecture.course_instructor}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCourse(highlightedLecture.course_id);
                        onNavigate('courses');
                      }}
                      className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      상세/진도율 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('ai-chat')}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/15"
                    >
                      챗봇으로 질문
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-indigo-600">진도</div>
                      <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-slate-900">
                        {continueCourse.progress_percent}%
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
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
                      <div className="text-[11px] font-semibold text-slate-400">카테고리</div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">{continueCourse.category}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold text-slate-400">다음 행동</div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">
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
                  description="수강 중인 강의가 생기면 여기에서 바로 이어서 학습할 수 있습니다."
                />
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">수강 중인 강의</h3>
                <p className="mt-1 text-[12px] text-slate-500">카드를 눌러 강의 상세로 이동합니다.</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">{courses.length}개</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {courses.slice(0, 4).map((course) => (
                <CourseExploreCard
                  key={course.id}
                  course={course}
                  selected={false}
                  onSelect={onSelectCourse}
                  onOpen={(courseId) => {
                    onSelectCourse(courseId);
                    onNavigate('courses');
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardTimeline
            title="최근 활동"
            subtitle="수강 신청, 강의 완료, AI 요청을 시간순으로 확인합니다."
            activities={activities}
            emptyMessage="최근 활동이 아직 없습니다. 첫 수강 신청이나 강의 완료가 생기면 여기에 표시됩니다."
          />

          {recommendations?.recommendations.length ? (
            <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <i className="ri-robot-line text-indigo-600" />
                AI 추천
              </h3>
              <div className="mt-3 grid gap-3">
                {recommendations.recommendations.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="text-[13px] font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-[12px] leading-6 text-slate-500">{item.reason}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <StatePanel
              icon="ri-robot-line"
              tone="slate"
              title="AI 추천이 아직 없습니다."
              description="활동이 쌓이면 개인화된 추천이 이 영역에 표시됩니다."
            />
          )}
        </div>
      </section>
    </div>
  );
}
