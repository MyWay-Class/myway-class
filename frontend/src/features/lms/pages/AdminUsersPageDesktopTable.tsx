import type { AuthUser } from '@myway/shared';
import { roleLabel } from '../config';

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

export function AdminUsersPageDesktopTable({ filteredUsers }: { filteredUsers: AuthUser[] }) {
  return (
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
  );
}
