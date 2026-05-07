import { useMemo, useRef, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import { CourseExploreFilters } from '../components/CourseExploreFilters';

type PublicHomePageProps = {
  courseCards: CourseCard[];
  busy: boolean;
  onOpenLogin: () => void;
};

const navItems = [
  { label: '홈', icon: 'ri-home-5-line' },
  { label: '강의 탐색', icon: 'ri-book-open-line' },
  { label: 'AI 도구', icon: 'ri-robot-line' },
  { label: '학습 로드맵', icon: 'ri-route-line' },
  { label: '커뮤니티', icon: 'ri-group-line' },
];

function countUnique(values: string[]): number {
  return new Set(values).size;
}

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function thumbnailGradient(palette: CourseCard['thumbnail_palette']) {
  if (palette === 'emerald') return 'from-emerald-900 via-emerald-700 to-teal-500';
  if (palette === 'violet') return 'from-violet-950 via-purple-700 to-fuchsia-500';
  if (palette === 'amber') return 'from-amber-950 via-amber-700 to-orange-400';
  return 'from-blue-950 via-cyan-800 to-sky-500';
}

export function PublicHomePage({ courseCards, busy, onOpenLogin }: PublicHomePageProps) {
  const coursesRef = useRef<HTMLElement | null>(null);
  const roadmapRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | 'available' | 'enrolled'>('all');

  const categories = useMemo(() => [...new Set(courseCards.map((item) => item.category))], [courseCards]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courseCards.filter((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      const queryMatch = query
        ? [course.title, course.description, course.category, course.instructor_name, ...tags].join(' ').toLowerCase().includes(query)
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

  const featuredCourses = filteredCourses.slice(0, 5);
  const featuredTags = useMemo(() => {
    const counts = new Map<string, number>();

    courseCards.forEach((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [courseCards]);

  const totalProgress = Math.round(
    courseCards.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courseCards.length, 1),
  );
  const tagCount = countUnique(courseCards.flatMap((course) => (Array.isArray(course.tags) ? course.tags : [])));

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <header className="sticky top-0 z-30 border-b border-cyan-100/20 bg-[linear-gradient(90deg,#113454,#174667_50%,#1b4f71)] text-cyan-50 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-200">
              <i className="ri-bubble-chart-fill text-[18px]" />
            </span>
            <div className="text-[31px] font-black tracking-[-0.02em]">내맘대로</div>
          </div>

          <nav className="hidden items-center gap-6 text-[13px] font-semibold text-cyan-50/85 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.label === '강의 탐색') {
                    scrollToElement(coursesRef.current);
                    return;
                  }
                  if (item.label === '학습 로드맵') {
                    scrollToElement(roadmapRef.current);
                    return;
                  }
                  if (item.label === 'AI 도구' || item.label === '커뮤니티') {
                    onOpenLogin();
                  }
                }}
                className="transition hover:text-cyan-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenLogin} className="rounded-full border border-cyan-100/30 px-4 py-2 text-[12px] font-semibold text-cyan-50 hover:bg-white/10">
              로그인
            </button>
            <button type="button" onClick={onOpenLogin} className="rounded-full bg-cyan-300 px-4 py-2 text-[12px] font-bold text-cyan-950 hover:bg-cyan-200">
              시작하기
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[26px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.26),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(15,118,110,0.34),transparent_42%),linear-gradient(125deg,#05213f_0%,#0c365f_56%,#115078_100%)] p-6 text-white shadow-[0_24px_58px_rgba(10,30,64,0.36)] lg:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-[40px] font-black tracking-[-0.04em] lg:text-[56px]">AI로 배우고,<br />성장하는 실력</h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-cyan-50/90">
                2026년, 당신의 커리어를 바꿀 가장 확실한 선택. 로그인 전에도 인기 강의와 AI 추천 흐름을 먼저 경험해보세요.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => scrollToElement(coursesRef.current)} className="rounded-xl bg-cyan-300 px-5 py-2.5 text-[13px] font-bold text-cyan-950 hover:bg-cyan-200">
                  강의 탐색 시작
                </button>
                <button type="button" onClick={onOpenLogin} className="rounded-xl border border-cyan-100/30 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-cyan-50 hover:bg-white/20">
                  로그인 후 계속
                </button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="absolute inset-0 rounded-[30px] bg-cyan-300/20 blur-2xl" />
              <div className="relative rounded-[30px] border border-cyan-100/25 bg-white/10 p-5 backdrop-blur">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[24px] border border-cyan-200/35 bg-gradient-to-br from-cyan-200/95 to-cyan-400/75 text-[46px] font-black text-slate-900">AI</div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-cyan-50">
                  <div className="rounded-2xl border border-cyan-100/20 bg-slate-900/35 px-3 py-2">
                    <div className="text-[11px] text-cyan-100/80">평균 진도</div>
                    <div className="mt-1 text-[18px] font-extrabold">{totalProgress}%</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-100/20 bg-slate-900/35 px-3 py-2">
                    <div className="text-[11px] text-cyan-100/80">강의 수</div>
                    <div className="mt-1 text-[18px] font-extrabold">{courseCards.length}개</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={roadmapRef} className="rounded-[22px] border border-cyan-200/20 bg-[linear-gradient(145deg,#0a2f56_0%,#0b3c63_45%,#11496f_100%)] p-5 text-cyan-50 shadow-[0_14px_36px_rgba(8,47,73,0.35)] lg:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.02em]">원하는 강의를 찾아보세요</h2>
              <div className="mt-4 flex items-center rounded-2xl border border-cyan-100/30 bg-white/95 px-4 py-3 text-slate-700">
                <i className="ri-search-line text-[18px] text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="강의명, 키워드, 스킬 등을 검색해보세요"
                  className="ml-3 w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(featuredTags.length > 0 ? featuredTags : ['프롬프트 엔지니어링', 'ChatGPT 활용', '파이썬']).map((tag) => (
                  <button key={tag} type="button" onClick={() => setSearchQuery(tag)} className="rounded-full border border-cyan-100/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-50/95 hover:bg-white/20">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-4 backdrop-blur">
              <div className="text-[12px] font-semibold text-cyan-100/85">AI 맞춤 추천</div>
              <div className="mt-2 text-[15px] font-bold text-white">학습 목표 기반 코스 추천</div>
              <p className="mt-1 text-[12px] leading-6 text-cyan-100/80">로그인하면 강의 상세, 챗봇 학습, 숏폼 복습까지 한번에 연결됩니다.</p>
              <button type="button" onClick={onOpenLogin} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-cyan-200/35 bg-cyan-300/20 px-3 py-1.5 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-300/30">
                로그인 후 추천 보기
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>
        </section>

        <section ref={coursesRef} className="space-y-4">
          <CourseExploreFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            resultCount={filteredCourses.length}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">추천 강의</h2>
            <button type="button" onClick={onOpenLogin} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 hover:text-cyan-900">
              전체 보기
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={onOpenLogin}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`relative h-32 bg-gradient-to-br ${thumbnailGradient(course.thumbnail_palette)}`}>
                    <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {course.difficulty === 'advanced' ? 'BEST' : 'NEW'}
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
                    <div className="absolute bottom-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{course.category}</div>
                  </div>
                  <div className="space-y-2 px-3 py-3">
                    <div className="line-clamp-1 text-[15px] font-bold tracking-[-0.02em] text-slate-900">{course.title}</div>
                    <div className="line-clamp-1 text-[12px] text-slate-500">{course.description}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">
                        {course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}
                      </span>
                      <span>{Math.max(course.total_duration_minutes, 0) > 60 ? `${Math.round(course.total_duration_minutes / 60)}시간` : `${course.total_duration_minutes}분`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>★ {Number.isFinite(course.rating) ? course.rating.toFixed(1) : '4.8'}</span>
                      <span>수강 {Number.isFinite(course.student_count) ? course.student_count : 0}</span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-5 rounded-3xl border border-slate-200 bg-white px-5 py-8 text-center text-[13px] leading-6 text-slate-500 shadow-sm">
                검색 결과가 없습니다. 검색어, 카테고리, 수강 상태를 바꿔 보세요.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
