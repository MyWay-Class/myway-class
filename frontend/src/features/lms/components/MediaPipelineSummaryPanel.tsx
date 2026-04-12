import type { AudioExtraction, LecturePipeline } from '@myway/shared';
import type { MediaUploadResult } from '../../../lib/api-media';

type MediaPipelineSummaryPanelProps = {
  selectedLecture: { title: string; duration_minutes: number } | null;
  pipeline: LecturePipeline | null;
  uploadResult: MediaUploadResult | null;
  extraction: AudioExtraction | null;
  notice: string;
};

function badgeTone(status: string): string {
  if (status === 'COMPLETED' || status === 'available') return 'bg-emerald-100 text-emerald-700';
  if (status === 'PROCESSING' || status === 'PENDING') return 'bg-amber-100 text-amber-700';
  if (status === 'FAILED' || status === 'disabled') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
}

function badgeLabel(status: string): string {
  if (status === 'COMPLETED') return '완료';
  if (status === 'PROCESSING') return '처리 중';
  if (status === 'PENDING') return '대기';
  if (status === 'FAILED') return '실패';
  if (status === 'available') return '사용 가능';
  if (status === 'disabled') return '비활성';
  return status;
}

export function MediaPipelineSummaryPanel({
  selectedLecture,
  pipeline,
  uploadResult,
  extraction,
  notice,
}: MediaPipelineSummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">요약 상태</div>
          <div className="mt-1 text-xs text-slate-500">
            {selectedLecture ? `${selectedLecture.title} · ${selectedLecture.duration_minutes}분` : '강의를 선택하면 요약 상태가 표시됩니다.'}
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {pipeline?.updated_at ? new Date(pipeline.updated_at).toLocaleString('ko-KR') : '업데이트 전'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">업로드</div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(uploadResult ? 'COMPLETED' : 'PENDING')}`}>
            {badgeLabel(uploadResult ? 'COMPLETED' : 'PENDING')}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">전사</div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(extraction?.stt_status ?? pipeline?.transcript_status ?? 'PENDING')}`}>
            {badgeLabel(extraction?.stt_status ?? pipeline?.transcript_status ?? 'PENDING')}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">요약</div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(pipeline?.summary_status ?? 'PENDING')}`}>
            {badgeLabel(pipeline?.summary_status ?? 'PENDING')}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        {notice}
      </div>
    </section>
  );
}
