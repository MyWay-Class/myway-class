import type { AuthUser } from '@myway/shared';
import { userDescription } from '../config';
import { toRoleTone } from '../types';

type LoginScreenProps = {
  demoUsers: AuthUser[];
  busy: boolean;
  onLogin: (userId: string) => void;
  onBackToHome: () => void;
};

const roleBadgeClass: Record<'student' | 'instructor' | 'admin', string> = {
  student: 'bg-indigo-50 text-indigo-600',
  instructor: 'bg-violet-50 text-violet-600',
  admin: 'bg-emerald-50 text-emerald-600',
};

const avatarClass: Record<'student' | 'instructor' | 'admin', string> = {
  student: 'bg-indigo-600',
  instructor: 'bg-violet-600',
  admin: 'bg-emerald-600',
};

const iconClass: Record<'student' | 'instructor' | 'admin', string> = {
  student: 'ri-user-line',
  instructor: 'ri-presentation-line',
  admin: 'ri-settings-3-line',
};

export function LoginScreen({ demoUsers, busy, onLogin, onBackToHome }: LoginScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)]">
      <div className="pointer-events-none absolute -right-28 -top-36 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.07)_0%,transparent_68%)]" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_68%)]" />

      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={onBackToHome} className="text-[15px] font-extrabold tracking-[-0.03em] text-slate-900">
            내맘대로클래스
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              홈으로
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-9 text-center">
            <h1 className="text-[2rem] font-extrabold tracking-[-0.03em] text-slate-900">
              <span className="text-indigo-600">내맘대로</span>클래스
            </h1>
            <p className="mt-1.5 text-[15px] text-slate-500">AI 기반 맞춤형 학습 플랫폼</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
            <h2 className="text-[1.1rem] font-bold tracking-[-0.02em] text-slate-900">로그인</h2>
            <p className="mt-1 text-[13px] leading-6 text-slate-500">이메일과 비밀번호로 로그인하세요.</p>

            <div className="mt-6 flex flex-col gap-2.5">
              {demoUsers.map((user) => {
                const tone = toRoleTone(user.role);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onLogin(user.id)}
                    disabled={busy}
                    className="group flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_8px_18px_rgba(99,102,241,0.08)] disabled:cursor-wait disabled:opacity-60"
                  >
                    <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl text-base text-white ${avatarClass[tone]}`}>
                      <i className={iconClass[tone]} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                        {user.name}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleBadgeClass[tone]}`}>
                          {user.role === 'ADMIN' ? '운영자' : user.role === 'INSTRUCTOR' ? '교강사' : '수강생'}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-slate-500">{userDescription(user.role)}</div>
                    </div>
                    <i className="ri-arrow-right-s-line text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
