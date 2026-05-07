import { useEffect, useState } from 'react';
import type { LoginResponse } from '@myway/shared';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { LmsNavKey, LmsPageId } from '../types';
import type { ThemeMode, SidebarDock } from '../types';

type AppShellProps = {
  session: LoginResponse;
  activePage: LmsPageId;
  activeNavKey: LmsNavKey;
  title: string;
  onNavigate: (page: LmsPageId) => void;
  onHome: () => void;
  onLogout: () => void;
  children: React.ReactNode;
};

const themeStorageKey = 'myway-shell-theme';
const dockStorageKey = 'myway-shell-dock';
const sidebarStorageKey = 'myway-shell-sidebar-collapsed';

function readStorageValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

export function AppShell({ session, activePage, activeNavKey, title, onNavigate, onHome, onLogout, children }: AppShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => readStorageValue(themeStorageKey, ['light', 'dark'], 'light'));
  const [dock, setDock] = useState<SidebarDock>(() => readStorageValue(dockStorageKey, ['left', 'right'], 'left'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(sidebarStorageKey) === 'true';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(dockStorageKey, dock);
  }, [dock]);

  useEffect(() => {
    window.localStorage.setItem(sidebarStorageKey, String(collapsed));
  }, [collapsed]);

  const sidebarWidthClass = collapsed ? 'lg:w-20' : 'lg:w-72';
  const shellOffsetClass = dock === 'right' ? (collapsed ? 'lg:mr-20' : 'lg:mr-72') : (collapsed ? 'lg:ml-20' : 'lg:ml-72');
  const mobileTabs: Array<{ key: string; label: string; icon: string; page: LmsPageId }> = [
    { key: 'home', label: '홈', icon: 'ri-home-5-line', page: 'home' },
    { key: 'my-courses', label: '강의 탐색', icon: 'ri-book-open-line', page: 'my-courses' },
    { key: 'ai-chat', label: 'AI 도구', icon: 'ri-robot-line', page: 'ai-chat' },
    { key: 'dashboard', label: '내 학습', icon: 'ri-pie-chart-2-line', page: 'dashboard' },
    { key: 'menu', label: '마이페이지', icon: 'ri-user-3-line', page: activePage },
  ];

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <AppSidebar
        session={session}
        activePage={activePage}
        activeNavKey={activeNavKey}
        dock={dock}
        collapsed={collapsed}
        theme={theme}
        sidebarWidthClass={sidebarWidthClass}
        mobileOpen={mobileOpen}
        onNavigate={onNavigate}
        onHome={onHome}
        onLogout={onLogout}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        onToggleDock={() => setDock((current) => (current === 'left' ? 'right' : 'left'))}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-all duration-300 ${shellOffsetClass}`}>
        <AppHeader
          title={title}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="mx-auto max-w-[1280px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-5">
          <div className="animate-fade-in">{children}</div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-[560px] grid-cols-5 gap-1">
            {mobileTabs.map((tab) => {
              const active = tab.key === 'menu' ? mobileOpen : activePage === tab.page || activeNavKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    if (tab.key === 'menu') {
                      setMobileOpen(true);
                      return;
                    }
                    onNavigate(tab.page);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                    active ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <i className={`${tab.icon} text-[18px]`} />
                  <span className="mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
