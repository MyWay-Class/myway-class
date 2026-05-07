type AiNoticeBannerProps = {
  title: string;
  description: string;
  tone?: 'slate' | 'indigo' | 'amber' | 'rose' | 'emerald';
  meta?: string | null;
};

const TONE_CLASS: Record<NonNullable<AiNoticeBannerProps['tone']>, string> = {
  slate: 'border-[#c9d8ea] bg-[linear-gradient(135deg,#f4f8fd_0%,#edf4fb_100%)] text-[#12324f]',
  indigo: 'border-[#a8dcff] bg-[linear-gradient(135deg,#e8f8ff_0%,#d9f1ff_100%)] text-[#0d3554]',
  amber: 'border-[#f2d6a0] bg-[linear-gradient(135deg,#fff8e8_0%,#ffefd1_100%)] text-[#6c4a13]',
  rose: 'border-[#f7c2d8] bg-[linear-gradient(135deg,#fff1f7_0%,#ffe4f0_100%)] text-[#6d2247]',
  emerald: 'border-[#aee9de] bg-[linear-gradient(135deg,#ebfffb_0%,#d6f8f1_100%)] text-[#0e4e43]',
};

export function AiNoticeBanner({ title, description, tone = 'indigo', meta }: AiNoticeBannerProps) {
  return (
    <section className={`rounded-[28px] border px-5 py-4 shadow-[0_14px_32px_rgba(6,24,44,0.08)] ${TONE_CLASS[tone]}`}>
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
