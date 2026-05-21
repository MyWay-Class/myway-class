import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, CustomCourseLibraryItem, ShortformLibraryItem } from '@myway/shared';
import {
  copyCustomCourseDraft,
  loadCustomCourseLibrary,
  loadShortformLibrary,
  retryShortformExportDraft,
  saveShortformDraft,
  shareCustomCourseDraft,
  shareShortformDraft,
  toggleShortformLikeDraft,
} from '../../../lib/api';
import { resolvePlayableVideoUrl } from '../../../lib/video-url';

type MyShortformsPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  sessionToken: string | null;
};

type LibraryTab = 'videos' | 'courses';

function badgeClass(ownership: string): string {
  return ownership === 'owned' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700';
}

function exportBadgeClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'FAILED') return 'bg-rose-100 text-rose-700';
  if (status === 'PROCESSING') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

export function MyShortformsPage({ courses, selectedCourse, sessionToken }: MyShortformsPageProps) {
  const [customCourses, setCustomCourses] = useState<CustomCourseLibraryItem[]>([]);
  const [shortformLibrary, setShortformLibrary] = useState<ShortformLibraryItem[]>([]);
  const [status, setStatus] = useState('라이브러리를 불러오는 중입니다.');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LibraryTab>('videos');

  async function refreshLibrary() {
    const [customCourseData, shortformData] = await Promise.all([
      loadCustomCourseLibrary(sessionToken),
      loadShortformLibrary(sessionToken),
    ]);

    setCustomCourses(customCourseData);
    setShortformLibrary(shortformData);
    setStatus('라이브러리가 최신 상태입니다.');
  }

  useEffect(() => {
    void refreshLibrary();
  }, [sessionToken]);

  async function handleShareCourse(courseId: string) {
    const ok = await shareCustomCourseDraft(courseId, { message: '공유 가능한 개인 코스입니다.' }, sessionToken);
    setStatus(ok ? '개인 코스를 공유했습니다.' : '개인 코스 공유에 실패했습니다.');
    await refreshLibrary();
  }

  async function handleCopyCourse(courseId: string) {
    const copied = await copyCustomCourseDraft(courseId, { custom_course_id: courseId }, sessionToken);
    setStatus(copied ? '개인 코스를 복사했습니다.' : '복사에 실패했습니다.');
    await refreshLibrary();
  }

  async function handleShareShortform(videoId: string, courseId: string) {
    const ok = await shareShortformDraft({ video_id: videoId, course_id: courseId, message: '학습용 숏폼을 공유합니다.' }, sessionToken);
    setStatus(ok ? '숏폼을 공유했습니다.' : '숏폼 공유에 실패했습니다.');
    await refreshLibrary();
  }

  async function handleSaveShortform(videoId: string) {
    const ok = await saveShortformDraft({ video_id: videoId, folder: 'library', note: '학습 라이브러리 저장' }, sessionToken);
    setStatus(ok ? '숏폼을 라이브러리에 저장했습니다.' : '저장에 실패했습니다.');
    await refreshLibrary();
  }

  async function handleLikeShortform(videoId: string) {
    const ok = await toggleShortformLikeDraft(videoId, sessionToken);
    setStatus(ok ? '좋아요 상태를 반영했습니다.' : '좋아요 처리에 실패했습니다.');
    await refreshLibrary();
  }

  async function handleRetryExport(videoId: string) {
    const ok = await retryShortformExportDraft(videoId, sessionToken);
    setStatus(ok ? '숏폼 export를 다시 시작했습니다.' : '숏폼 export 재시도에 실패했습니다.');
    await refreshLibrary();
  }

  const ownedCourses = customCourses.filter((course) => course.ownership === 'owned');
  const copiedCourses = customCourses.filter((course) => course.ownership === 'copied');
  const ownedVideos = shortformLibrary.filter((video) => video.ownership === 'owned');
  const savedVideos = shortformLibrary.filter((video) => video.ownership === 'saved');

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customCourses.filter((course) => {
      if (!q) return true;
      return [course.title, course.description, course.course_id].join(' ').toLowerCase().includes(q);
    });
  }, [customCourses, query]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shortformLibrary.filter((video) => {
      if (!q) return true;
      return [video.title, video.description, video.course_id].join(' ').toLowerCase().includes(q);
    });
  }, [shortformLibrary, query]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-5 py-5 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.03em]">내 숏폼 라이브러리</h2>
            <p className="mt-2 text-[12px] leading-6 text-cyan-50/85">내 숏폼, 저장 숏폼, 개인 코스를 검색/관리하고 바로 공유할 수 있습니다.</p>
            <div className="mt-2 text-[11px] text-cyan-100/80">{selectedCourse?.title ?? courses[0]?.title ?? '전체 강의'}</div>
          </div>
          <div className="rounded-xl border border-cyan-100/25 bg-white/10 px-4 py-3 text-[12px] text-cyan-50/90">
            <div>내 숏폼 {ownedVideos.length}개 · 저장 {savedVideos.length}개</div>
            <div className="mt-1">개인 코스 {customCourses.length}개</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="숏폼 제목, 설명, 코스 ID 검색"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] outline-none focus:border-cyan-300"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('videos')}
              className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tab === 'videos' ? 'bg-cyan-600 text-white' : 'border border-slate-200 text-slate-600'}`}
            >
              숏폼
            </button>
            <button
              type="button"
              onClick={() => setTab('courses')}
              className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tab === 'courses' ? 'bg-cyan-600 text-white' : 'border border-slate-200 text-slate-600'}`}
            >
              개인 코스
            </button>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">{status}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{customCourses.length}</div><div className="mt-1 text-[12px] text-slate-500">개인 코스</div></article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{ownedVideos.length}</div><div className="mt-1 text-[12px] text-slate-500">내 숏폼</div></article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{savedVideos.length}</div><div className="mt-1 text-[12px] text-slate-500">저장 숏폼</div></article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{copiedCourses.length}</div><div className="mt-1 text-[12px] text-slate-500">복사 코스</div></article>
      </section>

      {tab === 'videos' ? (
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
                      <button type="button" onClick={() => void handleSaveShortform(video.id)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white">저장</button>
                      <button type="button" onClick={() => void handleLikeShortform(video.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">좋아요</button>
                      <button type="button" onClick={() => void handleShareShortform(video.id, video.course_id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">공유</button>
                      {video.export_status === 'FAILED' ? <button type="button" onClick={() => void handleRetryExport(video.id)} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-600">export 재시도</button> : null}
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
                    <button type="button" onClick={() => void handleShareCourse(course.id)} className="rounded-full bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white">공유</button>
                    <button type="button" onClick={() => void handleCopyCourse(course.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">복사</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">개인 코스가 아직 없습니다.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
