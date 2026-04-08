type RolePageFallbackProps = {
  icon: string;
  title: string;
  description: string;
};

export function RolePageFallback({ icon, title, description }: RolePageFallbackProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <i className={`${icon} text-[36px] text-indigo-300`} />
      <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-slate-500">{description}</p>
    </div>
  );
}
