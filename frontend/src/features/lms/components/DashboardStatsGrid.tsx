import type { DashboardStat } from '@myway/shared';

type DashboardStatsGridProps = {
  stats: DashboardStat[];
};

const toneClasses: Record<DashboardStat['tone'], { panel: string; icon: string; value: string }> = {
  indigo: {
    panel: 'bg-cyan-50 text-cyan-700',
    icon: 'bg-cyan-100 text-cyan-700',
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const tone = toneClasses[stat.tone];

        return (
          <article key={stat.id} className="rounded-[28px] border border-[var(--app-border)] bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-[20px] ${tone.icon}`}>
              <i className={stat.icon} />
            </div>
            <div className={`text-[30px] font-extrabold tracking-[-0.04em] ${tone.value}`}>{stat.value}</div>
            <div className="mt-1 text-[12px] font-semibold text-[var(--app-text-secondary)]">{stat.label}</div>
            <div className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${tone.panel}`}>{stat.hint}</div>
          </article>
        );
      })}
    </section>
  );
}
