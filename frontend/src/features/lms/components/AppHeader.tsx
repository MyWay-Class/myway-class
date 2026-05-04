type AppHeaderProps = {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobile: () => void;
};

export function AppHeader({ title, theme, onToggleTheme, onOpenMobile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-surface)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMobile}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)] lg:hidden"
          >
            <i className="ri-menu-line text-lg" />
          </button>
          <div>
            <h1 className="text-[16px] font-semibold tracking-tight text-[var(--app-text)]">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            title="알림"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
          >
            <i className="ri-notification-3-line text-[16px]" />
            <span className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border border-white bg-red-500" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? '다크 모드 전환' : '라이트 모드 전환'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
          >
            <i className={theme === 'light' ? 'ri-moon-line text-[16px]' : 'ri-sun-line text-[16px]'} />
          </button>
        </div>
      </div>
    </header>
  );
}
