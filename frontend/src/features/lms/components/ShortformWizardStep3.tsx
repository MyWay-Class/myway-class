import type { ClipSuggestion } from './ShortformWizardTypes';

type ShortformWizardStep3Props = {
  courseTitle?: string | null;
  selectedClips: ClipSuggestion[];
  title: string;
  description: string;
  createdVideoId: string | null;
  previewVideoUrl: string | null;
  exportStatus: string | null;
  status: string;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onRemoveClip: (key: string) => void;
  onUpdateClipTimes: (key: string, startTimeMs: number, endTimeMs: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  formatDuration: (ms: number) => string;
};

function formatTimestampInput(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseTimestampInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 1) {
    return Math.max(0, Math.round(parts[0] * 1000));
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return Math.max(0, Math.round((minutes * 60 + seconds) * 1000));
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return Math.max(0, Math.round((hours * 3600 + minutes * 60 + seconds) * 1000));
  }

  return null;
}

export function ShortformWizardStep3({
  courseTitle,
  selectedClips,
  title,
  description,
  createdVideoId,
  previewVideoUrl,
  exportStatus,
  status,
  onBack,
  onSave,
  onShare,
  onRemoveClip,
  onUpdateClipTimes,
  onTitleChange,
  onDescriptionChange,
  formatDuration,
}: ShortformWizardStep3Props) {
  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);

  return (
    <article className="space-y-5 rounded-2xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <i className="ri-edit-line text-[18px] text-indigo-500" />
            <h2 className="text-[16px] font-semibold text-slate-900">3단계 · 미리보기 / 저장</h2>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">선택한 클립을 미리보고 제목과 설명을 입력한 뒤 저장합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{formatDuration(totalDurationMs)} 합계</span>
          <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-600">
            이전
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-white/70">
          <span>{courseTitle ?? '선택된 강좌 없음'}</span>
          <span>
            {selectedClips.length}클립 · {formatDuration(totalDurationMs)}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {previewVideoUrl ? (
            <video className="aspect-video w-full bg-black" controls preload="metadata" src={previewVideoUrl} />
          ) : (
            <div className="flex min-h-[180px] items-center justify-center p-6">
              <div className="text-center text-white/60">
                <i className="ri-play-circle-line text-5xl" />
                <p className="mt-2 text-[13px] font-semibold text-white/80">{title || '숏폼 제목을 입력하세요'}</p>
                <p className="mt-1 text-[12px]">{selectedClips.length}개 클립 재생 목록</p>
                <p className="mt-2 text-[11px] text-white/45">
                  {exportStatus === 'PROCESSING'
                    ? '숏폼 영상을 합치는 중입니다. 완료되면 바로 재생할 수 있습니다.'
                    : '선택한 구간을 조립해 실제 재생 가능한 숏폼으로 저장합니다.'}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1.5">
          {selectedClips.map((clip, index) => {
            const key = `${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`;
            return (
              <div key={key} className="space-y-3 rounded-xl bg-white/5 px-3 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold text-indigo-600">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {clip.lecture_title} - {clip.label}
                  </span>
                  <span className="text-white/60">{formatDuration(clip.end_time_ms - clip.start_time_ms)}</span>
                  <button type="button" onClick={() => onRemoveClip(key)} className="text-white/35 hover:text-white">
                    <i className="ri-close-line" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-white/45">시작 시각</span>
                    <input
                      value={formatTimestampInput(clip.start_time_ms)}
                      onChange={(event) => {
                        const nextStart = parseTimestampInput(event.target.value);
                        if (nextStart === null) {
                          return;
                        }

                        onUpdateClipTimes(key, nextStart, clip.end_time_ms);
                      }}
                      placeholder="00:00"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-[12px] text-white outline-none transition focus:border-indigo-300"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-white/45">끝 시각</span>
                    <input
                      value={formatTimestampInput(clip.end_time_ms)}
                      onChange={(event) => {
                        const nextEnd = parseTimestampInput(event.target.value);
                        if (nextEnd === null) {
                          return;
                        }

                        onUpdateClipTimes(key, clip.start_time_ms, nextEnd);
                      }}
                      placeholder="00:30"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-[12px] text-white outline-none transition focus:border-indigo-300"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-slate-500">
            숏폼 제목 <span className="text-rose-500">*</span>
          </label>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none transition focus:border-indigo-300 focus:bg-white"
            placeholder="예: AI 1주차 핵심 요약"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-slate-500">설명 <span className="text-xs text-slate-400">(선택)</span></label>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 outline-none transition focus:border-indigo-300 focus:bg-white"
            placeholder="숏폼에 대한 간단한 설명"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onSave} className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white">
          숏폼 생성
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={!createdVideoId}
          className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 disabled:pointer-events-none disabled:opacity-50"
        >
          공유하기
        </button>
      </div>
      <p className="text-[12px] leading-6 text-slate-500">{status}</p>
      {createdVideoId ? <p className="text-[11px] text-slate-400">생성 ID: {createdVideoId}</p> : null}
    </article>
  );
}
