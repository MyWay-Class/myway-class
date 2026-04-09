import type { DashboardTone } from '@myway/shared';

type ComparisonMetric = {
  title: string;
  current_label: string;
  current_value: string;
  previous_label: string;
  previous_value: string;
  delta_label: string;
  note: string;
  tone: DashboardTone;
};

type ComparisonCardGridProps = {
  title: string;
  subtitle: string;
  metrics: ComparisonMetric[];
};

const toneClasses: Record<DashboardTone, { card: string; chip: string; accent: string }> = {
  indigo: { card: 'bg-indigo-50 text-indigo-600', chip: 'bg-indigo-100 text-indigo-600', accent: 'text-indigo-700' },
  emerald: { card: 'bg-emerald-50 text-emerald-600', chip: 'bg-emerald-100 text-emerald-600', accent: 'text-emerald-700' },
  violet: { card: 'bg-violet-50 text-violet-600', chip: 'bg-violet-100 text-violet-600', accent: 'text-violet-700' },
  amber: { card: 'bg-amber-50 text-amber-700', chip: 'bg-amber-100 text-amber-700', accent: 'text-amber-700' },
  slate: { card: 'bg-slate-50 text-slate-600', chip: 'bg-slate-100 text-slate-600', accent: 'text-slate-700' },
};

export function ComparisonCardGrid({ title, subtitle, metrics }: ComparisonCardGridProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-[12px] leading-6 text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const tone = toneClasses[metric.tone];

          return (
            <article key={metric.title} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{metric.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{metric.note}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.chip}`}>{metric.delta_label}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                  <div className="text-[11px] text-slate-500">{metric.current_label}</div>
                  <div className={`mt-1 text-[24px] font-extrabold tracking-[-0.03em] ${tone.accent}`}>{metric.current_value}</div>
                </div>
                <div className={`rounded-2xl px-3 py-3 ${tone.card}`}>
                  <div className="text-[11px] opacity-70">{metric.previous_label}</div>
                  <div className="mt-1 text-[20px] font-bold tracking-[-0.03em]">{metric.previous_value}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
