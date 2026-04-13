import type { LoginResponse } from '@myway/shared';
import { isNavItemActive, navGroupsForRole, roleLabel } from '../config';
import type { LmsNavKey, LmsPageId, SidebarDock, ThemeMode } from '../types';

type AppSidebarProps = {
  session: LoginResponse;
  activePage: LmsPageId;
  activeNavKey: LmsNavKey;
  dock: SidebarDock;
  collapsed: boolean;
  theme: ThemeMode;
  sidebarWidthClass: string;
  onNavigate: (page: LmsPageId) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  onToggleDock: () => void;
  onToggleCollapsed: () => void;
};

export function AppSidebar({
  session,
  activePage,
  activeNavKey,
  dock,
  collapsed,
  theme,
  sidebarWidthClass,
  onNavigate,
  onLogout,
  onToggleTheme,
  onToggleDock,
  onToggleCollapsed,
}: AppSidebarProps) {
  const groups = navGroupsForRole(session.user.role);
  const avatarTone =
    session.user.role === 'ADMIN'
      ? 'bg-emerald-600'
      : session.user.role === 'INSTRUCTOR'
        ? 'bg-violet-600'
        : 'bg-indigo-600';
  const dockClass = dock === 'right' ? 'right-0 border-l border-r-0' : 'left-0 border-r border-l-0';

  return (
    <aside
      className={`fixed inset-y-0 z-20 hidden flex-col border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_10px_30px_rgba(15,23,42,0.08)] lg:flex ${dockClass} ${sidebarWidthClass}`}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <button type="button" onClick={() => onNavigate('dashboard')} className={`flex items-center gap-2 ${collapsed ? 'mx-auto' : ''}`}>
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-indigo-600 text-[15px] text-white">
            <i className="ri-play-circle-fill" />
          </div>
          {!collapsed ? <span className="text-[1.05rem] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">내맘대로</span> : null}
        </button>
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[16px] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
            title="사이드바 접기"
          >
            <i className="ri-arrow-left-s-line" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[16px] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
            title="사이드바 펼치기"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-2.5'} py-2`}>
        {groups.map((group) => (
          <div key={group.label} className="mb-[18px]">
            {!collapsed ? (
              <div className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item, activeNavKey) || item.page === activePage;
                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition ${
                      active
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    {active ? <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-indigo-600" /> : null}
                    <i className={`${item.icon} w-[22px] text-center text-[17px]`} />
                    {!collapsed ? <span>{item.label}</span> : null}
                    {item.badge && !collapsed ? (
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

      <div className="border-t border-[var(--app-border)] px-3.5 py-3">
        <div className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-bold text-white ${avatarTone}`}>
            {session.user.name[0]}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-[var(--app-text)]">{session.user.name}</div>
              <div className="text-[11px] text-[var(--app-text-muted)]">{roleLabel(session.user.role)}</div>
            </div>
          ) : null}
          {!collapsed ? (
            <button type="button" onClick={onLogout} className="text-base text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]" title="로그아웃">
              <i className="ri-logout-box-r-line" />
            </button>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDock}
              className="flex-1 rounded-xl border border-[var(--app-border)] px-3 py-2 text-[12px] font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-soft)]"
            >
              {dock === 'left' ? '오른쪽 고정' : '왼쪽 고정'}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
              title={theme === 'light' ? '다크 모드' : '라이트 모드'}
            >
              <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'} />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
