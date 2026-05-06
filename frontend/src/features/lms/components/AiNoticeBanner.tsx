type AiNoticeBannerProps = {
  title: string;
  description: string;
  tone?: 'slate' | 'indigo' | 'amber' | 'rose' | 'emerald';
  meta?: string | null;
};

const TONE_CLASS: Record<NonNullable<AiNoticeBannerProps['tone']>, string> = {
  slate: 'border-slate-200 bg-slate-50 text-slate-800',
  indigo: 'border-cyan-100 bg-cyan-50 text-cyan-950',
  amber: 'border-amber-100 bg-amber-50 text-amber-900',
  rose: 'border-rose-100 bg-rose-50 text-rose-900',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
};

export function AiNoticeBanner({ title, description, tone = 'indigo', meta }: AiNoticeBannerProps) {
  return (
    <section className={`rounded-3xl border px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)] ${TONE_CLASS[tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">Learning Guidance</div>
          <h3 className="mt-1 text-[15px] font-extrabold tracking-[-0.02em]">{title}</h3>
          <p className="mt-2 text-[13px] leading-6 opacity-90">{description}</p>
        </div>
        {meta ? (
          <div className="rounded-xl border border-white/70 bg-white/75 px-3 py-2 text-[11px] font-semibold">
            {meta}
          </div>
        ) : null}
      </div>
    </section>
  );
}
