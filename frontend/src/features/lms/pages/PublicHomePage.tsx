import type { CourseCard } from '@myway/shared';
import { PublicHomeCourseSection, PublicHomeHeroSection } from './PublicHomePageSections';
import { usePublicHomePageState } from './usePublicHomePageState';

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

export function PublicHomePage({ courseCards, busy, onOpenLogin }: PublicHomePageProps) {
  const {
    coursesRef,
    roadmapRef,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeStatus,
    setActiveStatus,
    categories,
    filteredCourses,
    featuredCourses,
    featuredTags,
    totalProgress,
    tagCount,
    scrollToCourses,
    scrollToRoadmap,
  } = usePublicHomePageState({ courseCards });

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
                    scrollToCourses();
                    return;
                  }
                  if (item.label === '학습 로드맵') {
                    scrollToRoadmap();
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
        <PublicHomeHeroSection
          coursesRef={coursesRef}
          roadmapRef={roadmapRef}
          totalProgress={totalProgress}
          courseCount={courseCards.length}
          featuredTags={featuredTags}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onTagClick={setSearchQuery}
          onOpenLogin={onOpenLogin}
        />

        <section className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-slate-900">학습 현황</h2>
              <p className="mt-1 text-[12px] text-slate-500">전체 코스, 태그 수, 검색 상태를 한눈에 확인합니다.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">로딩 {busy ? '진행 중' : '완료'}</span>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">코스 {courseCards.length}개</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">태그 {tagCount}개</span>
            </div>
          </div>
        </section>

        <PublicHomeCourseSection
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          resultCount={filteredCourses.length}
          featuredCourses={featuredCourses}
          onOpenLogin={onOpenLogin}
        />
      </main>
    </div>
  );
}
