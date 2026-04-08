import type {
  AIInsights,
  AIRecommendationOverview,
  AIUserSettings,
  AuthUser,
  CourseCard,
  CourseDetail,
  Dashboard,
  LectureDetail,
  LoginResponse,
} from '@myway/shared';
import { formatDifficulty, formatPercentage } from '../lib/format';
import { Button } from './ui/Button';
import { AppLayout } from './ui/Layout';

type LmsDashboardProps = {
  loading: boolean;
  busy: boolean;
  notice: string;
  session: LoginResponse | null;
  canManageCurrent: boolean;
  apiStatus: 'checking' | 'online' | 'offline';
  dashboard: Dashboard | null;
  insights: AIInsights | null;
  recommendations: AIRecommendationOverview | null;
  settings: AIUserSettings | null;
  courseCards: CourseCard[];
  selectedCourseId: string;
  selectedCourse: CourseDetail | null;
  selectedLectureId: string;
  highlightedLecture: LectureDetail | null;
  enrolledCourses: CourseCard[];
  canEnrollCurrent: boolean;
  demoUsers: AuthUser[];
  onLogin: (userId: string) => void;
  onLogout: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
  onCompleteLecture: (lectureId: string) => void;
  onAddMaterial: (input: { title: string; summary: string; file_name: string }) => Promise<boolean>;
  onAddNotice: (input: { title: string; content: string; pinned: boolean }) => Promise<boolean>;
  onSaveAISettings: (input: {
    language?: 'ko' | 'en';
    theme?: 'light' | 'dark' | 'system';
    auto_summary?: boolean;
    recommendation_mode?: 'progress' | 'discovery' | 'balanced';
  }) => Promise<boolean>;
  getCurrentRoleLabel: () => string;
};

function getDifficultyTone(level: CourseCard['difficulty']) {
  if (level === 'beginner') {
    return { label: '초급', className: 'bg-[var(--success-soft)] text-[#4f9a69]' };
  }
  if (level === 'intermediate') {
    return { label: '중급', className: 'bg-[var(--warning-soft)] text-[#bf8420]' };
  }
  return { label: '고급', className: 'bg-[var(--danger-soft)] text-[#cc5d7d]' };
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[26px] bg-white/16 px-6 py-5 text-white backdrop-blur-sm">
      <div className="text-[2.4rem] font-black leading-none">{value}</div>
      <div className="mt-2 text-sm font-medium text-white/80">{label}</div>
    </div>
  );
}

function GuestScreen({
  busy,
  demoUsers,
  onLogin,
}: Pick<LmsDashboardProps, 'busy' | 'demoUsers' | 'onLogin'>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-10">
      <div className="w-full max-w-[1080px]">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-[34px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[3rem] font-black text-white shadow-[0_30px_70px_rgba(111,99,246,0.24)]">
            M
          </div>
          <h1 className="m-0 text-[4.2rem] font-black tracking-[-0.06em] text-[#232c42]">MyWayClass</h1>
          <p className="mt-3 text-[1.8rem] text-[var(--muted)]">AI 기반 차세대 학습 관리 시스템</p>
        </div>

        <div className="mx-auto max-w-[700px] rounded-[40px] border border-white/80 bg-white px-11 py-12 shadow-[0_35px_80px_rgba(96,106,146,0.14)]">
          <h2 className="mb-10 text-center text-[3.1rem] font-black tracking-[-0.05em] text-[#21293c]">로그인</h2>

          <div className="space-y-8">
            <label className="block">
              <span className="mb-3 block text-[1.35rem] font-semibold text-[#424c63]">이메일</span>
              <input readOnly value="student1@ai-lms.dev" />
            </label>
            <label className="block">
              <span className="mb-3 block text-[1.35rem] font-semibold text-[#424c63]">비밀번호</span>
              <input readOnly value="••••••••••" />
            </label>
            <Button className="w-full py-5 text-[1.45rem] font-bold" disabled={busy}>
              로그인
            </Button>
          </div>

          <p className="mb-8 mt-8 text-center text-[1.2rem] text-[var(--muted)]">
            계정이 없으신가요? <span className="font-semibold text-[var(--accent)]">회원가입</span>
          </p>

          <div className="mb-5 h-px bg-[var(--line)]" />
          <p className="mb-6 text-center text-lg text-[var(--muted)]">데모 계정</p>

          <div className="grid gap-4 md:grid-cols-3">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                className="rounded-[24px] bg-[#f7f8fc] px-5 py-7 text-center shadow-[inset_0_0_0_1px_rgba(127,136,164,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(111,99,246,0.12)]"
                onClick={() => onLogin(user.id)}
                type="button"
              >
                <div className="mb-4 text-[2rem]">
                  {user.role === 'STUDENT' ? '🎓' : user.role === 'INSTRUCTOR' ? '🧑‍🏫' : '🛡'}
                </div>
                <div className="text-[1.35rem] font-bold text-[#2a3246]">
                  {user.role === 'STUDENT' ? '학생' : user.role === 'INSTRUCTOR' ? '강사' : '관리자'}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">{user.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseProgressCard({
  course,
  active,
  onSelect,
}: {
  course: CourseCard;
  active: boolean;
  onSelect: (courseId: string) => void;
}) {
  const tone = getDifficultyTone(course.difficulty);

  return (
    <button
      className={[
        'rounded-[28px] border bg-white p-6 text-left shadow-[var(--shadow-soft)] transition',
        active ? 'border-[color:var(--line-strong)] shadow-[var(--shadow)]' : 'border-[color:var(--line)] hover:-translate-y-0.5 hover:shadow-[var(--shadow)]',
      ].join(' ')}
      onClick={() => onSelect(course.id)}
      type="button"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[1.55rem] font-black tracking-[-0.04em] text-[#252d42]">{course.title}</div>
          <p className="mt-3 text-[1.02rem] text-[var(--muted)]">
            {course.instructor_name} · {course.lecture_count} 강의
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-bold ${tone.className}`}>{tone.label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#eceef5]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]"
            style={{ width: `${course.progress_percent}%` }}
          />
        </div>
        <span className="text-lg font-bold text-[#68738b]">{course.progress_percent}%</span>
      </div>
    </button>
  );
}

function CourseExploreCard({
  course,
  active,
  onSelect,
  canEnrollCurrent,
  busy,
  onEnroll,
}: {
  course: CourseCard;
  active: boolean;
  onSelect: (courseId: string) => void;
  canEnrollCurrent: boolean;
  busy: boolean;
  onEnroll: (courseId: string) => void;
}) {
  const tone = getDifficultyTone(course.difficulty);

  return (
    <article
      className={[
        'rounded-[28px] border bg-white p-0 shadow-[var(--shadow-soft)] transition',
        active ? 'border-[color:var(--line-strong)]' : 'border-[color:var(--line)]',
      ].join(' ')}
    >
      <button className="block w-full text-left" onClick={() => onSelect(course.id)} type="button">
        <div className="flex h-48 items-center justify-center rounded-t-[28px] bg-gradient-to-br from-[#f0efff] to-[#eef2ff] text-[3.2rem] text-[rgba(111,99,246,0.35)]">
          📘
        </div>
        <div className="space-y-4 px-6 pb-6 pt-5">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${tone.className}`}>{tone.label}</span>
            <span className="text-base text-[var(--muted)]">{course.lecture_count} 강의</span>
          </div>
          <div>
            <div className="text-[1.65rem] font-black leading-[1.35] tracking-[-0.04em] text-[#252d42]">{course.title}</div>
            <p className="mt-3 line-clamp-2 text-[1.02rem] leading-7 text-[var(--muted)]">{course.description}</p>
          </div>
          <div className="flex items-center justify-between text-[1rem] text-[#6c7489]">
            <span>{course.instructor_name}</span>
            <span>{formatDifficulty(course.difficulty)}</span>
          </div>
        </div>
      </button>
      <div className="px-6 pb-6">
        <Button
          className="w-full"
          disabled={busy || !canEnrollCurrent || course.enrolled}
          onClick={() => onEnroll(course.id)}
          variant={course.enrolled ? 'outline' : 'primary'}
        >
          {course.enrolled ? '이미 수강 중' : '수강 신청'}
        </Button>
      </div>
    </article>
  );
}

function InsightCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <article className="rounded-[28px] border border-[color:var(--line)] bg-white p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">AI 기능</div>
      <h3 className="m-0 text-[1.5rem] font-black tracking-[-0.04em] text-[#252d42]">{title}</h3>
      <p className="mt-3 text-[1.02rem] leading-7 text-[var(--muted)]">{body}</p>
      {action ? <div className="mt-5 text-sm font-semibold text-[var(--accent)]">{action}</div> : null}
    </article>
  );
}

export function LmsDashboard(props: LmsDashboardProps) {
  if (!props.session) {
    return <GuestScreen busy={props.busy} demoUsers={props.demoUsers} onLogin={props.onLogin} />;
  }

  const currentName = props.session.user.name;
  const stats = [
    { label: '수강 중', value: props.enrolledCourses.length },
    { label: '평균 진도', value: formatPercentage(props.dashboard?.average_progress ?? 0) },
    { label: '완료 강의', value: props.selectedCourse?.completed_lectures ?? 0 },
  ];
  const suggestedInsights = [
    props.recommendations?.recommendations[0]
      ? {
          title: 'AI 추천',
          body: props.recommendations.recommendations[0].description,
          action: props.recommendations.recommendations[0].reason,
        }
      : {
          title: 'AI 추천',
          body: '학습 진도와 역할에 맞는 다음 학습 후보를 여기에서 확인할 수 있습니다.',
          action: '추천 카드가 준비되면 이 영역에 노출됩니다.',
        },
    props.highlightedLecture
      ? {
          title: 'STT·요약',
          body: `${props.highlightedLecture.title}의 전사, 요약, 강의 탐색 흐름을 이어서 확인할 수 있습니다.`,
          action: '현재 선택한 강의를 기준으로 AI 기능이 연결됩니다.',
        }
      : {
          title: 'STT·요약',
          body: '강의를 선택하면 전사와 요약 기반 학습 흐름을 이어갈 수 있습니다.',
        },
    props.insights
      ? {
          title: 'AI 인사이트',
          body: `최근 요청 ${props.insights.summary.total_requests}건, 평균 지연 ${props.insights.summary.avg_latency_ms}ms로 집계되고 있습니다.`,
          action: props.insights.intent_stats[0]?.label
            ? `주요 인텐트: ${props.insights.intent_stats[0].label}`
            : '인텐트 데이터 누적 중',
        }
      : {
          title: 'AI 인사이트',
          body: '로그와 인사이트 데이터가 준비되면 사용량과 흐름을 요약해 보여줍니다.',
        },
  ];

  return (
    <AppLayout loading={props.loading} onLogout={props.onLogout} session={props.session}>
      <div className="mx-auto w-full max-w-[1400px]">
        <section className="mb-8 rounded-[34px] bg-gradient-to-r from-[var(--accent)] via-[#8a58f0] to-[#d35d99] px-8 py-8 text-white shadow-[0_30px_70px_rgba(111,99,246,0.26)] lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="m-0 text-sm font-semibold uppercase tracking-[0.24em] text-white/75">dashboard overview</p>
              <h1 className="mt-4 text-[3.3rem] font-black tracking-[-0.06em]">환영합니다, {currentName}!</h1>
              <p className="mt-3 max-w-2xl text-[1.2rem] leading-8 text-white/80">
                AI 기반 학습을 계속하세요. 지금 필요한 강의, 추천, 전사 기반 복습 흐름을 한 화면에서 이어갈 수 있도록
                다시 구성했습니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {stats.map((stat) => (
                  <StatCard key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-white/14 p-6 backdrop-blur-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">지금 이어가기</div>
              <div className="mt-4 text-[1.5rem] font-black leading-[1.4]">
                {props.highlightedLecture?.title ?? '다음 학습할 강의를 선택해 주세요'}
              </div>
              <p className="mt-3 text-[1rem] leading-7 text-white/76">{props.notice}</p>
              {props.highlightedLecture ? (
                <Button
                  className="mt-6 w-full bg-white text-[var(--accent)] shadow-none hover:bg-white/95"
                  onClick={() => props.onCompleteLecture(props.highlightedLecture!.id)}
                >
                  현재 강의 완료 처리
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[1.5rem] text-[var(--accent)]">🎓</span>
              <h2 className="m-0 text-[2.1rem] font-black tracking-[-0.05em] text-[#252d42]">내 학습</h2>
            </div>
            <span className="text-[1.05rem] font-semibold text-[var(--accent)]">전체 보기</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {props.enrolledCourses.length > 0 ? (
              props.enrolledCourses.map((course) => (
                <CourseProgressCard
                  key={course.id}
                  active={course.id === props.selectedCourseId}
                  course={course}
                  onSelect={props.onSelectCourse}
                />
              ))
            ) : (
              <div className="rounded-[28px] border border-[color:var(--line)] bg-white px-6 py-7 text-[1.05rem] leading-8 text-[var(--muted)] shadow-[var(--shadow-soft)]">
                아직 수강 중인 강의가 없어요. 아래 강의 탐색에서 첫 강의를 선택해 보세요.
              </div>
            )}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[1.5rem] text-[var(--accent)]">🧭</span>
              <h2 className="m-0 text-[2.1rem] font-black tracking-[-0.05em] text-[#252d42]">강의 탐색</h2>
            </div>
            <span className="text-[1.05rem] font-semibold text-[var(--accent)]">전체 보기</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {props.courseCards.map((course) => (
              <CourseExploreCard
                key={course.id}
                active={course.id === props.selectedCourseId}
                busy={props.busy}
                canEnrollCurrent={props.canEnrollCurrent}
                course={course}
                onEnroll={props.onEnroll}
                onSelect={props.onSelectCourse}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-[color:var(--line)] bg-white p-7 shadow-[var(--shadow-soft)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">선택한 강의</div>
                  <h3 className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-[#252d42]">
                    {props.selectedCourse?.title ?? '강의를 선택하세요'}
                  </h3>
                </div>
                <span className="rounded-full bg-[#f3f5fb] px-4 py-2 text-sm font-semibold text-[#6d7891]">
                  API {props.apiStatus === 'checking' ? '확인 중' : props.apiStatus === 'online' ? '연결됨' : '오프라인'}
                </span>
              </div>

              <p className="text-[1.04rem] leading-8 text-[var(--muted)]">
                {props.selectedCourse?.description ?? '코스를 고르면 강의 목록, 자료, 공지, AI 연계 흐름이 여기에서 이어집니다.'}
              </p>

              {props.selectedCourse ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[24px] bg-[#f7f8fc] px-5 py-4">
                      <div className="text-sm text-[var(--muted)]">강사</div>
                      <div className="mt-2 text-lg font-bold text-[#252d42]">{props.selectedCourse.instructor_name}</div>
                    </div>
                    <div className="rounded-[24px] bg-[#f7f8fc] px-5 py-4">
                      <div className="text-sm text-[var(--muted)]">난이도</div>
                      <div className="mt-2 text-lg font-bold text-[#252d42]">{formatDifficulty(props.selectedCourse.difficulty)}</div>
                    </div>
                    <div className="rounded-[24px] bg-[#f7f8fc] px-5 py-4">
                      <div className="text-sm text-[var(--muted)]">강의 수</div>
                      <div className="mt-2 text-lg font-bold text-[#252d42]">{props.selectedCourse.lecture_count}개</div>
                    </div>
                    <div className="rounded-[24px] bg-[#f7f8fc] px-5 py-4">
                      <div className="text-sm text-[var(--muted)]">완료</div>
                      <div className="mt-2 text-lg font-bold text-[#252d42]">{props.selectedCourse.completed_lectures}개</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {props.selectedCourse.lectures.map((lecture) => (
                      <button
                        key={lecture.id}
                        className={[
                          'flex items-center justify-between rounded-[22px] px-5 py-4 text-left transition',
                          lecture.id === props.selectedLectureId
                            ? 'bg-[var(--accent-soft)] text-[#2b3147]'
                            : 'bg-[#f7f8fc] text-[#5f6880] hover:bg-[#f1f4fb]',
                        ].join(' ')}
                        onClick={() => props.onSelectLecture(lecture.id)}
                        type="button"
                      >
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                            {lecture.order_index + 1}강 · {lecture.duration_minutes}분
                          </div>
                          <div className="mt-2 text-[1.08rem] font-bold leading-7 text-[#252d42]">{lecture.title}</div>
                        </div>
                        <span className="text-xl text-[var(--muted)]">›</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[30px] border border-[color:var(--line)] bg-white p-7 shadow-[var(--shadow-soft)]">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">자료</div>
                <h3 className="mt-2 text-[1.7rem] font-black tracking-[-0.04em] text-[#252d42]">강의 자료</h3>
                <div className="mt-5 space-y-3">
                  {props.selectedCourse?.materials?.length ? (
                    props.selectedCourse.materials.slice(0, 3).map((material) => (
                      <div key={material.id} className="rounded-[22px] bg-[#f7f8fc] px-5 py-4">
                        <div className="text-lg font-bold text-[#252d42]">{material.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{material.summary}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-[#f7f8fc] px-5 py-4 text-[var(--muted)]">아직 등록된 자료가 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-[color:var(--line)] bg-white p-7 shadow-[var(--shadow-soft)]">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">공지</div>
                <h3 className="mt-2 text-[1.7rem] font-black tracking-[-0.04em] text-[#252d42]">강의 공지</h3>
                <div className="mt-5 space-y-3">
                  {props.selectedCourse?.notices?.length ? (
                    props.selectedCourse.notices.slice(0, 3).map((notice) => (
                      <div key={notice.id} className="rounded-[22px] bg-[#f7f8fc] px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-lg font-bold text-[#252d42]">{notice.title}</div>
                          {notice.pinned ? (
                            <span className="rounded-full bg-[var(--danger-soft)] px-3 py-1 text-xs font-bold text-[#cc5d7d]">고정</span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{notice.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-[#f7f8fc] px-5 py-4 text-[var(--muted)]">아직 등록된 공지가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {suggestedInsights.map((item) => (
              <InsightCard key={item.title} action={item.action} body={item.body} title={item.title} />
            ))}

            <div className="rounded-[30px] border border-[color:var(--line)] bg-white p-7 shadow-[var(--shadow-soft)]">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">AI 설정</div>
              <h3 className="mt-2 text-[1.7rem] font-black tracking-[-0.04em] text-[#252d42]">현재 추천 설정</h3>
              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] bg-[#f7f8fc] px-5 py-4">
                  <div className="text-sm text-[var(--muted)]">언어</div>
                  <div className="mt-1 text-lg font-bold text-[#252d42]">{props.settings?.language ?? 'ko'}</div>
                </div>
                <div className="rounded-[22px] bg-[#f7f8fc] px-5 py-4">
                  <div className="text-sm text-[var(--muted)]">추천 모드</div>
                  <div className="mt-1 text-lg font-bold text-[#252d42]">{props.settings?.recommendation_mode ?? 'balanced'}</div>
                </div>
                <div className="rounded-[22px] bg-[#f7f8fc] px-5 py-4">
                  <div className="text-sm text-[var(--muted)]">자동 요약</div>
                  <div className="mt-1 text-lg font-bold text-[#252d42]">{props.settings?.auto_summary ? '활성화' : '비활성화'}</div>
                </div>
              </div>
              <Button
                className="mt-6 w-full"
                onClick={() => void props.onSaveAISettings({ theme: 'light', recommendation_mode: 'balanced' })}
              >
                현재 설정 저장
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}
