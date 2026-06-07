import { StatePanel } from '../StatePanel';
import type { AudioExtraction } from '@myway/shared';

type SttPolicySummary = {
  mode: string;
  overwritePolicy: string;
  approvalState: string;
  notificationChannel: string;
  notifiedAt: string;
  callbackEvents: number;
  notifications: number;
};

type RetrySource = {
  video_url?: string;
};

type MediaPipelinePolicyPanelsProps = {
  latestExtraction: AudioExtraction | null;
  requiresManualApproval: boolean;
  sttPolicySummary: SttPolicySummary | null;
  retrySource: RetrySource;
  busy: boolean;
  demoMode: boolean;
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  onApproveStt: () => void;
  onRetryExtraction: () => void;
};

export function MediaPipelinePolicyPanels({
  latestExtraction,
  requiresManualApproval,
  sttPolicySummary,
  retrySource,
  busy,
  demoMode,
  viewerRole,
  onApproveStt,
  onRetryExtraction,
}: MediaPipelinePolicyPanelsProps) {
  return (
    <>
      {latestExtraction?.status === 'FAILED' ? (
        <StatePanel
          compact
          icon="ri-error-warning-line"
          tone="rose"
          title="오디오 추출이 실패했습니다."
          description={latestExtraction.processing_error ?? '외부 처리 서비스 또는 callback 반영 과정에서 실패했습니다. 입력 경로를 확인한 뒤 다시 요청해 주세요.'}
        />
      ) : null}

      {requiresManualApproval ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">승인 대기 중인 STT</div>
              <div className="mt-1 text-sm text-slate-600">
                현재 추출 건은 자동 시작이 보류되었습니다. 검토 후 승인 실행 버튼으로 전사를 시작할 수 있습니다.
              </div>
            </div>
            <button
              type="button"
              onClick={onApproveStt}
              disabled={busy || viewerRole === 'STUDENT'}
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-check-double-line'}`} />
              STT 승인 실행
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            extraction: {latestExtraction?.id} · mode: {latestExtraction?.stt_sync_mode ?? '-'} · approval: {latestExtraction?.stt_approval_state ?? '-'}
          </div>
        </section>
      ) : null}

      {sttPolicySummary ? (
        <section className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_10px_24px_rgba(6,31,57,0.07)]">
          <div className="text-sm font-semibold text-slate-900">STT 메타 동기화 정책/지표</div>
          <div className="mt-1 text-xs text-slate-500">자동/승인 모드, overwrite 정책, 알림 채널과 callback/알림 카운트를 함께 확인합니다.</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-[#f4faff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">동기화 모드</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{sttPolicySummary.mode}</div>
              <div className="mt-2 text-xs text-slate-500">approval: {sttPolicySummary.approvalState}</div>
            </div>
            <div className="rounded-2xl bg-[#f4faff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Overwrite 정책</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{sttPolicySummary.overwritePolicy}</div>
              <div className="mt-2 text-xs text-slate-500">channel: {sttPolicySummary.notificationChannel}</div>
            </div>
            <div className="rounded-2xl bg-[#f4faff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">알림/콜백 지표</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                callback {sttPolicySummary.callbackEvents} · notify {sttPolicySummary.notifications}
              </div>
              <div className="mt-2 text-xs text-slate-500">notified_at: {sttPolicySummary.notifiedAt}</div>
            </div>
          </div>
        </section>
      ) : null}

      {latestExtraction?.status === 'FAILED' ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">실패 후 다음 단계</div>
              <div className="mt-1 text-sm text-slate-600">
                영상 업로드 결과나 기존 source video URL이 남아 있으면 같은 입력으로 다시 추출을 요청할 수 있습니다.
              </div>
            </div>
            <button
              type="button"
              onClick={onRetryExtraction}
              disabled={busy || !retrySource.video_url || demoMode}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}`} />
              추출 다시 시도
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">재시도 source video</div>
              <div className="mt-1 break-all text-sm text-slate-700">{retrySource.video_url ?? '없음'}</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">재시도 전 확인</div>
              <div className="mt-1 text-sm text-slate-700">
                callback secret, media processor 연결 상태, 업로드 asset URL 접근 가능 여부를 먼저 확인하세요.
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
