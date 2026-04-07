import type { LoginResponse } from '@myway/shared';
import { Button } from './Button';

export function Header({
  session,
  onLogout,
  loading,
}: {
  session: LoginResponse | null;
  onLogout: () => void;
  loading: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[color:var(--line)] bg-[var(--bg-card)] px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {loading ? (
          <span className="text-sm text-[var(--muted)]">데이터 확인 중...</span>
        ) : session ? (
          <>
            <span className="text-sm font-semibold">{session.user.name} 님 환영합니다</span>
            <Button variant="ghost" onClick={onLogout}>
              로그아웃
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
