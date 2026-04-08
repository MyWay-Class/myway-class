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
    <header className="flex min-h-[88px] items-center justify-between px-2 py-2 lg:px-4">
      <div>
        <p className="m-0 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Learning dashboard</p>
        <h2 className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-[#273047]">오늘의 학습 흐름</h2>
      </div>
      <div className="flex items-center gap-3">
        {loading ? <span className="text-sm text-[var(--muted)]">데이터 확인 중...</span> : null}
        {session ? (
          <div className="flex items-center gap-3 rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <div className="hidden text-right sm:block">
              <div className="text-sm text-[var(--muted)]">현재 계정</div>
              <div className="font-semibold text-[#2a3246]">{session.user.name}</div>
            </div>
            <Button variant="ghost" onClick={onLogout}>
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="rounded-[20px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]">
            데모 계정으로 시작
          </div>
        )}
      </div>
    </header>
  );
}
