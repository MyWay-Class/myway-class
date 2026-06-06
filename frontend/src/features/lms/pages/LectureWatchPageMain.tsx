import type { CourseDetail, LectureDetail } from '@myway/shared';
import type { RefObject } from 'react';
import { formatWatchDuration, formatWatchTimecode } from './lectureWatchPageUtils';

type TranscriptView = {
  duration_ms?: number;
  segments?: Array<{ index: number; start_ms: number; end_ms: number; text: string }>;
} | null;

type NavigatePage = 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline';

export function LectureWatchMain({
  selectedCourse, currentLecture, highlightedLecture, transcript, isLocked, canManageCurrent, onEnroll, onNavigate,
  protectedVideoUrl, videoRef, videoErrorKind, setVideoErrorKind, videoErrorMessage, setVideoErrorMessage, videoChecking,
  remapAssetKey, setRemapAssetKey, remapBusy, remapMessage, handleRemapAssetKey, upcomingLectures,
}: {
  selectedCourse: CourseDetail;
  currentLecture: LectureDetail | null;
  highlightedLecture: LectureDetail | null;
  transcript: TranscriptView;
  isLocked: boolean;
  canManageCurrent: boolean;
  onEnroll: (courseId: string) => void;
  onNavigate: (page: NavigatePage) => void;
  protectedVideoUrl: string | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoErrorKind: 'unknown' | 'forbidden' | 'not_found' | null;
  setVideoErrorKind: (kind: 'unknown' | 'forbidden' | 'not_found' | null) => void;
  videoErrorMessage: string | null;
  setVideoErrorMessage: (message: string | null) => void;
  videoChecking: boolean;
  remapAssetKey: string;
  setRemapAssetKey: (value: string) => void;
  remapBusy: boolean;
  remapMessage: string;
  handleRemapAssetKey: () => Promise<void>;
  upcomingLectures: Array<{ title: string }>;
}) {
  return (
    <article className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-cyan-700">내 강의 / 영상 시청</div>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{selectedCourse.title}</h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--app-text-muted)]">{selectedCourse.category} · {selectedCourse.difficulty} · {selectedCourse.lecture_count}차시 · {selectedCourse.progress_percent}% 진행</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate('courses')} className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-soft)]">상세/진도율</button>
            <button type="button" onClick={() => onNavigate('my-courses')} className="rounded-full bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500">내 강의</button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-black shadow-[0_16px_32px_rgba(15,23,42,0.20)]">
          {isLocked ? (
            <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#1e293b_100%)] text-white">
              <div className="max-w-md px-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[30px] text-white/90"><i className="ri-lock-line" /></div>
                <div className="mt-4 text-[15px] font-semibold">수강 신청 후 영상을 볼 수 있습니다.</div>
                <div className="mt-1 text-[12px] text-white/65">상세 페이지에서 수강 신청을 완료하면 이 차시의 영상과 스크립트, 챗봇이 열립니다.</div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => onEnroll(selectedCourse.id)} className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100">수강 신청하기</button>
                  <button type="button" onClick={() => onNavigate('courses')} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/15">강의 상세로 이동</button>
                </div>
              </div>
            </div>
          ) : currentLecture?.video_url ? (
            <div className="relative">
              <video ref={videoRef} className="aspect-video w-full bg-black" controls preload="metadata" src={protectedVideoUrl} onError={() => { if (!videoErrorKind) { setVideoErrorKind('unknown'); setVideoErrorMessage('브라우저 재생 중 오류가 발생했습니다.'); } }} />
              {videoChecking ? <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white/90">재생 상태 확인 중...</div> : null}
              {videoErrorKind ? <div className="border-t border-white/10 bg-slate-950/90 px-4 py-3 text-[12px] text-white/90"><div className="font-semibold">{videoErrorKind === 'forbidden' ? '403 권한 오류' : videoErrorKind === 'not_found' ? '404 파일 없음' : '재생 오류'}</div><div className="mt-1 text-white/70">{videoErrorMessage ?? '영상 상태를 확인해 주세요.'}</div></div> : null}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#1e293b_100%)] text-white"><div className="text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[30px] text-white/90"><i className="ri-play-circle-fill" /></div><div className="mt-4 text-[15px] font-semibold">재생 가능한 영상이 없습니다.</div><div className="mt-1 text-[12px] text-white/65">이 차시는 텍스트/자료 기반으로 확인할 수 있습니다.</div>{canManageCurrent ? <div className="mx-auto mt-4 flex max-w-xl flex-col gap-2 text-left"><label htmlFor="lecture-remap-asset-key" className="text-[11px] font-semibold text-white/80">관리자: R2 asset key 재매핑</label><div className="flex flex-wrap gap-2"><input id="lecture-remap-asset-key" type="text" value={remapAssetKey} onChange={(event) => setRemapAssetKey(event.target.value)} placeholder="media/crs_xxx/lec_xxx.mp4" className="min-w-[260px] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/45 focus:border-cyan-300 focus:outline-none" /><button type="button" disabled={remapBusy} onClick={() => void handleRemapAssetKey()} className="rounded-xl bg-cyan-500 px-4 py-2 text-[12px] font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">R2 재매핑</button></div>{remapMessage ? <div className="text-[11px] text-white/70">{remapMessage}</div> : null}</div> : null}</div></div>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
            <div className="text-[12px] font-semibold text-cyan-700">현재 차시</div>
            <div className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{currentLecture?.title ?? '차시를 선택하세요'}</div>
            <p className="mt-3 text-[13px] leading-7 text-[var(--app-text-muted)]">{highlightedLecture?.transcript_excerpt ?? currentLecture?.content_text ?? '선택한 차시의 핵심 내용과 메모를 이곳에서 확인합니다.'}</p>
            {transcript?.duration_ms ? <div className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">실제 재생 길이 {formatWatchTimecode(transcript.duration_ms)}</div> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onNavigate('courses')} className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-soft)]">강의 상세로</button>
              <button type="button" onClick={() => onNavigate('shortform')} className="rounded-full bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500">숏폼 만들기</button>
              {canManageCurrent ? <button type="button" onClick={() => onNavigate('media-pipeline')} className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[12px] font-semibold text-cyan-700 transition hover:bg-cyan-100">업로드/전사 관리</button> : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
            <div className="text-[12px] font-semibold text-[var(--app-text-muted)]">진도율</div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="text-[30px] font-extrabold tracking-[-0.05em] text-[var(--app-text)]">{selectedCourse.progress_percent}%</div>
              <div className="text-right text-[11px] text-[var(--app-text-muted)]"><div>{selectedCourse.completed_lectures}/{selectedCourse.lecture_count}차시</div><div>{formatWatchDuration(selectedCourse.total_duration_minutes)}</div></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(selectedCourse.progress_percent, 8)}%` }} /></div>
            <div className="mt-3 text-[12px] leading-6 text-[var(--app-text-muted)]">{upcomingLectures.length > 0 ? `다음 차시는 ${upcomingLectures[0].title}입니다.` : '다음 차시가 없습니다.'}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
