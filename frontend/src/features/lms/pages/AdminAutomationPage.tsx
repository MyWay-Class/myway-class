import type { AIProviderCatalog } from '@myway/shared';

type AutomationTool = {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
};

type AutomationRule = {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
  active: boolean;
};

const tools: AutomationTool[] = [
  {
    icon: 'ri-mail-send-line',
    iconClass: 'bg-indigo-50 text-indigo-600',
    title: '자동 알림 발송',
    description: '수강 독려, 과제 마감 알림 등을 자동으로 발송합니다.',
  },
  {
    icon: 'ri-calendar-schedule-line',
    iconClass: 'bg-violet-50 text-violet-600',
    title: '일정 자동 관리',
    description: '강의 일정, 시험 일정을 자동으로 등록하고 공유합니다.',
  },
  {
    icon: 'ri-user-add-line',
    iconClass: 'bg-emerald-50 text-emerald-600',
    title: '수강생 일괄 등록',
    description: 'CSV 파일로 수강생을 대량 등록합니다.',
  },
  {
    icon: 'ri-file-chart-line',
    iconClass: 'bg-amber-50 text-amber-600',
    title: '리포트 자동 생성',
    description: '학습 현황, 수강률 등 운영 리포트를 자동 생성합니다.',
  },
];

const rules: AutomationRule[] = [
  {
    icon: 'ri-check-line',
    iconClass: 'bg-emerald-50 text-emerald-600',
    title: '과제 마감 3일 전 자동 알림',
    description: '모든 수강생에게 과제 마감 알림 발송',
    active: true,
  },
  {
    icon: 'ri-check-line',
    iconClass: 'bg-emerald-50 text-emerald-600',
    title: '주간 학습 진도 리포트',
    description: '매주 월요일 교강사에게 학습 현황 리포트 발송',
    active: true,
  },
  {
    icon: 'ri-close-line',
    iconClass: 'bg-slate-100 text-slate-400',
    title: '수강 완료 축하 메시지',
    description: '강의 수강 완료 시 자동 축하 알림',
    active: false,
  },
];

type AdminAutomationPageProps = {
  providerCatalog: AIProviderCatalog | null;
};

export function AdminAutomationPage({ providerCatalog }: AdminAutomationPageProps) {
  const providerPlans = providerCatalog?.plans.slice(0, 4) ?? [];
  const runtimePolicy = providerCatalog?.runtime_policy;
  const runtimeModeLabel = runtimePolicy?.public_mode === 'free_test' ? '공개 테스트' : '개발';
  const authLabel = runtimePolicy?.require_auth ? '로그인 필수' : '로그인 선택';
  const sttLabel = runtimePolicy?.enable_stt ? 'STT 활성' : 'STT 비활성';
  const uploadLabel = runtimePolicy?.enable_media_upload ? '업로드 허용' : '업로드 차단';

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] ${tool.iconClass}`}>
              <i className={tool.icon} />
            </div>
            <h3 className="text-[15px] font-bold tracking-[-0.02em] text-slate-900">{tool.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">{tool.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
          <i className="ri-flashlight-line text-indigo-600" />
          자동화 규칙
        </h3>

        <div className="mt-3 space-y-2">
          {rules.map((rule) => (
            <div key={rule.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
              <div className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl text-[15px] ${rule.iconClass}`}>
                <i className={rule.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{rule.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{rule.description}</div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  rule.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {rule.active ? '활성' : '비활성'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
          <i className="ri-database-2-line text-indigo-600" />
          AI provider 계층
        </h3>
        <p className="mt-2 text-[12px] leading-6 text-slate-500">
          현재 화면은 runtime policy 기준으로 보여주며, dev는 Ollama, staging/production은 Gemini 중심, STT는 Cloudflare 우선으로 안내합니다.
        </p>

        {runtimePolicy ? (
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">운영 모드</div>
              <div className="mt-1 text-[13px] font-semibold text-slate-900">{runtimeModeLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">AI 접근</div>
              <div className="mt-1 text-[13px] font-semibold text-slate-900">{authLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">STT</div>
              <div className="mt-1 text-[13px] font-semibold text-slate-900">{sttLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">미디어 업로드</div>
              <div className="mt-1 text-[13px] font-semibold text-slate-900">{uploadLabel}</div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {providerPlans.map((plan) => (
            <article key={plan.feature} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{plan.feature}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{plan.current_provider}가 현재 runtime policy 기준의 우선 제공자예요.</div>
                </div>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                  {plan.steps[0]?.status ?? 'planned'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {plan.recommended_chain.map((provider, index) => (
                  <span
                    key={provider}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      index === 0
                        ? 'bg-indigo-600 text-white'
                        : provider === 'demo'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {provider}
                  </span>
                ))}
              </div>

              <ul className="mt-3 space-y-1.5 text-[11px] leading-5 text-slate-500">
                {plan.steps.slice(0, 3).map((step) => (
                  <li key={step.provider} className="flex items-center justify-between gap-2">
                    <span>{step.provider}</span>
                    <span>{step.reason}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
