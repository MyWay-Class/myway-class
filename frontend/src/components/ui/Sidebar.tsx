import type { LoginResponse } from '@myway/shared';

export function Sidebar({ session }: { session: LoginResponse | null }) {
  return (
    <aside className="flex w-64 flex-col gap-8 border-r border-[color:var(--line)] bg-[var(--bg-card)] px-4 py-6">
      <div className="px-3 text-xl font-extrabold text-teal-700 dark:text-teal-300">MyWayClass</div>
      <nav>
        <ul className="flex flex-col gap-2">
          <li className="rounded-xl bg-teal-600 px-3 py-2 font-semibold text-white">메인 대시보드</li>
          <li className="rounded-xl px-3 py-2 font-semibold text-[var(--text)] transition hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-white/5 dark:hover:text-teal-200">
            오프라인 코스
          </li>
          <li className="rounded-xl px-3 py-2 font-semibold text-[var(--text)] transition hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-white/5 dark:hover:text-teal-200">
            탐색하기
          </li>
          {session ? (
            <li className="rounded-xl px-3 py-2 font-semibold text-[var(--text)] transition hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-white/5 dark:hover:text-teal-200">
              커뮤니티
            </li>
          ) : null}
        </ul>
      </nav>
    </aside>
  );
}
