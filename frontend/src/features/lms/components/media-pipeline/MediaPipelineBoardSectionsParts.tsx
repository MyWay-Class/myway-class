import { getLectureDisplayDurationMinutes, type AudioExtraction, type LecturePipeline, type MediaProcessorHealth, type STTProviderCatalog } from '@myway/shared';
import type { MediaUploadResult } from '../../../../lib/api-media';

type SectionProps = {
  selectedLecture: { title: string; duration_minutes: number } | null;
  pipeline: LecturePipeline | null;
  providers: STTProviderCatalog | null;
  processorHealth: MediaProcessorHealth | null;
  uploadResult: MediaUploadResult | null;
  extraction: AudioExtraction | null;
  recentExtractions: AudioExtraction[];
  isRefreshing: boolean;
  onRefresh?: () => void;
};

function statusTone(status: string): string {
  if (status === 'COMPLETED' || status === 'available') return 'bg-emerald-100 text-emerald-700';
  if (status === 'PROCESSING' || status === 'checking' || status === 'PENDING') return 'bg-amber-100 text-amber-700';
  if (status === 'FAILED' || status === 'disabled') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
}

function statusLabel(status: string): string {
  if (status === 'COMPLETED') return '완료';
  if (status === 'PROCESSING') return '처리 중';
  if (status === 'PENDING') return '대기';
  if (status === 'FAILED') return '실패';
  if (status === 'available') return '사용 가능';
  if (status === 'planned') return '계획됨';
  if (status === 'disabled') return '비활성';
  return status;
}

export function HealthCards({ processorHealth }: Pick<SectionProps, 'processorHealth'>) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">FFmpeg 실행 환경</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(processorHealth?.ffmpeg.available ? 'available' : 'disabled')}`}>
          {statusLabel(processorHealth?.ffmpeg.available ? 'available' : 'disabled')}
        </div>
        <p className="mt-4 text-sm text-slate-600">{processorHealth?.ffmpeg.version ?? processorHealth?.ffmpeg.path ?? 'FFmpeg 버전 정보가 없습니다.'}</p>
      </div>
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">콜백 보안</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(processorHealth?.callback_secret_configured ? 'available' : 'disabled')}`}>
          {statusLabel(processorHealth?.callback_secret_configured ? 'available' : 'disabled')}
        </div>
        <p className="mt-4 text-sm text-slate-600">{processorHealth?.callback_secret_configured ? 'callback secret이 설정되어 있습니다.' : 'callback secret이 비어 있습니다.'}</p>
      </div>
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 job</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone((processorHealth?.jobs.processing ?? 0) > 0 ? 'PROCESSING' : 'COMPLETED')}`}>
          {(processorHealth?.jobs.processing ?? 0) > 0 ? statusLabel('PROCESSING') : statusLabel('COMPLETED')}
        </div>
        <p className="mt-4 text-sm text-slate-600">총 {processorHealth?.jobs.total ?? 0}건 · 처리 중 {processorHealth?.jobs.processing ?? 0}건 · 실패 {processorHealth?.jobs.failed ?? 0}건</p>
      </div>
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">작업 디렉터리</div>
        <div className="mt-3 break-all text-sm font-semibold text-slate-900">{processorHealth?.work_dir ?? '미확인'}</div>
        <p className="mt-4 text-sm text-slate-600">{processorHealth?.public_base_url ?? 'processor URL 미확인'}</p>
      </div>
    </section>
  );
}

export function PipelineCards({ uploadResult, extraction, pipeline, selectedLecture }: Pick<SectionProps, 'uploadResult' | 'extraction' | 'pipeline' | 'selectedLecture'>) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">영상 업로드</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(uploadResult ? 'COMPLETED' : 'PENDING')}`}>{statusLabel(uploadResult ? 'COMPLETED' : 'PENDING')}</div>
        <p className="mt-4 text-sm text-slate-600">{uploadResult ? uploadResult.file_name : 'R2 업로드 후 asset key가 생성됩니다.'}</p>
      </div>
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">오디오 추출</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(extraction?.status ?? pipeline?.audio_status ?? 'PENDING')}`}>{statusLabel(extraction?.status ?? pipeline?.audio_status ?? 'PENDING')}</div>
        <p className="mt-4 text-sm text-slate-600">{extraction ? `오디오 포맷 ${extraction.audio_format} · ${Math.max(1, Math.round(extraction.audio_duration_ms / 1000))}초` : '오디오 추출 job이 아직 없습니다.'}</p>
      </div>
      <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">트랜스크립트</div>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(pipeline?.transcript_status ?? 'PENDING')}`}>{statusLabel(pipeline?.transcript_status ?? 'PENDING')}</div>
        <p className="mt-4 text-sm text-slate-600">{selectedLecture ? `${selectedLecture.title} · ${getLectureDisplayDurationMinutes(selectedLecture)}분` : '강의를 선택하면 전사 경로가 연결됩니다.'}</p>
      </div>
    </section>
  );
}
