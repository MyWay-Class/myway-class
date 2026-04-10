type AiNoticeBannerProps = {
  title: string;
  description: string;
  tone?: 'slate' | 'indigo' | 'amber' | 'rose' | 'emerald';
  meta?: string | null;
};

const TONE_CLASS: Record<NonNullable<AiNoticeBannerProps['tone']>, string> = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-900',
  amber: 'border-amber-100 bg-amber-50 text-amber-900',
  rose: 'border-rose-100 bg-rose-50 text-rose-900',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
};

export function AiNoticeBanner({ title, description, tone = 'indigo', meta }: AiNoticeBannerProps) {
  return (
    <section className={`rounded-3xl border px-5 py-4 shadow-sm ${TONE_CLASS[tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] opacity-80">{title}</div>
          <p className="mt-2 text-[13px] leading-6 opacity-90">{description}</p>
        </div>
        {meta ? <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold">{meta}</div> : null}
      </div>
    </section>
  );
}
