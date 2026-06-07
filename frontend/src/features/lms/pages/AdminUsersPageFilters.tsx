import type { AuthUser } from '@myway/shared';

type AdminUsersPageFiltersProps = {
  query: string;
  roleFilter: 'all' | AuthUser['role'];
  totalCount: number;
  filteredUsersLength: number;
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (filter: 'all' | AuthUser['role']) => void;
};

export function AdminUsersPageFilters({ query, roleFilter, totalCount, filteredUsersLength, onQueryChange, onRoleFilterChange }: AdminUsersPageFiltersProps) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="이름, 이메일, 학과, 역할 검색"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400"
          />
        </label>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {[
            { key: 'all', label: '전체' },
            { key: 'ADMIN', label: '운영자' },
            { key: 'INSTRUCTOR', label: '교강사' },
            { key: 'STUDENT', label: '수강생' },
          ].map((item) => {
            const active = roleFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onRoleFilterChange(item.key as 'all' | AuthUser['role'])}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                  active ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">전체 {totalCount}명</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">검색 결과 {filteredUsersLength}명</span>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">역할별 색상 적용</span>
      </div>
    </section>
  );
}
