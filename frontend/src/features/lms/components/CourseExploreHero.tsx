type CourseExploreHeroProps = {
  totalCourses: number;
  enrolledCourses: number;
  availableCourses: number;
  categoryCount: number;
  tagCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  featuredTags: string[];
};

export function CourseExploreHero({
  totalCourses,
  enrolledCourses,
  availableCourses,
  categoryCount,
  tagCount,
  searchQuery,
  onSearchChange,
  featuredTags,
}: CourseExploreHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] lg:px-7 lg:py-7">
      <div className="absolute -right-6 -top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
            <i className="ri-compass-3-line" />
            강의 탐색
          </div>
          <h1 className="mt-4 text-[26px] font-extrabold tracking-[-0.05em] lg:text-[30px]">
            강의가 많아도, 원하는 코스를 바로 찾도록
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-7 text-white/75 lg:text-[14px]">
            검색, 카테고리 필터, 수강 상태 탭을 한 번에 배치해 레퍼런스처럼 첫 화면에서 탐색 의도가 바로 보이도록 정리했습니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
              전체 {totalCourses}개
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
              수강 중 {enrolledCourses}개
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
              수강 가능 {availableCourses}개
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
              {categoryCount}개 카테고리
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
              {tagCount}개 태그
            </span>
          </div>
        </div>

        <div className="w-full lg:max-w-[380px]">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Search</label>
          <div className="relative">
            <i className="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="강좌명, 카테고리, 태그, 강사명 검색"
              className="h-12 w-full rounded-2xl border-0 bg-white/95 pl-11 pr-4 text-[13px] text-slate-900 shadow-[0_18px_32px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-300"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {featuredTags.length > 0 ? (
              featuredTags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur">
                추천 태그가 없습니다.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
