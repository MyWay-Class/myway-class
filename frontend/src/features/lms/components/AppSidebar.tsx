import type { LoginResponse } from '@myway/shared';
import { isNavItemActive, navGroupsForRole, roleLabel } from '../config';
import type { LmsNavKey, LmsPageId, SidebarDock, ThemeMode } from '../types';
import {
  AppSidebarFooterSection,
  AppSidebarHeaderSection,
  AppSidebarNavSection,
} from './AppSidebarSections';

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
        ? 'bg-violet-600'
        : 'bg-indigo-600';
  const dockClass = dock === 'right' ? 'right-0 border-l border-r-0' : 'left-0 border-r border-l-0';

  const handleNavClick = (page: LmsPageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside
      className={`fixed inset-y-0 z-30 flex flex-col border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-lg)] ${dockClass} ${sidebarWidthClass}`}
    >
      <AppSidebarHeaderSection
        collapsed={collapsed}
        onHome={onHome}
        onCloseMobile={onCloseMobile}
        onToggleCollapsed={onToggleCollapsed}
      />
      <AppSidebarNavSection
        groups={groups}
        activePage={activePage}
        activeNavKey={activeNavKey}
        collapsed={collapsed}
        dock={dock}
        onNavigate={(page) => handleNavClick(page)}
      />
      <AppSidebarFooterSection
        avatarTone={avatarTone}
        collapsed={collapsed}
        sessionName={session.user.name}
        role={session.user.role}
        dock={dock}
        theme={theme}
        onLogout={() => {
          onLogout();
          onCloseMobile();
        }}
        onToggleDock={onToggleDock}
        onToggleTheme={onToggleTheme}
      />
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute right-3 top-[15px] hidden h-8 w-8 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)] lg:flex"
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
