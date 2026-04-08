import type { LoginResponse } from '@myway/shared';
import { navGroupsForRole, roleLabel } from '../config';
import type { LmsPageId } from '../types';

type AppSidebarProps = {
  session: LoginResponse;
  activePage: LmsPageId;
  onNavigate: (page: LmsPageId) => void;
  onLogout: () => void;
};

export function AppSidebar({ session, activePage, onNavigate, onLogout }: AppSidebarProps) {
  const groups = navGroupsForRole(session.user.role);
  const avatarTone =
    session.user.role === 'ADMIN'
      ? 'bg-emerald-600'
      : session.user.role === 'INSTRUCTOR'
        ? 'bg-violet-600'
        : 'bg-indigo-600';

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2.5 px-[18px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-indigo-600 text-[15px] text-white">
          <i className="ri-play-circle-fill" />
        </div>
        <span className="text-[1.05rem] font-extrabold tracking-[-0.03em] text-slate-900">내맘대로</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-[18px]">
            <div className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.page === activePage;
                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    className={`relative flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition ${
                      active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {active ? <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-indigo-600" /> : null}
                    <i className={`${item.icon} w-[22px] text-center text-[17px]`} />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-3.5 py-3">
        <div className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 hover:bg-slate-50">
          <div className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-bold text-white ${avatarTone}`}>
            {session.user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-slate-800">{session.user.name}</div>
            <div className="text-[11px] text-slate-400">{roleLabel(session.user.role)}</div>
          </div>
          <button type="button" onClick={onLogout} className="text-base text-slate-400 transition hover:text-slate-700" title="로그아웃">
            <i className="ri-logout-box-r-line" />
          </button>
        </div>
      </div>
    </aside>
  );
}
