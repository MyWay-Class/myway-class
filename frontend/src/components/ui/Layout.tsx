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
    <div className="flex min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header session={session} onLogout={onLogout} loading={loading} />
        <main className="min-w-0 flex-1 px-5 py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
