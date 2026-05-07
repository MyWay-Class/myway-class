type CourseExploreFiltersProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  activeStatus: 'all' | 'available' | 'enrolled';
  onStatusChange: (value: 'all' | 'available' | 'enrolled') => void;
  resultCount: number;
};

const statusTabs: { key: 'all' | 'available' | 'enrolled'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'available', label: '수강 가능' },
  { key: 'enrolled', label: '수강 중' },
];

const categoryIcons: Record<string, string> = {
  AI: 'ri-robot-2-line',
  Web: 'ri-code-s-slash-line',
  Data: 'ri-database-2-line',
};

export function CourseExploreFilters({
  categories,
  activeCategory,
  onCategoryChange,
  activeStatus,
  onStatusChange,
  resultCount,
}: CourseExploreFiltersProps) {
  const uniqueCategories = [...new Set(categories.filter((category) => typeof category === 'string' && category.trim().length > 0))];
  const selectedCount = (activeCategory ? 1 : 0) + (activeStatus === 'all' ? 0 : 1);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[12px] font-semibold text-slate-900">카테고리와 상태로 빠르게 거르기</div>
          <p className="mt-1 text-[12px] text-slate-500">검색 결과 {resultCount}개 · 적용된 필터 {selectedCount}개</p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {statusTabs.map((tab) => {
            const active = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusChange(tab.key)}
                className={`min-h-9 rounded-lg px-3.5 text-[11px] font-semibold transition ${
                  active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
                aria-pressed={active}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-[12px] font-semibold transition ${
            !activeCategory
              ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
          }`}
          aria-pressed={!activeCategory}
        >
          <i className="ri-apps-2-line text-[16px]" />
          전체
        </button>
        {uniqueCategories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-[12px] font-semibold transition ${
                active
                  ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
              }`}
              aria-pressed={active}
            >
              <i className={`${categoryIcons[category] ?? 'ri-book-2-line'} text-[16px]`} />
              {category}
              {active ? <i className="ri-check-line text-[15px]" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
