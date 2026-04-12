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

  const totalStudents = courseCards.reduce((sum, course) => sum + course.student_count, 0);
  const totalProgress = Math.round(
    courseCards.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courseCards.length, 1),
  );

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
                onClick={() => scrollToElement(coursesRef.current)}
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
        <section className="grid gap-5">
          <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#6d62ef_0%,#4f46e5_46%,#7c3aed_100%)] px-7 py-8 text-white shadow-[0_30px_70px_rgba(79,70,229,0.16)] lg:px-8 lg:py-9">
            <div className="pointer-events-none absolute -right-8 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                AI 기반 맞춤형 학습 플랫폼
              </span>
              <h1 className="mt-5 text-[2.1rem] font-extrabold tracking-[-0.05em] text-white lg:text-[3.2rem]">
                내맘대로 배우고,
                <br />
                내맘대로 성장하세요
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-white/80 lg:text-[15px]">
                강의 탐색, 자동 STT 전사, 우측 챗봇, 숏폼 복습까지 하나의 흐름으로 이어지는 LMS 메인 화면입니다.
                로그인 전에는 탐색과 체험만, 로그인 후에는 학습과 제작이 바로 연결됩니다.
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
                  무료로 시작하기
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
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[20px] text-indigo-600">
              <i className="ri-book-open-line" />
            </div>
            <div className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">{courseCards.length}</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">총 강의</div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-[20px] text-violet-600">
              <i className="ri-user-follow-line" />
            </div>
            <div className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">{totalStudents}</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">수강생</div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[20px] text-emerald-600">
              <i className="ri-folder-2-line" />
            </div>
            <div className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">{categories.length}</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">카테고리</div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-[20px] text-amber-700">
              <i className="ri-robot-line" />
            </div>
            <div className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">활성</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">AI 기능</div>
          </article>
        </section>

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
