import { useEffect, useMemo, useState } from 'react';
import type { AIProviderCatalog } from '@myway/shared';
import { getAIProviderCatalog } from '@myway/shared';
import {
  loadBatchPipelineStatus,
  rerunBatchPipeline,
  type BatchPipelineRerunMode,
  type BatchPipelineStatus,
} from '../../../lib/api-admin-automation';
import { normalizeBatchPipelineStatus } from './admin-automation-utils';

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
    iconClass: 'bg-cyan-50 text-cyan-700',
    title: '자동 알림 발송',
    description: '수강 독려, 과제 마감 알림 등을 자동으로 발송합니다.',
  },
  {
    icon: 'ri-calendar-schedule-line',
    iconClass: 'bg-sky-50 text-sky-700',
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

function formatLastRun(value: string | null): string {
  if (!value) {
    return '아직 실행 이력이 없습니다.';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AdminAutomationPage({ providerCatalog }: AdminAutomationPageProps) {
  const resolvedCatalog = providerCatalog ?? getAIProviderCatalog();
  const providerPlans = resolvedCatalog.plans.slice(0, 4);
  const runtimePolicy = resolvedCatalog.runtime_policy;
  const runtimeModeLabel = runtimePolicy?.public_mode === 'free_test' ? '공개 테스트' : '개발';
  const authLabel = runtimePolicy?.require_auth ? '로그인 필수' : '로그인 선택';
  const sttLabel = runtimePolicy?.enable_stt ? 'STT 활성' : 'STT 비활성';
  const uploadLabel = runtimePolicy?.enable_media_upload ? '업로드 허용' : '업로드 차단';

  const [pipelineStatus, setPipelineStatus] = useState<BatchPipelineStatus | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [rerunBusyMode, setRerunBusyMode] = useState<BatchPipelineRerunMode | null>(null);

  async function refreshPipelineStatus() {
    setPipelineLoading(true);
    setPipelineError(null);

    try {
      const status = await loadBatchPipelineStatus();
      setPipelineStatus(normalizeBatchPipelineStatus(status));
    } catch {
      setPipelineError('배치 파이프라인 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setPipelineStatus(normalizeBatchPipelineStatus(null));
    } finally {
      setPipelineLoading(false);
    }
  }

  useEffect(() => {
    void refreshPipelineStatus();
  }, []);

  async function handleRerun(mode: BatchPipelineRerunMode) {
    setRerunBusyMode(mode);
    setPipelineError(null);

    try {
      const result = await rerunBatchPipeline(mode);
      if (!result) {
        setPipelineError('재실행 요청이 접수되지 않았습니다. 권한/서버 상태를 확인해 주세요.');
        return;
      }

      if (result.status) {
        setPipelineStatus(normalizeBatchPipelineStatus(result.status));
      } else {
        await refreshPipelineStatus();
      }
    } catch {
      setPipelineError('재실행 요청 중 오류가 발생했습니다.');
    } finally {
      setRerunBusyMode(null);
    }
  }

  const normalizedStatus = useMemo(() => normalizeBatchPipelineStatus(pipelineStatus), [pipelineStatus]);

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)]">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">운영 자동화와 AI 정책 관리</h1>
        <p className="mt-2 text-[13px] leading-6 text-white/80">알림, 리포트, 권한 정책과 provider 우선순위를 한 화면에서 관리합니다.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-6 shadow-[0_14px_30px_rgba(6,31,57,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(6,31,57,0.12)]"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] ${tool.iconClass}`}>
              <i className={tool.icon} />
            </div>
            <h3 className="text-[15px] font-bold tracking-[-0.02em] text-slate-900">{tool.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">{tool.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
          <i className="ri-flashlight-line text-cyan-700" />
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

      <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
              <i className="ri-flow-chart text-cyan-700" />
              배치 파이프라인 상태
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">성공/실패/대기 건수와 실패 강의를 확인하고 재실행할 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRerun('all')}
              disabled={pipelineLoading || rerunBusyMode !== null}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className={rerunBusyMode === 'all' ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'} />
              전체 재실행
            </button>
            <button
              type="button"
              onClick={() => void handleRerun('failed-only')}
              disabled={pipelineLoading || rerunBusyMode !== null || normalizedStatus.failure_count < 1}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className={rerunBusyMode === 'failed-only' ? 'ri-loader-4-line animate-spin' : 'ri-restart-line'} />
              실패 건만 재실행
            </button>
            <button
              type="button"
              onClick={() => void refreshPipelineStatus()}
              disabled={pipelineLoading || rerunBusyMode !== null}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className={pipelineLoading ? 'ri-loader-4-line animate-spin' : 'ri-loop-right-line'} />
              새로고침
            </button>
          </div>
        </div>

        {pipelineError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">{pipelineError}</div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">Success</div>
            <div className="mt-1 text-[24px] font-extrabold text-emerald-700">{pipelineLoading ? '-' : normalizedStatus.success_count}</div>
          </article>
          <article className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-600">Failure</div>
            <div className="mt-1 text-[24px] font-extrabold text-rose-700">{pipelineLoading ? '-' : normalizedStatus.failure_count}</div>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Pending</div>
            <div className="mt-1 text-[24px] font-extrabold text-amber-700">{pipelineLoading ? '-' : normalizedStatus.pending_count}</div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Last Run</div>
            <div className="mt-1 text-[13px] font-semibold text-slate-900">{pipelineLoading ? '불러오는 중...' : formatLastRun(normalizedStatus.last_run_at)}</div>
          </article>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-semibold text-slate-900">실패 강의 목록</div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
              {pipelineLoading ? '...' : `${normalizedStatus.failed_lectures.length}건`}
            </span>
          </div>

          {pipelineLoading ? (
            <div className="mt-3 text-[12px] text-slate-500">상태를 불러오는 중입니다.</div>
          ) : normalizedStatus.failed_lectures.length < 1 ? (
            <div className="mt-3 text-[12px] text-slate-500">현재 실패한 강의가 없습니다.</div>
          ) : (
            <ul className="mt-3 space-y-2">
              {normalizedStatus.failed_lectures.map((lecture) => (
                <li key={lecture.lecture_id} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-[12px]">
                  <div className="font-semibold text-slate-900">{lecture.lecture_title}</div>
                  <div className="mt-1 text-slate-500">{lecture.course_title ?? '코스 정보 없음'}</div>
                  {lecture.failed_reason ? <div className="mt-1 text-rose-600">{lecture.failed_reason}</div> : null}
                  {lecture.failed_at ? <div className="mt-1 text-slate-400">실패 시각: {formatLastRun(lecture.failed_at)}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
          <i className="ri-database-2-line text-cyan-700" />
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
                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                  {plan.steps[0]?.status ?? 'planned'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {plan.recommended_chain.map((provider, index) => (
                  <span
                    key={provider}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      index === 0
                        ? 'bg-cyan-600 text-white'
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
