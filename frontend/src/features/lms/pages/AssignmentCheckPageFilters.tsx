import type { ReviewStatus } from './AssignmentCheckPageSections';

type AssignmentCheckPageFiltersProps = {
  reviewStatus: ReviewStatus;
  searchQuery: string;
  onReviewStatusChange: (status: ReviewStatus) => void;
  onSearchQueryChange: (query: string) => void;
};

export function AssignmentCheckPageFilters({
  reviewStatus,
  searchQuery,
  onReviewStatusChange,
  onSearchQueryChange,
}: AssignmentCheckPageFiltersProps) {
  return (
    <section className="rounded-[30px] border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="과제명, 강의명, 강사명, 피드백 검색"
            className="h-11 w-full rounded-2xl border border-[#cce0f2] bg-[#f4faff] px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-[#7e94ad] focus:border-cyan-400"
          />
        </label>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '검토 대기' },
            { key: 'reviewed', label: '검토 완료' },
            { key: 'flagged', label: '보완 필요' },
          ].map((item) => {
            const active = reviewStatus === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onReviewStatusChange(item.key as ReviewStatus)}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                  active
                    ? 'bg-[linear-gradient(135deg,#00b8e6_0%,#0077b6_100%)] text-white'
                    : 'border border-[#cce0f2] bg-white text-[#4a6885] hover:border-cyan-300 hover:text-cyan-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
