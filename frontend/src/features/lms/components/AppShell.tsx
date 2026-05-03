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

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  const sidebarWidthClass = collapsed ? 'lg:w-20' : 'lg:w-72';
  const shellOffsetClass = dock === 'right' ? (collapsed ? 'lg:mr-20' : 'lg:mr-72') : (collapsed ? 'lg:ml-20' : 'lg:ml-72');

  return (
    <div className="hero-pattern min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
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
        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="animate-fade-in rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-4 shadow-[var(--app-shadow)] backdrop-blur-sm sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
