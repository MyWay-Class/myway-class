import type { AuthUser } from '@myway/shared';
import { roleLabel } from '../config';

type AdminUsersPageProps = {
  users: AuthUser[];
};

const roleBadgeClasses: Record<AuthUser['role'], string> = {
  ADMIN: 'bg-amber-100 text-amber-700',
  INSTRUCTOR: 'bg-emerald-100 text-emerald-600',
  STUDENT: 'bg-indigo-100 text-indigo-600',
};

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <h1 className="text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">회원 관리</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
          관리자, 강사, 학습자를 역할별로 빠르게 확인할 수 있도록 레퍼런스와 같은 테이블/카드 이중 레이아웃으로 정리했습니다.
        </p>
        <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
          전체 {users.length}명
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:block">
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
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {user.name.slice(0, 1)}
                      </div>
                      <span className="font-medium text-slate-900">{user.name}</span>
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
      </section>

      <section className="space-y-2 sm:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {user.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-slate-900">{user.name}</div>
                <div className="mt-1 text-[12px] leading-6 text-slate-500">{user.email}</div>
                <div className="mt-1 text-[12px] leading-6 text-slate-500">{user.department}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleBadgeClasses[user.role]}`}>
                {roleLabel(user.role)}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
