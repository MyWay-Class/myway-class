import type { AuthUser } from '@myway/shared';
import { roleLabel } from '../config';
import { StatePanel } from '../components/StatePanel';

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

export function AdminUsersPageMobileCards({ filteredUsers }: { filteredUsers: AuthUser[] }) {
  return (
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
  );
}
