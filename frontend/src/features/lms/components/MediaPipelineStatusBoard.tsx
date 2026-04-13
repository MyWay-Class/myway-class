import { getLectureDisplayDurationMinutes, type AudioExtraction, type LecturePipeline, type MediaProcessorHealth, type STTProviderCatalog } from '@myway/shared';
import type { MediaUploadResult } from '../../../lib/api-media';

type MediaPipelineStatusBoardProps = {
  compact?: boolean;
  selectedLecture: { title: string; duration_minutes: number } | null;
  pipeline: LecturePipeline | null;
  providers: STTProviderCatalog | null;
  processorHealth: MediaProcessorHealth | null;
  uploadResult: MediaUploadResult | null;
  extraction: AudioExtraction | null;
  recentExtractions?: AudioExtraction[];
  isRefreshing?: boolean;
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

function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString('ko-KR') : '기록 없음';
}

export function MediaPipelineStatusBoard({
  compact = false,
  selectedLecture,
  pipeline,
  providers,
  processorHealth,
  uploadResult,
  extraction,
  recentExtractions = [],
  isRefreshing = false,
  onRefresh,
}: MediaPipelineStatusBoardProps) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">FFmpeg 실행 환경</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(processorHealth?.ffmpeg.available ? 'available' : 'disabled')}`}>
            {statusLabel(processorHealth?.ffmpeg.available ? 'available' : 'disabled')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {processorHealth?.ffmpeg.version ?? processorHealth?.ffmpeg.path ?? 'FFmpeg 버전 정보가 없습니다.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">콜백 보안</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(processorHealth?.callback_secret_configured ? 'available' : 'disabled')}`}>
            {statusLabel(processorHealth?.callback_secret_configured ? 'available' : 'disabled')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {processorHealth?.callback_secret_configured ? 'callback secret이 설정되어 있습니다.' : 'callback secret이 비어 있습니다.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 job</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone((processorHealth?.jobs.processing ?? 0) > 0 ? 'PROCESSING' : 'COMPLETED')}`}>
            {(processorHealth?.jobs.processing ?? 0) > 0 ? statusLabel('PROCESSING') : statusLabel('COMPLETED')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            총 {processorHealth?.jobs.total ?? 0}건 · 처리 중 {processorHealth?.jobs.processing ?? 0}건 · 실패 {processorHealth?.jobs.failed ?? 0}건
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">작업 디렉터리</div>
          <div className="mt-3 break-all text-sm font-semibold text-slate-900">{processorHealth?.work_dir ?? '미확인'}</div>
          <p className="mt-4 text-sm text-slate-600">
            {processorHealth?.public_base_url ?? 'processor URL 미확인'}
          </p>
        </div>
      </section>

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
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(extraction?.status ?? pipeline?.audio_status ?? 'PENDING')}`}>
            {statusLabel(extraction?.status ?? pipeline?.audio_status ?? 'PENDING')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {extraction ? `오디오 포맷 ${extraction.audio_format} · ${Math.max(1, Math.round(extraction.audio_duration_ms / 1000))}초` : '오디오 추출 job이 아직 없습니다.'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">트랜스크립트</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(pipeline?.transcript_status ?? 'PENDING')}`}>
            {statusLabel(pipeline?.transcript_status ?? 'PENDING')}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {selectedLecture ? `${selectedLecture.title} · ${getLectureDisplayDurationMinutes(selectedLecture)}분` : '강의를 선택하면 전사 경로가 연결됩니다.'}
          </p>
        </div>
      </section>

      {compact ? null : (
        <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">파이프라인 상태</div>
              <div className="text-xs text-slate-500">영상 업로드, 오디오 추출, 전사 상태를 같이 확인합니다.</div>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefreshing ? '갱신 중' : '상태 새로고침'}
                </button>
              ) : null}
              {isRefreshing ? (
                <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">상태 새로고침 중</div>
              ) : null}
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {pipeline?.updated_at ? new Date(pipeline.updated_at).toLocaleString('ko-KR') : '업데이트 전'}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              { label: '오디오 상태', value: pipeline?.audio_status ?? 'PENDING' },
              { label: 'STT 상태', value: extraction?.stt_status ?? pipeline?.transcript_status ?? 'PENDING' },
              { label: '요약 상태', value: pipeline?.summary_status ?? 'PENDING' },
              { label: '처리 서비스 job', value: extraction?.processing_job_id ?? '없음' },
              { label: '전사 ID', value: extraction?.transcript_id ?? pipeline?.transcript_id ?? '없음' },
              { label: '처리 완료 시각', value: extraction?.processed_at ? new Date(extraction.processed_at).toLocaleString('ko-KR') : '대기 중' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{item.label}</div>
                <div className="mt-2 break-words text-sm font-semibold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <div className="text-sm font-semibold text-slate-900">최근 추출 이력</div>
            {recentExtractions.length > 0 ? (
              <div className="space-y-3">
                {recentExtractions.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.id}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          생성 {formatDateTime(item.created_at)} · 갱신 {formatDateTime(item.updated_at)}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                        {statusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">오디오 URL</div>
                        <div className="mt-1 break-all text-sm text-slate-700">{item.audio_url ?? 'callback 대기 중'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 서비스 job</div>
                        <div className="mt-1 break-all text-sm text-slate-700">{item.processing_job_id ?? '아직 없음'}</div>
                      </div>
                    </div>
                    {item.processing_error ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {item.processing_error}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                아직 기록된 추출 이력이 없습니다.
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="text-sm font-semibold text-slate-900">최근 processor job</div>
            {processorHealth?.recent_jobs?.length ? (
              <div className="space-y-3">
                {processorHealth.recent_jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{job.lecture_id}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          생성 {formatDateTime(job.created_at)} · 갱신 {formatDateTime(job.updated_at)}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(job.status)}`}>
                        {statusLabel(job.status)}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">단계</div>
                        <div className="mt-1 text-sm text-slate-700">{job.stage}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">세부</div>
                        <div className="mt-1 text-sm text-slate-700">{job.step}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">오디오 URL</div>
                        <div className="mt-1 break-all text-sm text-slate-700">{job.audio_url ?? 'callback 대기 중'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">callback 상태</div>
                        <div className="mt-1 text-sm text-slate-700">{job.callback_status ?? '없음'}</div>
                      </div>
                    </div>
                    {job.error_message ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {job.error_message}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                processor job 이력이 없습니다.
              </div>
            )}
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

          <div className="mt-5 space-y-3">
            <div className="text-sm font-semibold text-slate-900">추출 진행 세부</div>
            {extraction ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">오디오 URL</div>
                    <div className="mt-1 break-all font-medium text-slate-900">{extraction.audio_url ?? 'callback 대기 중'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">요청 STT</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {extraction.requested_stt_provider ?? '자동 선택'}
                      {extraction.requested_stt_model ? ` · ${extraction.requested_stt_model}` : ''}
                    </div>
                  </div>
                </div>
                {extraction.processing_error ? (
                  <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {extraction.processing_error}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                아직 생성된 추출 작업이 없습니다.
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
      )}
    </div>
  );
}
