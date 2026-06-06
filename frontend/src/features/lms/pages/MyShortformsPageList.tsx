import { resolvePlayableVideoUrl } from '../../../lib/video-url';

function badgeClass(ownership: string): string {
  return ownership === 'owned' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700';
}

function exportBadgeClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'FAILED') return 'bg-rose-100 text-rose-700';
  if (status === 'PROCESSING') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

export function MyShortformsList({
  tab,
  filteredVideos,
  filteredCourses,
  onSaveShortform,
  onLikeShortform,
  onShareShortform,
  onRetryExport,
  onShareCourse,
  onCopyCourse,
}: {
  tab: 'videos' | 'courses';
  filteredVideos: Array<{ id: string; ownership: string; export_status: string; total_segments: number; title: string; description: string; video_url?: string | null; export_result_url?: string | null; course_id: string }>;
  filteredCourses: Array<{ id: string; ownership: string; clip_count: number; title: string; description: string }>;
  onSaveShortform: (videoId: string) => void;
  onLikeShortform: (videoId: string) => void;
  onShareShortform: (videoId: string, courseId: string) => void;
  onRetryExport: (videoId: string) => void;
  onShareCourse: (courseId: string) => void;
  onCopyCourse: (courseId: string) => void;
}) {
  return tab === 'videos' ? (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <h3 className="text-[15px] font-bold text-slate-900">숏폼 라이브러리</h3>
      <div className="mt-4 space-y-3">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => {
            const playable = resolvePlayableVideoUrl(video.export_result_url ?? undefined) ?? (video.video_url && !video.video_url.startsWith('/static/shortforms/') ? resolvePlayableVideoUrl(video.video_url) : null);
            return (
              <div key={video.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(video.ownership)}`}>{video.ownership}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${exportBadgeClass(video.export_status)}`}>export {video.export_status}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{video.total_segments} 세그먼트</span>
                </div>
                <div className="mt-2 text-[14px] font-bold text-slate-900">{video.title}</div>
                <p className="mt-1 text-[12px] leading-6 text-slate-500">{video.description}</p>
                {playable ? <video className="mt-3 w-full rounded-2xl border border-slate-200 bg-black" controls preload="metadata" src={playable ?? undefined} /> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onSaveShortform(video.id)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white">저장</button>
                  <button type="button" onClick={() => onLikeShortform(video.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">좋아요</button>
                  <button type="button" onClick={() => onShareShortform(video.id, video.course_id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">공유</button>
                  {video.export_status === 'FAILED' ? <button type="button" onClick={() => onRetryExport(video.id)} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-600">export 재시도</button> : null}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] leading-6 text-slate-500">숏폼 라이브러리가 아직 없습니다.</p>
        )}
      </div>
    </section>
  ) : (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <h3 className="text-[15px] font-bold text-slate-900">개인 코스 라이브러리</h3>
      <div className="mt-4 space-y-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-200 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(course.ownership)}`}>{course.ownership}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{course.clip_count} 클립</span>
              </div>
              <div className="mt-2 text-[14px] font-bold text-slate-900">{course.title}</div>
              <p className="mt-1 text-[12px] leading-6 text-slate-500">{course.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onShareCourse(course.id)} className="rounded-full bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white">공유</button>
                <button type="button" onClick={() => onCopyCourse(course.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">복사</button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[13px] leading-6 text-slate-500">개인 코스가 아직 없습니다.</p>
        )}
      </div>
    </section>
  );
}
