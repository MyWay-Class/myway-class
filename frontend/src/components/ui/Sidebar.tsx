import type { LoginResponse } from '@myway/shared';

export function Sidebar({ session }: { session: LoginResponse | null }) {
  const items = [
    '대시보드',
    '전체 강의',
    '내 학습',
    'AI 채팅',
    '숏폼',
    '커뮤니티',
    'AI 검색',
    '설정',
  ];

  return (
    <aside className="hidden w-[290px] shrink-0 flex-col border-r border-[color:var(--line)] bg-[var(--sidebar)] xl:flex">
      <div className="flex items-center gap-4 border-b border-[color:var(--line)] px-5 py-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-lg font-black text-white shadow-[0_18px_34px_rgba(111,99,246,0.35)]">
          M
        </div>
        <div>
          <div className="text-[2rem] font-extrabold tracking-[-0.05em] text-[#2a3246]">MyWayClass</div>
          <p className="m-0 text-sm text-[var(--muted)]">v4.0 AI-Powered</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item}
              className={[
                'flex items-center gap-3 rounded-2xl px-4 py-4 text-[1.08rem] font-semibold transition',
                index === 0
                  ? 'bg-[rgba(111,99,246,0.1)] text-[var(--accent)] shadow-[inset_0_0_0_1px_rgba(111,99,246,0.04)]'
                  : 'text-[#5b6579] hover:bg-[#f4f6fb] hover:text-[#2a3246]',
              ].join(' ')}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm shadow-[0_8px_18px_rgba(127,136,164,0.08)]">
                {index === 0 ? '⌂' : index === 1 ? '◔' : index === 2 ? '▣' : index === 3 ? '✦' : index === 4 ? '▥' : index === 5 ? '◉' : index === 6 ? '⌕' : '⚙'}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[color:var(--line)] px-5 py-4">
        <div className="mb-4 flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>라이트</span>
          <span className="font-semibold text-[#2a3246]">EN</span>
        </div>
        <div className="flex items-center gap-4 rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-white">
            {session?.user.name?.slice(0, 1) ?? 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-[#2a3246]">{session?.user.name ?? 'Guest User'}</div>
            <p className="m-0 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              {session?.user.role ?? 'GUEST'}
            </p>
          </div>
          <span className="text-xl text-[var(--muted)]">↪</span>
        </div>
      </div>
    </aside>
  );
}
