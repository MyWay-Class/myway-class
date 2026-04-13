type AppHeaderProps = {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

export function AppHeader({ title, theme, onToggleTheme }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)]/90 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-[1rem] font-bold tracking-[-0.015em] text-[var(--app-text)]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'light' ? '다크 모드 전환' : '라이트 모드 전환'}
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[8px] text-[17px] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
        >
          <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'} />
        </button>
        <button
          type="button"
          title="알림"
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[8px] text-[17px] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-soft)] hover:text-[var(--app-text)]"
        >
          <i className="ri-notification-3-line" />
          <span className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border border-white bg-red-500" />
        </button>
      </div>
    </header>
  );
}
