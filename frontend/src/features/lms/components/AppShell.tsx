import type { LoginResponse } from '@myway/shared';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { LmsNavKey, LmsPageId } from '../types';

type AppShellProps = {
  session: LoginResponse;
  activePage: LmsPageId;
  activeNavKey: LmsNavKey;
  title: string;
  onNavigate: (page: LmsPageId) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({ session, activePage, activeNavKey, title, onNavigate, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppSidebar session={session} activePage={activePage} activeNavKey={activeNavKey} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="min-h-screen lg:ml-64">
        <AppHeader title={title} />
        <main className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
