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
  mobileOpen: boolean;
  onNavigate: (page: LmsPageId) => void;
  onHome: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  onToggleDock: () => void;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
};

export function AppSidebar({
  session,
  activePage,
  activeNavKey,
  dock,
  collapsed,
  theme,
  sidebarWidthClass,
  mobileOpen,
  onNavigate,
  onHome,
  onLogout,
  onToggleTheme,
  onToggleDock,
  onToggleCollapsed,
  onCloseMobile,
}: AppSidebarProps) {
  const groups = navGroupsForRole(session.user.role);
  const avatarTone =
    session.user.role === 'ADMIN'
      ? 'bg-emerald-600'
      : session.user.role === 'INSTRUCTOR'
        ? 'bg-teal-600'
        : 'bg-cyan-600';
  const dockClass = dock === 'right' ? 'right-0 border-l border-r-0' : 'left-0 border-r border-l-0';

  const handleNavClick = (page: LmsPageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside
      className={`fixed inset-y-0 z-30 flex flex-col border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-lg)] ${dockClass} ${sidebarWidthClass}`}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-[var(--app-border)] px-4">
        <button
          type="button"
          onClick={() => {
            onHome();
            onCloseMobile();
          }}
          className={`flex items-center gap-2.5 ${collapsed ? 'mx-auto' : ''}`}
          title="메인 화면으로 이동"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-md shadow-cyan-500/25">
            <i className="ri-play-circle-fill text-[18px]" />
          </div>
          {!collapsed ? <span className="text-[15px] font-semibold tracking-tight text-[var(--app-text)]">내맘대로</span> : null}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)] lg:flex"
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <i className={collapsed ? 'ri-arrow-right-s-line text-[17px]' : 'ri-arrow-left-s-line text-[17px]'} />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)] lg:hidden"
          title="메뉴 닫기"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2.5' : 'px-3'} py-4`}>
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed ? (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
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
                    onClick={() => handleNavClick(item.page)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm'
                        : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    {active ? <span className={`absolute ${dock === 'right' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 h-5 w-[3px] -translate-y-1/2 bg-[var(--app-accent)]`} /> : null}
                    <i className={`${item.icon} w-[22px] text-center text-[17px] ${active ? '' : 'opacity-70'}`} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--app-border)] px-3 py-3">
        <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-[13px] font-bold text-white shadow-sm ${avatarTone}`}>
            {session.user.name[0]}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-[var(--app-text)]">{session.user.name}</div>
              <div className="text-[11px] text-[var(--app-text-muted)]">{roleLabel(session.user.role)}</div>
            </div>
          ) : null}
          {!collapsed ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-red-500"
              title="로그아웃"
            >
              <i className="ri-logout-box-r-line text-[16px]" />
            </button>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-2.5 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={onToggleDock}
              className="h-10 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-3 text-[12px] font-medium text-[var(--app-text-secondary)] transition hover:bg-[var(--app-surface-hover)]"
            >
              {dock === 'left' ? '오른쪽 고정' : '왼쪽 고정'}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
              title={theme === 'light' ? '다크 모드' : '라이트 모드'}
            >
              <i className={theme === 'light' ? 'ri-moon-line text-[15px]' : 'ri-sun-line text-[15px]'} />
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute right-3 top-[13px] hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)] lg:flex"
        title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <i className={collapsed ? 'ri-arrow-right-s-line text-[17px]' : 'ri-arrow-left-s-line text-[17px]'} />
      </button>
    </aside>
  );

  return (
    <>
      {mobileOpen ? <div className="sidebar-overlay lg:hidden" onClick={onCloseMobile} /> : null}
      <div
        className={`fixed inset-y-0 ${dock === 'right' ? 'right-0' : 'left-0'} z-30 w-72 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden ${
          mobileOpen ? 'translate-x-0' : dock === 'right' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
      <div className="hidden lg:block">{sidebarContent}</div>
    </>
  );
}
