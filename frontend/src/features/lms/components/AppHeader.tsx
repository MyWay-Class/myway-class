type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-[1rem] font-bold tracking-[-0.015em] text-slate-900">{title}</h1>
      </div>
      <button
        type="button"
        title="알림"
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[8px] text-[17px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <i className="ri-notification-3-line" />
        <span className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border border-white bg-red-500" />
      </button>
    </header>
  );
}
