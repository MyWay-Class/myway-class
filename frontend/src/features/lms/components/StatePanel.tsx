type StateTone = 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';

type StatePanelProps = {
  icon: string;
  title: string;
  description: string;
  tone?: StateTone;
  compact?: boolean;
};

const toneClasses: Record<StateTone, { icon: string; panel: string; title: string; text: string }> = {
  indigo: {
    icon: 'bg-indigo-100 text-indigo-600',
    panel: 'border-indigo-200 bg-indigo-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    panel: 'border-emerald-200 bg-emerald-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    panel: 'border-violet-200 bg-violet-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    panel: 'border-amber-200 bg-amber-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-600',
    panel: 'border-rose-200 bg-rose-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-600',
    panel: 'border-slate-200 bg-slate-50/80',
    title: 'text-slate-900',
    text: 'text-slate-600',
  },
};

export function StatePanel({ icon, title, description, tone = 'slate', compact = false }: StatePanelProps) {
  const state = toneClasses[tone];

  if (compact) {
    return (
      <div className={`flex items-start gap-4 rounded-3xl border px-4 py-4 ${state.panel}`}>
        <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] ${state.icon}`}>
          <i className={icon} />
        </div>
        <div className="min-w-0">
          <div className={`text-[14px] font-bold ${state.title}`}>{title}</div>
          <p className={`mt-1 text-[13px] leading-6 ${state.text}`}>{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border px-6 py-8 text-center ${state.panel}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] ${state.icon}`}>
        <i className={icon} />
      </div>
      <h3 className={`mt-4 text-[16px] font-bold ${state.title}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-xl text-[13px] leading-6 ${state.text}`}>{description}</p>
    </div>
  );
}
