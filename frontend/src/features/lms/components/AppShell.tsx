import type { LoginResponse } from '@myway/shared';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { LmsPageId } from '../types';

type AppShellProps = {
  session: LoginResponse;
  activePage: LmsPageId;
  title: string;
  onNavigate: (page: LmsPageId) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({ session, activePage, title, onNavigate, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppSidebar session={session} activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="ml-64 min-h-screen">
        <AppHeader title={title} />
        <main className="max-w-[1320px] px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
