import type { ReactNode } from 'react';
import type { LoginResponse } from '@myway/shared';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({
  children,
  session,
  onLogout,
  loading,
}: {
  children: ReactNode;
  session: LoginResponse | null;
  onLogout: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header session={session} onLogout={onLogout} loading={loading} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
