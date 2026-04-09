import type { LecturePipeline, STTProviderCatalog } from '@myway/shared';
import type { MediaExtractionResult, MediaUploadResult } from '../../../lib/api-media';

type MediaPipelineStatusBoardProps = {
  selectedLecture: { title: string; duration_minutes: number } | null;
  pipeline: LecturePipeline | null;
  providers: STTProviderCatalog | null;
  uploadResult: MediaUploadResult | null;
  extractionResult: MediaExtractionResult | null;
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

export function MediaPipelineStatusBoard({
  selectedLecture,
  pipeline,
  providers,
  uploadResult,
  extractionResult,
}: MediaPipelineStatusBoardProps) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">영상 업로드</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(uploadResult ? 'COMPLETED' : 'PENDING')}`}>
            {statusLabel(uploadResult ? 'COMPLETED' : 'PENDING')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {uploadResult ? uploadResult.file_name : 'R2 업로드 후 asset key가 생성됩니다.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">오디오 추출</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(extractionResult?.status ?? pipeline?.audio_status ?? 'PENDING')}`}>
            {statusLabel(extractionResult?.status ?? pipeline?.audio_status ?? 'PENDING')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {extractionResult ? `오디오 포맷 ${extractionResult.audio_format} · ${Math.max(1, Math.round(extractionResult.audio_duration_ms / 1000))}초` : '오디오 추출 job이 아직 없습니다.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">트랜스크립트</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(pipeline?.transcript_status ?? 'PENDING')}`}>
            {statusLabel(pipeline?.transcript_status ?? 'PENDING')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {selectedLecture ? `${selectedLecture.title} · ${selectedLecture.duration_minutes}분` : '강의를 선택하면 전사 경로가 연결됩니다.'}
          </p>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">파이프라인 상태</div>
              <div className="text-xs text-slate-500">영상 업로드, 오디오 추출, 전사 상태를 같이 확인합니다.</div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {pipeline?.updated_at ? new Date(pipeline.updated_at).toLocaleString('ko-KR') : '업데이트 전'}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              { label: '오디오 상태', value: pipeline?.audio_status ?? 'PENDING' },
              { label: '요약 상태', value: pipeline?.summary_status ?? 'PENDING' },
              { label: '전사 ID', value: pipeline?.transcript_id ?? '없음' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{item.label}</div>
                <div className="mt-2 break-words text-sm font-semibold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <div className="text-sm font-semibold text-slate-900">업로드 산출물</div>
            {uploadResult ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">{uploadResult.asset_key}</div>
                <div className="mt-1 break-all text-xs">{uploadResult.video_url}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                아직 업로드된 영상이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">STT provider 상태</div>
          <div className="mt-3 space-y-3">
            {providers?.providers.map((provider) => (
              <div key={provider.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{provider.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{provider.description}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(provider.status)}`}>
                    {statusLabel(provider.status)}
                  </span>
                </div>
              </div>
            )) ?? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                provider 정보를 불러오지 못했습니다.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
