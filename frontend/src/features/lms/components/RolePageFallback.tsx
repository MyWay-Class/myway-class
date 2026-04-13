type RolePageFallbackProps = {
  icon: string;
  title: string;
  description: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
};

export function RolePageFallback({ icon, title, description, actions }: RolePageFallbackProps) {
  return (
    <div className="rounded-[30px] border border-[var(--app-border)] bg-white px-6 py-10 text-center shadow-sm">
      <i className={`${icon} text-[40px] text-indigo-300`} />
      <h3 className="mt-4 text-[15px] font-semibold text-[var(--app-text)]">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-[var(--app-text-secondary)]">{description}</p>
      {actions && actions.length > 0 ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-[12px] font-semibold text-[var(--app-text-secondary)] transition hover:border-[var(--app-border-focus)] hover:text-[var(--app-accent)]"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
