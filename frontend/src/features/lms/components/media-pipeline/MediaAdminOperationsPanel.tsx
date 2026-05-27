import type { ShortformExportStatusSummary } from '../../../../lib/api-shortforms';
import type { TranscriptSpeakerReview } from '../../../../lib/api-media';

type MediaAdminOperationsPanelProps = {
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  demoMode: boolean;
  speakerReview: TranscriptSpeakerReview | null;
  speakerLabel: string;
  instructorName: string;
  speakerConfidence: string;
  speakerNote: string;
  shortformExportStatus: ShortformExportStatusSummary | null;
  onSpeakerLabelChange: (value: string) => void;
  onInstructorNameChange: (value: string) => void;
  onSpeakerConfidenceChange: (value: string) => void;
  onSpeakerNoteChange: (value: string) => void;
  onSaveSpeakerReview: () => void;
  onRetryFailedShortforms: () => void;
};

export function MediaAdminOperationsPanel({
  viewerRole,
  demoMode,
  speakerReview,
  speakerLabel,
  instructorName,
  speakerConfidence,
  speakerNote,
  shortformExportStatus,
  onSpeakerLabelChange,
  onInstructorNameChange,
  onSpeakerConfidenceChange,
  onSpeakerNoteChange,
  onSaveSpeakerReview,
  onRetryFailedShortforms,
}: MediaAdminOperationsPanelProps) {
  return (
    <>
      {(viewerRole === 'ADMIN' || viewerRole === 'INSTRUCTOR') && !demoMode ? (
        <section className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">화자/강사 검수</div>
              <div className="mt-1 text-xs text-slate-500">
                STT 화자 라벨을 실제 강사명으로 매핑해 RAG/요약 품질을 안정화합니다.
              </div>
            </div>
            <button
              type="button"
              onClick={onSaveSpeakerReview}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <i className="ri-save-line" />
              검수 저장
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">화자 라벨</span>
              <input value={speakerLabel} onChange={(event) => onSpeakerLabelChange(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">강사명</span>
              <input value={instructorName} onChange={(event) => onInstructorNameChange(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">신뢰도 (0~1)</span>
              <input value={speakerConfidence} onChange={(event) => onSpeakerConfidenceChange(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-600">메모</span>
              <input value={speakerNote} onChange={(event) => onSpeakerNoteChange(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
            </label>
          </div>
          {speakerReview ? (
            <div className="mt-3 text-xs text-slate-500">
              마지막 검수: {speakerReview.reviewed_at ?? '-'} · {speakerReview.reviewed_by ?? '-'}
            </div>
          ) : null}
        </section>
      ) : null}

      {viewerRole === 'ADMIN' && !demoMode ? (
        <section className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">숏폼 Export 운영 현황</div>
              <div className="mt-1 text-xs text-slate-500">실패 건만 일괄 재시도하고 최신 상태를 확인합니다.</div>
            </div>
            <button
              type="button"
              onClick={onRetryFailedShortforms}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              <i className="ri-refresh-line" />
              실패 건 재시도
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">PENDING</div><div className="mt-1 text-base font-bold text-slate-900">{shortformExportStatus?.pending_count ?? '-'}</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">PROCESSING</div><div className="mt-1 text-base font-bold text-slate-900">{shortformExportStatus?.processing_count ?? '-'}</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">COMPLETED</div><div className="mt-1 text-base font-bold text-emerald-700">{shortformExportStatus?.completed_count ?? '-'}</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">FAILED</div><div className="mt-1 text-base font-bold text-rose-700">{shortformExportStatus?.failed_count ?? '-'}</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">FAILED_PERMANENT</div><div className="mt-1 text-base font-bold text-rose-900">{shortformExportStatus?.failed_permanent_count ?? '-'}</div></div>
          </div>
          <div className="mt-3 text-xs text-slate-500">마지막 갱신: {shortformExportStatus?.last_updated_at ?? '-'}</div>
          <div className="mt-3 max-h-52 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3">
            {(shortformExportStatus?.failed_items ?? []).length === 0 ? (
              <div className="text-xs text-slate-500">실패 항목이 없습니다.</div>
            ) : (
              (shortformExportStatus?.failed_items ?? []).map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                  <div className="font-semibold text-slate-900">{item.title || item.id}</div>
                  <div className="mt-1 text-slate-500">{item.export_status} · retry {item.retry_count} · {item.updated_at ?? '-'}</div>
                  {item.error_message ? <div className="mt-1 text-rose-700">{item.error_message}</div> : null}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
