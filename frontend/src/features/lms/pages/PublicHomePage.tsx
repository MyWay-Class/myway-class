import { useMemo, useRef, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { CourseExploreCard } from '../components/CourseExploreCard';
import { CourseExploreFilters } from '../components/CourseExploreFilters';

type PublicHomePageProps = {
  courseCards: CourseCard[];
  busy: boolean;
  onOpenLogin: () => void;
};

const navItems = [
  { label: '강의', icon: 'ri-book-open-line' },
  { label: '숏폼', icon: 'ri-scissors-cut-line' },
  { label: '챗봇', icon: 'ri-robot-line' },
  { label: '로드맵', icon: 'ri-route-line' },
];

function countUnique(values: string[]): number {
  return new Set(values).size;
}

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function PublicHomePage({ courseCards, busy, onOpenLogin }: PublicHomePageProps) {
  const coursesRef = useRef<HTMLElement | null>(null);
  const shortformRef = useRef<HTMLElement | null>(null);
  const roadmapRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | 'available' | 'enrolled'>('all');
  const [notice, setNotice] = useState(
    '로그인 후에는 강의 상세, 우측 챗봇, 숏폼 만들기까지 한 흐름으로 사용할 수 있습니다.',
  );

  const categories = useMemo(() => [...new Set(courseCards.map((item) => item.category))], [courseCards]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courseCards.filter((course) => {
      const queryMatch = query
        ? [course.title, course.description, course.category, course.instructor_name, ...course.tags].join(' ').toLowerCase().includes(query)
        : true;
      const categoryMatch = activeCategory ? course.category === activeCategory : true;
      const statusMatch =
        activeStatus === 'all'
          ? true
          : activeStatus === 'available'
            ? !course.enrolled
            : course.enrolled;

      return queryMatch && categoryMatch && statusMatch;
    });
  }, [activeCategory, activeStatus, courseCards, searchQuery]);

  const featuredCourses = filteredCourses.slice(0, 6);
  const featuredTags = useMemo(() => {
    const counts = new Map<string, number>();

    courseCards.forEach((course) => {
      course.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [courseCards]);

  const totalProgress = Math.round(
    courseCards.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courseCards.length, 1),
  );
  const visualCourses = courseCards.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <i className="ri-play-circle-fill text-[20px]" />
            </div>
            <div>
              <div className="text-[16px] font-extrabold tracking-[-0.03em] text-slate-900">내맘대로클래스</div>
              <div className="text-[11px] text-slate-500">AI 기반 맞춤형 학습 플랫폼</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.label === '강의') {
                    scrollToElement(coursesRef.current);
                    return;
                  }

                  if (item.label === '숏폼') {
                    scrollToElement(shortformRef.current);
                    return;
                  }

                  if (item.label === '챗봇') {
                    onOpenLogin();
                    return;
                  }

                  scrollToElement(roadmapRef.current);
                }}
                className="flex items-center gap-2 transition hover:text-indigo-600"
              >
                <i className={`${item.icon} text-base`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              로그인
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
            >
              회원가입
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-7 py-8 text-white shadow-[0_30px_70px_rgba(15,23,42,0.16)] lg:px-8 lg:py-9">
            <div className="pointer-events-none absolute -right-8 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                강의 탐색 허브
              </span>
              <h1 className="mt-5 text-[2.1rem] font-extrabold tracking-[-0.05em] text-white lg:text-[3.2rem]">
                찾기 쉽고,
                <br />
                보기 쉬운 학습 화면
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-white/80 lg:text-[15px]">
                검색, 카테고리, 추천 강의, 이미지 섹션을 첫 화면에 모아두고 상세와 시청은 다음 단계로 분리했습니다.
                사용자는 무엇부터 눌러야 하는지 바로 알 수 있습니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToElement(coursesRef.current)}
                  className="rounded-full bg-white px-5 py-3 text-[13px] font-semibold text-indigo-700 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5"
                >
                  강의 탐색하기
                </button>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  로그인 후 계속
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {featuredTags.length > 0 ? (
                  featuredTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur">
                    추천 태그가 없습니다.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Search</div>
                  <h2 className="mt-2 text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">원하는 강의를 바로 찾기</h2>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  로그인
                </button>
              </div>
              <div className="mt-4 relative">
                <i className="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="강좌명, 카테고리, 태그, 강사명 검색"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] text-slate-500">평균 진도</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{totalProgress}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] text-slate-500">강의</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{courseCards.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] text-slate-500">카테고리</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{categories.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] text-slate-500">태그</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{countUnique(courseCards.flatMap((course) => course.tags))}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {visualCourses.length > 0 ? (
                visualCourses.map((course) => (
                  <article
                    key={course.id}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="relative h-32 bg-[linear-gradient(135deg,#4338ca,#1d4ed8)]">
                      <div className="absolute inset-0 opacity-20">
                        <i className={`${course.thumbnail_palette === 'emerald' ? 'ri-layout-grid-line' : course.thumbnail_palette === 'violet' ? 'ri-video-line' : course.thumbnail_palette === 'amber' ? 'ri-lightbulb-flash-line' : 'ri-brain-line'} absolute -right-5 -bottom-5 text-[92px] text-white`} />
                      </div>
                      <div className="absolute left-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {course.category}
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <div className="text-[11px] text-slate-500">{course.instructor_name}</div>
                      <div className="mt-1 line-clamp-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">{course.title}</div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{course.lecture_count}강의</span>
                        <span>{course.enrolled ? `${course.progress_percent}% 진행` : '수강 전'}</span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="sm:col-span-3 rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-7 text-center text-[13px] text-slate-500">
                  아직 소개할 강의가 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section ref={roadmapRef} className="space-y-4">
          <CourseExploreFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            resultCount={filteredCourses.length}
          />

          <AiNoticeBanner
            title="추천 흐름"
            description={notice}
            tone="indigo"
            meta={`${totalProgress}% 평균 진도 · ${countUnique(courseCards.flatMap((course) => course.tags))}개 태그`}
          />
        </section>

        <section ref={coursesRef} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">추천 강의</h2>
              <p className="mt-1 text-[12px] text-slate-500">카드를 눌러 로그인 후 상세, 챗봇, 숏폼으로 이어갈 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              로그인 후 계속
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <CourseExploreCard
                  key={course.id}
                  course={course}
                  selected={false}
                  onSelect={() => {
                    setNotice('로그인 후에는 강의 상세, 영상 보기, 우측 챗봇, 숏폼 만들기를 사용할 수 있습니다.');
                    onOpenLogin();
                  }}
                />
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-slate-200 bg-white px-5 py-8 text-center text-[13px] leading-6 text-slate-500 shadow-sm">
                검색 결과가 없습니다. 검색어, 카테고리, 수강 상태를 바꿔 보세요.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
