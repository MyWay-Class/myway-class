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
  const [notice, setNotice] = useState('학습 흐름은 탐색 > 비교 > 등록 > 학습 > 숏폼 생성 순서로 설계되어 있습니다.');

  const categories = useMemo(() => [...new Set(courseCards.map((item) => item.category))], [courseCards]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courseCards.filter((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      const queryMatch = query
        ? [course.title, course.description, course.category, course.instructor_name, ...tags]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;
      const categoryMatch = activeCategory ? course.category === activeCategory : true;
      const statusMatch =
        activeStatus === 'all' ? true : activeStatus === 'available' ? !course.enrolled : course.enrolled;

      return queryMatch && categoryMatch && statusMatch;
    });
  }, [activeCategory, activeStatus, courseCards, searchQuery]);

  const featuredCourses = filteredCourses.slice(0, 6);
  const featuredTags = useMemo(() => {
    const counts = new Map<string, number>();

    courseCards.forEach((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [courseCards]);

  const totalProgress = Math.round(
    courseCards.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courseCards.length, 1),
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pb-24 lg:pb-8">
      <a href="#courses" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900">
        강의 목록으로 건너뛰기
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-[0_8px_20px_rgba(13,148,136,0.35)]">
              <i className="ri-graduation-cap-fill text-[20px]" />
            </div>
            <div>
              <div className="text-[16px] font-extrabold tracking-[-0.03em] text-slate-900">내맘대로클래스</div>
              <div className="text-[11px] text-slate-500">AI Learning Workspace</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-[13px] font-semibold text-slate-600 lg:flex">
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
                className="min-h-10 rounded-xl px-3 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <i className={`${item.icon} text-base`} />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onOpenLogin}
            disabled={busy}
            className="min-h-11 rounded-xl bg-slate-900 px-4 text-[12px] font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? '처리 중...' : '로그인'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(120deg,#082f49_0%,#0f766e_54%,#1f2937_100%)] p-6 text-white shadow-[0_20px_60px_rgba(8,47,73,0.25)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-70px] left-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white/90">
                2026 UX 기준 반영
              </p>
              <h1 className="mt-4 text-[2rem] font-extrabold tracking-[-0.04em] leading-tight sm:text-[2.4rem] lg:text-[2.9rem]">
                먼저 해야 할 행동이
                <br />
                바로 보이는 학습 UI
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-white/85 sm:text-[15px]">
                첫 화면에서 탐색, 비교, 등록, 학습 시작까지 한 단계씩 이어지도록 구성했습니다. 중요한 정보는 위로 올리고,
                보조 정보는 카드 단위로 분리해 스캔 속도를 높였습니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToElement(coursesRef.current)}
                  className="min-h-11 rounded-xl bg-white px-5 text-[13px] font-bold text-slate-900 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  강의 탐색 시작
                </button>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="min-h-11 rounded-xl border border-white/30 bg-white/10 px-5 text-[13px] font-semibold text-white backdrop-blur"
                >
                  개인 대시보드 열기
                </button>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/75">Live Metrics</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-[11px] text-white/70">평균 진도</div>
                  <div className="mt-1 text-[22px] font-extrabold">{totalProgress}%</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-[11px] text-white/70">활성 강의</div>
                  <div className="mt-1 text-[22px] font-extrabold">{courseCards.length}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-[11px] text-white/70">카테고리</div>
                  <div className="mt-1 text-[22px] font-extrabold">{categories.length}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-[11px] text-white/70">핵심 태그</div>
                  <div className="mt-1 text-[22px] font-extrabold">
                    {countUnique(courseCards.flatMap((course) => (Array.isArray(course.tags) ? course.tags : [])))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">강의 빠른 검색</h2>
            <p className="mt-1 text-[13px] text-slate-600">강좌명, 카테고리, 태그, 강사명으로 즉시 필터링됩니다.</p>
            <div className="relative mt-4">
              <i className="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="예: React, 데이터 분석, 김강사"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
            <div className="text-[12px] font-semibold text-slate-500">인기 태그</div>
            <div className="flex flex-wrap gap-2">
              {featuredTags.length > 0 ? (
                featuredTags.map((tag) => (
                  <span key={tag} className="min-h-8 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-slate-500">추천 태그가 없습니다.</span>
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
            title="추천 학습 흐름"
            description={notice}
            tone="indigo"
            meta={`${totalProgress}% 평균 진도 · ${featuredCourses.length}개 추천 카드`}
          />
        </section>

        <section id="courses" ref={coursesRef} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">추천 강의</h2>
              <p className="mt-1 text-[13px] text-slate-600">카드 선택 시 상세 학습 흐름으로 연결됩니다.</p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              학습 계속하기
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
                    setNotice('로그인 후 강의 상세, 영상 보기, 챗봇, 숏폼 제작 기능을 사용할 수 있습니다.');
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

        <section ref={shortformRef} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">숏폼 제작 스튜디오</h3>
              <p className="mt-1 text-[13px] text-slate-600">강의 학습 후 주요 구간만 추출해 숏폼으로 전환할 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="min-h-11 rounded-xl bg-cyan-600 px-4 text-[12px] font-semibold text-white hover:bg-cyan-500"
            >
              숏폼 만들기
            </button>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
        <ul className="grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
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
                className="min-h-12 w-full rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                <span className="flex flex-col items-center gap-1">
                  <i className={`${item.icon} text-[18px]`} />
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
