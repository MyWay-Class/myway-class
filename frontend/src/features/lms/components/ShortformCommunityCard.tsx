import type { ShortformCommunityItem } from '@myway/shared';

type ShortformCommunityCardProps = {
  item: ShortformCommunityItem;
  active: boolean;
  onOpen: (item: ShortformCommunityItem) => void;
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

export function ShortformCommunityCard({ item, active, onOpen }: ShortformCommunityCardProps) {
  const totalDuration = item.clips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className={`overflow-hidden rounded-3xl border bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
        active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="bg-[linear-gradient(135deg,#1e293b,#475569)] px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold opacity-90">{item.shared_by_name}</div>
            <div className="mt-1 line-clamp-2 text-[18px] font-extrabold tracking-[-0.03em]">{item.title}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-[22px]">
            <i className="ri-film-line" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold opacity-90">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{item.course_title}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{item.clips.length}클립</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{formatDuration(totalDuration)}</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="space-y-1.5">
          {item.clips.slice(0, 3).map((clip, index) => (
            <div key={`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px]">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-600">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-600">{clip.lecture_title}</span>
              <span className="flex-shrink-0 text-slate-400">
                {Math.floor(clip.start_time_ms / 1000)}s ~ {Math.floor(clip.end_time_ms / 1000)}s
              </span>
            </div>
          ))}
          {item.clips.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-500">클립 미리보기 준비 중입니다.</div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
          <span>{item.shared_by_name}</span>
          <span className="flex items-center gap-1">
            <i className="ri-heart-3-line" />
            {item.like_count}
          </span>
        </div>
      </div>
    </article>
  );
}
