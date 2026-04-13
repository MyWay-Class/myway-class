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
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <i className={`${icon} text-[36px] text-indigo-300`} />
      <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-slate-500">{description}</p>
      {actions && actions.length > 0 ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
