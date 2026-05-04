import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LoginResponse } from '@myway/shared';
import { CourseExploreCard } from '../components/CourseExploreCard';
import { StatePanel } from '../components/StatePanel';
import { loadManagedCourses } from '../../../lib/api';
import { demoCourses } from '../data/demo';

type MyCoursesPageProps = {
  session: LoginResponse;
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: 'my-courses' | 'course-create' | 'lecture-studio' | 'courses' | 'lecture-watch' | 'dashboard') => void;
};

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'progress' | 'completed';
type SortMode = 'progress' | 'title' | 'duration';

const primaryButtonClass =
  'inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white transition hover:bg-indigo-500';
const secondaryButtonClass =
  'inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600';

export function MyCoursesPage({ session, courses, selectedCourse, onSelectCourse, onNavigate }: MyCoursesPageProps) {
  const [managedCourses, setManagedCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('progress');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [notice, setNotice] = useState('내가 수강 중인 강의를 먼저 보고, 선택하면 상세와 진도율 화면으로 이어집니다.');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const result = await loadManagedCourses(session.session_token);
      if (!active) {
        return;
      }

      setManagedCourses(result);
      setLoading(false);
      setNotice(result.length > 0 ? `관리 중인 강의 ${result.length}개를 확인할 수 있습니다.` : '아직 관리 중인 강의가 없습니다.');
    }

    void load();

    return () => {
      active = false;
    };
  }, [session.session_token]);

  const enrolledCourses = courses.filter((course) => course.enrolled);
  const instructorCourses = managedCourses.length > 0
    ? managedCourses
    : courses.filter((course) => session.user.role === 'ADMIN' || course.instructor_id === session.user.id);
  const currentCourses = session.user.role === 'STUDENT' ? enrolledCourses : instructorCourses;
  const visibleCourses = currentCourses.length > 0 ? currentCourses : demoCourses;
  const primaryCourse = selectedCourse ?? visibleCourses[0] ?? null;
  const categories = ['all', ...new Set(visibleCourses.map((course) => course.category))];
  const primaryCourseTags = Array.isArray(primaryCourse?.tags) ? primaryCourse.tags : [];

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return visibleCourses
      .filter((course) => {
        const courseTags = Array.isArray(course.tags) ? course.tags : [];
        const queryMatch = query
          ? [course.title, course.category, course.description, course.instructor_name, ...courseTags].join(' ').toLowerCase().includes(query)
          : true;
        const categoryMatch = activeCategory === 'all' ? true : course.category === activeCategory;
        const statusMatch =
          statusFilter === 'all'
            ? true
            : statusFilter === 'progress'
              ? course.progress_percent > 0 && course.progress_percent < 100
              : course.progress_percent >= 100;

        return queryMatch && categoryMatch && statusMatch;
      })
      .sort((left, right) => {
        if (sortMode === 'title') {
          return left.title.localeCompare(right.title);
        }
        if (sortMode === 'duration') {
          return right.total_duration_minutes - left.total_duration_minutes;
        }

        return right.progress_percent - left.progress_percent;
      });
  }, [activeCategory, searchQuery, sortMode, statusFilter, visibleCourses]);

  const stats = useMemo(
    () => ({
      total: visibleCourses.length,
      published: visibleCourses.filter((course) => course.is_published).length,
      totalLectures: visibleCourses.reduce((sum, course) => sum + course.lecture_count, 0),
      inProgress: visibleCourses.filter((course) => course.progress_percent > 0 && course.progress_percent < 100).length,
    }),
    [visibleCourses],
  );
  const totalLabel = session.user.role === 'STUDENT' ? '수강 중 강의 수' : '관리 강의 수';
  const publishedLabel = session.user.role === 'STUDENT' ? '완료 강의' : '공개 강의';

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <i className="ri-book-open-line" />
              내 강의
            </div>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
              수강 중인 강의를
              <br />
              카드로 빨리 찾고, 바로 이어서 학습합니다.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">{notice}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 text-[12px] text-white/80 backdrop-blur">
            <div className="font-semibold text-white">{session.user.name}</div>
            <div className="mt-1">{session.user.role}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[11px] text-white/60">진행 중</div>
                <div className="mt-1 text-[16px] font-bold text-white">{stats.inProgress}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[11px] text-white/60">총 차시</div>
                <div className="mt-1 text-[16px] font-bold text-white">{stats.totalLectures}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.total}</div>
          <div className="mt-1 text-[12px] text-slate-500">{totalLabel}</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.published}</div>
          <div className="mt-1 text-[12px] text-slate-500">{publishedLabel}</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.totalLectures}</div>
          <div className="mt-1 text-[12px] text-slate-500">총 차시 수</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.inProgress}</div>
          <div className="mt-1 text-[12px] text-slate-500">진행 중 강의</div>
        </article>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{session.user.role === 'STUDENT' ? '수강 중인 강의' : '관리 중인 강의'}</h3>
            <p className="mt-1 text-[12px] text-slate-500">
              {session.user.role === 'STUDENT'
                ? '선택한 강의를 누르면 상세와 진도율을 먼저 보고, 이어서 시청 화면으로 이동할 수 있습니다.'
                : notice}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate(session.user.role === 'STUDENT' ? 'dashboard' : 'course-create')}
              className={secondaryButtonClass}
            >
              {session.user.role === 'STUDENT' ? '대시보드로 이동' : '새 강의 개설'}
            </button>
            {session.user.role !== 'STUDENT' ? (
              <button
                type="button"
                onClick={() => onNavigate('lecture-studio')}
                className={primaryButtonClass}
              >
                제작 스튜디오
              </button>
            ) : null}
          </div>
        </div>

        {primaryCourse ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-[12px] font-semibold text-indigo-600">선택 강의 미리보기</div>
              <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">{primaryCourse.title}</div>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">
                {primaryCourse.category} · {primaryCourse.lecture_count}차시 · {primaryCourse.progress_percent}% 진행
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(primaryCourse.progress_percent, 8)}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourse(primaryCourse.id);
                    onNavigate('courses');
                  }}
                  className={primaryButtonClass}
                >
                  상세/진도율 보기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourse(primaryCourse.id);
                    onNavigate('lecture-watch');
                  }}
                  className={secondaryButtonClass}
                >
                  차시 시청으로 이동
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5">
              <div className="text-[12px] font-semibold text-slate-500">현재 역할</div>
              <div className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">{session.user.role}</div>
              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">강의 상태</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">{primaryCourse.is_published ? '공개' : '비공개'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">총 러닝타임</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">{primaryCourse.total_duration_minutes}분</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">태그</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {primaryCourseTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(160px,180px)_minmax(160px,180px)_minmax(240px,280px)]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="강좌명, 강사, 태그 검색"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">카테고리</span>
              <select
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? '전체' : category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">정렬</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400"
              >
                <option value="progress">진도순</option>
                <option value="title">제목순</option>
                <option value="duration">러닝타임순</option>
              </select>
            </label>

            <div className="flex items-end justify-between gap-2">
              <div className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">뷰</span>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`h-9 rounded-lg px-3 text-[11px] font-semibold ${
                      viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    그리드
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`h-9 rounded-lg px-3 text-[11px] font-semibold ${
                      viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    리스트
                  </button>
                </div>
              </div>
              <div className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">상태</span>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
                  {(['all', 'progress', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`h-9 rounded-lg px-3 text-[11px] font-semibold ${
                        statusFilter === status ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {status === 'all' ? '전체' : status === 'progress' ? '진행 중' : '완료'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="ml-auto rounded-xl bg-indigo-50 px-3.5 py-1.5 text-[12px] font-semibold text-indigo-600">
            검색 결과 {filteredCourses.length}개
          </div>
        </div>

        {loading ? (
          <div className="mt-4 rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            내 강의 목록을 불러오는 중입니다.
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="mt-4">
            <StatePanel
              compact
              icon="ri-search-line"
              tone="slate"
              title="조건에 맞는 강의가 없습니다."
              description="검색어, 카테고리, 상태 필터를 바꾸면 원하는 강의를 다시 찾을 수 있습니다."
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filteredCourses.map((course) => (
              <CourseExploreCard
                key={course.id}
                course={course}
                selected={selectedCourse?.id === course.id}
                onSelect={onSelectCourse}
                onOpen={(courseId) => {
                  onSelectCourse(courseId);
                  onNavigate('courses');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredCourses.map((course) => {
              const active = selectedCourse?.id === course.id;
              return (
                <article
                  key={course.id}
                  className={`flex flex-col gap-3 rounded-[24px] border px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center ${
                    active ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex h-24 w-full flex-shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#4f46e5,#2563eb,#7c3aed)] text-white lg:w-44">
                    <i className="ri-play-circle-fill text-[42px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">{course.title}</div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {course.category} · {course.instructor_name} · {course.lecture_count}차시
                        </div>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        {course.progress_percent}%
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-slate-500">{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course.id)}
                        className={primaryButtonClass}
                      >
                        선택
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCourse(course.id);
                          onNavigate('lecture-watch');
                        }}
                        className={secondaryButtonClass}
                      >
                        시청하기
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
