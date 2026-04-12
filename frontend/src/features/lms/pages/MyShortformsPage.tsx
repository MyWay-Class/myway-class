import { useEffect, useState } from 'react';
import type { CourseCard, CourseDetail, CustomCourseLibraryItem, ShortformLibraryItem } from '@myway/shared';
import { copyCustomCourseDraft, loadCustomCourseLibrary, loadShortformLibrary, retryShortformExportDraft, saveShortformDraft, shareCustomCourseDraft, shareShortformDraft, toggleShortformLikeDraft } from '../../../lib/api';

type MyShortformsPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  sessionToken: string | null;
};

function badgeClass(ownership: string): string {
  return ownership === 'owned' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700';
}

export function MyShortformsPage({ courses, selectedCourse, sessionToken }: MyShortformsPageProps) {
  const [customCourses, setCustomCourses] = useState<CustomCourseLibraryItem[]>([]);
  const [shortformLibrary, setShortformLibrary] = useState<ShortformLibraryItem[]>([]);
  const [status, setStatus] = useState('라이브러리를 불러오는 중입니다.');

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

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">내 숏폼 라이브러리</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              owned/copied/saved 상태를 분리해서 개인 코스와 숏폼 재사용 흐름을 한곳에서 확인합니다.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {selectedCourse?.title ?? courses[0]?.title ?? '전체 강의'}
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-6 text-slate-500">{status}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{customCourses.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">개인 코스</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{ownedVideos.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">내 숏폼</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{savedVideos.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">저장한 숏폼</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{copiedCourses.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">복사한 코스</div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">개인 코스</h3>
          <div className="mt-4 space-y-3">
            {customCourses.length > 0 ? (
              customCourses.map((course) => (
                <div key={course.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(course.ownership)}`}>{course.ownership}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          {course.clip_count} 클립
                        </span>
                      </div>
                      <div className="mt-2 text-[14px] font-bold text-slate-900">{course.title}</div>
                      <p className="mt-1 text-[12px] leading-6 text-slate-500">{course.description}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{course.total_duration_ms / 1000}s</div>
                      <div>{course.share_count} 공유</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleShareCourse(course.id)} className="rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                      공유
                    </button>
                    <button type="button" onClick={() => void handleCopyCourse(course.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      복사
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">개인 코스가 아직 없습니다.</p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">숏폼 라이브러리</h3>
          <div className="mt-4 space-y-3">
            {shortformLibrary.length > 0 ? (
              shortformLibrary.map((video) => (
                <div key={video.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(video.ownership)}`}>{video.ownership}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          {video.total_segments} 세그먼트
                        </span>
                      </div>
                      <div className="mt-2 text-[14px] font-bold text-slate-900">{video.title}</div>
                      <p className="mt-1 text-[12px] leading-6 text-slate-500">{video.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${video.export_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : video.export_status === 'FAILED' ? 'bg-rose-100 text-rose-700' : video.export_status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          export {video.export_status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          retry {video.export_retry_count}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-slate-400">
                        {video.export_result_url ?? video.video_url}
                      </div>
                      {video.export_error_message ? <p className="mt-1 text-[11px] leading-5 text-rose-600">{video.export_error_message}</p> : null}
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{video.view_count} 조회</div>
                      <div>{video.like_count} 좋아요</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleSaveShortform(video.id)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                      저장
                    </button>
                    <button type="button" onClick={() => void handleLikeShortform(video.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      좋아요
                    </button>
                    <button type="button" onClick={() => void handleShareShortform(video.id, video.course_id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      공유
                    </button>
                    {video.export_status === 'FAILED' ? (
                      <button type="button" onClick={() => void handleRetryExport(video.id)} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-600">
                        export 재시도
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">숏폼 라이브러리가 아직 없습니다.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">소유한 개인 코스</h3>
          <div className="mt-4 space-y-2">
            {ownedCourses.length > 0 ? ownedCourses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-1 text-[12px] text-slate-500">{course.clip_count}개 클립 · {course.course_id}</div>
              </div>
            )) : <p className="text-[13px] leading-6 text-slate-500">소유한 개인 코스가 없습니다.</p>}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">저장한 숏폼</h3>
          <div className="mt-4 space-y-2">
            {savedVideos.length > 0 ? savedVideos.map((video) => (
              <div key={video.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-[13px] font-semibold text-slate-900">{video.title}</div>
                <div className="mt-1 text-[12px] text-slate-500">{video.save_folder ?? 'default'} · {video.save_note ?? '메모 없음'}</div>
              </div>
            )) : <p className="text-[13px] leading-6 text-slate-500">저장한 숏폼이 없습니다.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
