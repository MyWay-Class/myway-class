import { useMemo, useState } from 'react';
import type { AuthUser } from '@myway/shared';
import { roleLabel } from '../config';
import { StatePanel } from '../components/StatePanel';

type AdminUsersPageProps = {
  users: AuthUser[];
};

type RoleFilter = 'all' | AuthUser['role'];

const roleBadgeClasses: Record<AuthUser['role'], string> = {
  ADMIN: 'bg-amber-100 text-amber-700',
  INSTRUCTOR: 'bg-emerald-100 text-emerald-600',
  STUDENT: 'bg-indigo-100 text-indigo-600',
};

const roleToneClasses: Record<AuthUser['role'], string> = {
  ADMIN: 'border-amber-200 bg-amber-50 text-amber-700',
  INSTRUCTOR: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  STUDENT: 'border-indigo-200 bg-indigo-50 text-indigo-600',
};

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery = normalized
        ? [user.name, user.email, user.department, user.bio, user.role, roleLabel(user.role)].join(' ').toLowerCase().includes(normalized)
        : true;
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter, users]);

  const counts = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((user) => user.role === 'ADMIN').length,
      instructor: users.filter((user) => user.role === 'INSTRUCTOR').length,
      student: users.filter((user) => user.role === 'STUDENT').length,
    }),
    [users],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <i className="ri-user-settings-line" />
              사용자 관리
            </div>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
              역할별 사용자와
              <br />
              활동 상태를 빠르게 찾습니다.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
              검색과 역할 필터를 함께 써서 필요한 계정만 빠르게 좁힐 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">전체</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{counts.total}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">수강생</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{counts.student}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">교강사</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{counts.instructor}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">운영자</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{counts.admin}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름, 이메일, 학과, 역할 검색"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
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
                  onClick={() => setRoleFilter(item.key as RoleFilter)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">전체 {counts.total}명</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">검색 결과 {filteredUsers.length}명</span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">역할별 색상 적용</span>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-hidden rounded-[30px] md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">이름</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">이메일</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">역할</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">학과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${roleToneClasses[user.role]}`}>
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">{user.bio}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleBadgeClasses[user.role]}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <article key={user.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold ${roleToneClasses[user.role]}`}>
                    {user.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[14px] font-semibold text-slate-900">{user.name}</div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleBadgeClasses[user.role]}`}>
                        {roleLabel(user.role)}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] leading-6 text-slate-500">{user.email}</div>
                    <div className="text-[12px] leading-6 text-slate-500">{user.department}</div>
                    <p className="mt-2 text-[12px] leading-6 text-slate-500">{user.bio}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <StatePanel
              compact
              icon="ri-search-line"
              tone="slate"
              title="조건에 맞는 사용자가 없습니다."
              description="검색어와 역할 필터를 바꾸면 다른 계정을 다시 찾을 수 있습니다."
            />
          )}
        </div>
      </section>
    </div>
  );
}
