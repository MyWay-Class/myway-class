type AdminFilterChip = {
  label: string;
  active: boolean;
  onSelect: () => void;
};

type AdminSortOption = {
  label: string;
  value: string;
};

type AdminFilterBarProps = {
  title: string;
  subtitle: string;
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  sortLabel: string;
  sortValue: string;
  sortOptions: AdminSortOption[];
  onSortChange: (value: string) => void;
  chips?: AdminFilterChip[];
};

export function AdminFilterBar({
  title,
  subtitle,
  query,
  onQueryChange,
  queryPlaceholder,
  sortLabel,
  sortValue,
  sortOptions,
  onSortChange,
  chips,
}: AdminFilterBarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-[12px] leading-6 text-slate-500">{subtitle}</p>
        </div>

        <label className="flex min-w-[240px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
          <i className="ri-search-line text-slate-400" />
          <input
            className="w-full bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={queryPlaceholder}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips?.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onSelect}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                chip.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          {sortLabel}
          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-900 outline-none"
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
