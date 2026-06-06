export function MyShortformsControls({
  query,
  onQueryChange,
  tab,
  onTabChange,
  status,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  tab: 'videos' | 'courses';
  onTabChange: (value: 'videos' | 'courses') => void;
  status: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="숏폼 제목, 설명, 코스 ID 검색"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] outline-none focus:border-cyan-300"
          />
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onTabChange('videos')} className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tab === 'videos' ? 'bg-cyan-600 text-white' : 'border border-slate-200 text-slate-600'}`}>
            숏폼
          </button>
          <button type="button" onClick={() => onTabChange('courses')} className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tab === 'courses' ? 'bg-cyan-600 text-white' : 'border border-slate-200 text-slate-600'}`}>
            개인 코스
          </button>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-slate-500">{status}</p>
    </section>
  );
}
