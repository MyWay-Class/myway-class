import { useState } from 'react';
import type { AuthUser, UserRole } from '@myway/shared';
import { roleLabel } from '../config';
import { AdminFilterBar } from '../components/AdminFilterBar';

type AdminUsersPageProps = {
  users: AuthUser[];
};

const roleOrder: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];

const roleOptions: Array<{ value: UserRole | 'ALL'; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ADMIN', label: '운영자' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'STUDENT', label: '학습자' },
];

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [sortValue, setSortValue] = useState<'name' | 'department' | 'role'>('name');

  const filteredUsers = users
    .filter((user) => {
      const searchable = [user.name, user.email, user.department, roleLabel(user.role)].join(' ').toLowerCase();
      const queryMatch = query.trim() ? searchable.includes(query.trim().toLowerCase()) : true;
      const roleMatch = roleFilter === 'ALL' ? true : user.role === roleFilter;
      return queryMatch && roleMatch;
    })
    .sort((left, right) => {
      if (sortValue === 'department') {
        return left.department.localeCompare(right.department) || left.name.localeCompare(right.name);
      }

      if (sortValue === 'role') {
        return roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role) || left.name.localeCompare(right.name);
      }

      return left.name.localeCompare(right.name);
    });

  return (
    <div className="space-y-5">
      <AdminFilterBar
        title="사용자 관리"
        subtitle="이름, 이메일, 소속, 역할을 기준으로 빠르게 탐색하고 역할별 우선순위를 정리합니다."
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="사용자 이름, 이메일, 소속 검색"
        sortLabel="정렬"
        sortValue={sortValue}
        onSortChange={(value) => setSortValue(value as typeof sortValue)}
        sortOptions={[
          { value: 'name', label: '이름순' },
          { value: 'department', label: '소속순' },
          { value: 'role', label: '역할순' },
        ]}
        chips={roleOptions.map((option) => ({
          label: option.label,
          active: roleFilter === option.value,
          onSelect: () => setRoleFilter(option.value),
        }))}
      />

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">사용자 목록</h3>
          <p className="mt-1 text-[12px] text-slate-500">
            전체 {users.length}명 중 {filteredUsers.length}명을 표시합니다. 역할과 소속이 가까운 순서로 빠르게 확인할 수 있습니다.
          </p>
        </div>

        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[14px] font-bold text-slate-700">
                  {user.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-900">{user.name}</div>
                  <div className="mt-0.5 text-[12px] text-slate-500">
                    {user.email} · {user.department}
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">{roleLabel(user.role)}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-[13px] leading-6 text-slate-500">
              조건에 맞는 사용자가 없습니다. 검색어를 바꾸거나 역할 필터를 조정해보세요.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
