import type { DashboardStat } from '@myway/shared';

type DashboardStatsGridProps = {
  stats: DashboardStat[];
};

const toneClasses: Record<DashboardStat['tone'], { panel: string; icon: string; value: string }> = {
  indigo: {
    panel: 'bg-indigo-50 text-indigo-600',
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-slate-900',
  },
  emerald: {
    panel: 'bg-emerald-50 text-emerald-600',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-slate-900',
  },
  violet: {
    panel: 'bg-violet-50 text-violet-600',
    icon: 'bg-violet-100 text-violet-600',
    value: 'text-slate-900',
  },
  amber: {
    panel: 'bg-amber-50 text-amber-700',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-slate-900',
  },
  slate: {
    panel: 'bg-slate-50 text-slate-600',
    icon: 'bg-slate-100 text-slate-600',
    value: 'text-slate-900',
  },
};

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const tone = toneClasses[stat.tone];

        return (
          <article key={stat.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] ${tone.icon}`}>
              <i className={stat.icon} />
            </div>
            <div className={`text-[28px] font-extrabold tracking-[-0.03em] ${tone.value}`}>{stat.value}</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">{stat.label}</div>
            <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.panel}`}>{stat.hint}</div>
          </article>
        );
      })}
    </section>
  );
}
