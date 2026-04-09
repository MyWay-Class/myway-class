import type { ShortformCommunityItem } from '@myway/shared';

type ShortformPreviewModalProps = {
  item: ShortformCommunityItem | null;
  onClose: () => void;
};

function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) {
    return `${seconds}초`;
  }

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return remain > 0 ? `${minutes}분 ${remain}초` : `${minutes}분`;
}

export function ShortformPreviewModal({ item, onClose }: ShortformPreviewModalProps) {
  if (!item) {
    return null;
  }

  const totalDuration = item.clips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Shortform Preview</div>
            <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <i className="ri-close-line text-[18px]" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] bg-slate-950 px-5 py-5 text-white">
              <div className="aspect-video rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#111827,#334155)] flex items-center justify-center text-white/60">
                <div className="text-center">
                  <i className="ri-film-line text-[34px]" />
                  <p className="mt-2 text-[13px]">숏폼 미리보기</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-white/90">
                <span className="rounded-full bg-white/10 px-2.5 py-1">{item.course_title}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1">{item.clips.length}클립</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1">{formatDuration(totalDuration)}</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-[12px] font-semibold text-slate-900">상세 설명</div>
              <p className="mt-2 text-[13px] leading-7 text-slate-600">{item.description || '설명 없음'}</p>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="text-[12px] font-semibold text-slate-500">클립 구성</div>
            {item.clips.length > 0 ? (
              item.clips.map((clip, index) => (
                <article key={`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-bold text-indigo-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-900">{clip.lecture_title}</div>
                      <p className="mt-1 text-[12px] leading-6 text-slate-500">
                        {clip.label || '구간'} · {formatDuration(clip.end_time_ms - clip.start_time_ms)}
                      </p>
                      {clip.description ? <p className="mt-1 text-[12px] leading-6 text-slate-500">{clip.description}</p> : null}
                    </div>
                    <div className="flex-shrink-0 text-[11px] text-slate-400">
                      {Math.floor(clip.start_time_ms / 1000)}s ~ {Math.floor(clip.end_time_ms / 1000)}s
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
                아직 미리보기할 클립이 없습니다.
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">{item.view_count}</div>
                <div className="text-[11px] text-slate-500">조회</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">{item.like_count}</div>
                <div className="text-[11px] text-slate-500">좋아요</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">{item.save_count}</div>
                <div className="text-[11px] text-slate-500">저장</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
