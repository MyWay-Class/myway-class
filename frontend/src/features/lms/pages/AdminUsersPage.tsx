import type { AuthUser } from '@myway/shared';
import { roleLabel } from '../config';

type AdminUsersPageProps = {
  users: AuthUser[];
};

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">사용자 관리</h2>
          <p className="mt-1 text-[12px] text-slate-500">역할과 소속 기준으로 사용자 정보를 정리한 운영 화면입니다.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{users.length}명</span>
      </div>

      <div className="divide-y divide-slate-100">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[14px] font-bold text-slate-700">
              {user.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-900">{user.name}</div>
              <div className="mt-0.5 text-[12px] text-slate-500">
                {user.email} · {user.department}
              </div>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">{roleLabel(user.role)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
