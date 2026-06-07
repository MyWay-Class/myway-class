import type { ClipSuggestion } from './ShortformWizardTypes';
import { formatTimestampInput, parseTimestampInput } from './ShortformWizardStep3Utils';

type ShortformWizardStep3PreviewProps = {
  courseTitle?: string | null;
  selectedClips: ClipSuggestion[];
  title: string;
  previewVideoUrl: string | null;
  exportStatus: string | null;
  totalDurationMs: number;
  onRemoveClip: (key: string) => void;
  onUpdateClipTimes: (key: string, startTimeMs: number, endTimeMs: number) => void;
  formatDuration: (ms: number) => string;
};

export function ShortformWizardStep3Preview({
  courseTitle,
  selectedClips,
  title,
  previewVideoUrl,
  exportStatus,
  totalDurationMs,
  onRemoveClip,
  onUpdateClipTimes,
  formatDuration,
}: ShortformWizardStep3PreviewProps) {
  return (
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
          const key = clip.id;
          return (
            <div key={key} className="space-y-3 rounded-xl bg-white/5 px-3 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-cyan-100 text-[10px] font-bold text-cyan-700">
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
                      if (nextStart === null) return;
                      onUpdateClipTimes(key, nextStart, clip.end_time_ms);
                    }}
                    placeholder="00:00"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-[12px] text-white outline-none transition focus:border-cyan-300"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-white/45">끝 시각</span>
                  <input
                    value={formatTimestampInput(clip.end_time_ms)}
                    onChange={(event) => {
                      const nextEnd = parseTimestampInput(event.target.value);
                      if (nextEnd === null) return;
                      onUpdateClipTimes(key, clip.start_time_ms, nextEnd);
                    }}
                    placeholder="00:30"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-[12px] text-white outline-none transition focus:border-cyan-300"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
