type DashboardHeroProps = {
  badge: string;
  title: string;
  description: string;
  summaryLabel: string;
  summaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  footerLabel: string;
  footerValue: string;
  icon: string;
};

export function DashboardHero({
  badge,
  title,
  description,
  summaryLabel,
  summaryValue,
  secondaryLabel,
  secondaryValue,
  footerLabel,
  footerValue,
  icon,
}: DashboardHeroProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-6 shadow-sm lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
            <i className={icon} />
            {badge}
          </div>
          <h2 className="mt-4 text-[24px] font-bold text-slate-900 lg:text-[28px]">{title}</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">{description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{summaryLabel}</div>
              <div className="mt-1 text-[20px] font-bold text-slate-900">{summaryValue}</div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[24px] text-cyan-700">
              <i className="ri-dashboard-3-line" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-slate-600">
            <div className="rounded-2xl bg-white px-3 py-3">
              <div className="text-slate-500">{secondaryLabel}</div>
              <div className="mt-1 text-[18px] font-bold text-slate-900">{secondaryValue}</div>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <div className="text-slate-500">{footerLabel}</div>
              <div className="mt-1 text-[18px] font-bold text-slate-900">{footerValue}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const instructorTools = [
  {
    icon: 'ri-file-text-line',
    iconClass: 'bg-cyan-50 text-cyan-700',
    title: 'AI 강의 요약',
    description: '전사와 요약 기반으로 학습 포인트를 빠르게 정리합니다.',
  },
  {
    icon: 'ri-question-line',
    iconClass: 'bg-emerald-50 text-emerald-600',
    title: '퀴즈 자동 생성',
    description: '강의 흐름을 유지한 채 문제 유형과 난이도를 조정합니다.',
  },
  {
    icon: 'ri-scissors-cut-line',
    iconClass: 'bg-violet-50 text-violet-600',
    title: '숏폼 제작',
    description: '핵심 구간을 추려 복습용 콘텐츠로 다시 엮습니다.',
  },
  {
    icon: 'ri-presentation-line',
    iconClass: 'bg-amber-50 text-amber-700',
    title: '강의 스튜디오',
    description: '자료, 차시, 미디어 파이프라인을 한 곳에서 조정합니다.',
  },
];

export function InstructorDashboardToolsSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-tools-line text-cyan-700" />
        제작 도구
      </h3>
      <div className="mt-4 grid gap-3">
        {instructorTools.map((tool) => (
          <article key={tool.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] ${tool.iconClass}`}>
              <i className={tool.icon} />
            </div>
            <h4 className="text-[14px] font-bold text-slate-900">{tool.title}</h4>
            <p className="mt-1 text-[12px] leading-6 text-slate-500">{tool.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
