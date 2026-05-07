type AppHeaderProps = {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobile: () => void;
};

export function AppHeader({ title, theme, onToggleTheme, onOpenMobile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-cyan-100/25 bg-[linear-gradient(90deg,#113454,#174667_55%,#1b4f71)] text-cyan-50">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-100 transition-all hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
          >
            <i className="ri-menu-line text-lg" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="알림"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-cyan-100 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <i className="ri-notification-3-line text-[16px]" />
            <span className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border border-white bg-red-500" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? '다크 모드 전환' : '라이트 모드 전환'}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-100 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <i className={theme === 'light' ? 'ri-moon-line text-[16px]' : 'ri-sun-line text-[16px]'} />
          </button>
        </div>
      </div>
    </header>
  );
}
