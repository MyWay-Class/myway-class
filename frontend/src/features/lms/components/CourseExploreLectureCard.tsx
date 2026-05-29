import { getLectureDisplayDurationMinutes, type CourseDetail, type LectureDetail } from '@myway/shared';
import { buildProtectedVideoUrl } from '../../../lib/video-url';
import { StatePanel } from './StatePanel';
import { formatDuration } from './CourseExploreDetailPanelSections';

type Props = {
  course: CourseDetail;
  detailLecture: LectureDetail | null;
  viewMode: 'detail' | 'watch';
  isLocked: boolean;
  canManageCurrent: boolean;
  resolvedLectureVideoUrl?: string;
  sessionToken?: string | null;
  remapAssetKey: string;
  setRemapAssetKey: (value: string) => void;
  remapBusy: boolean;
  remapMessage: string;
  handleRemapAssetKey: (lectureId?: string) => Promise<void>;
  onEnroll: (courseId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
  onSelectLecture: (lectureId: string) => void;
};

const primaryButtonClass = 'rounded-xl bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500';
const secondaryButtonClass = 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700';

export function CourseExploreLectureCard(props: Props) {
  const { course, detailLecture, viewMode, isLocked, canManageCurrent, resolvedLectureVideoUrl, sessionToken, remapAssetKey, setRemapAssetKey, remapBusy, remapMessage, handleRemapAssetKey, onEnroll, onNavigate, onSelectLecture } = props;
  const protectedVideoUrl = buildProtectedVideoUrl(resolvedLectureVideoUrl, sessionToken);

  if (!detailLecture) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-slate-500">선택한 차시</div>
          <div className="mt-1 text-[16px] font-bold text-slate-900">{detailLecture.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>{detailLecture.course_title}</span><span>·</span><span>{detailLecture.course_instructor}</span><span>·</span><span>{formatDuration(getLectureDisplayDurationMinutes(detailLecture))}</span></div>
        </div>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[18px] text-indigo-500 shadow-sm"><i className="ri-play-circle-line" /></div>
      </div>
      <p className="mt-4 text-[13px] leading-7 text-slate-600">{viewMode === 'watch' ? detailLecture.transcript_excerpt : course.description}</p>

      {viewMode === 'watch' && resolvedLectureVideoUrl ? (
        isLocked ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-amber-700">수강 신청이 필요합니다.</div>
            <p className="mt-2 text-[13px] leading-6 text-amber-900/80">이 차시의 영상을 보려면 먼저 강의를 수강 신청해야 합니다.</p>
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onEnroll(course.id)} className={primaryButtonClass}>수강 신청하기</button><button type="button" onClick={() => onNavigate('my-courses')} className={secondaryButtonClass}>내 강의로 이동</button></div>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black"><video className="h-auto w-full max-h-[240px]" controls preload="metadata" src={protectedVideoUrl} /></div>
        )
      ) : viewMode === 'watch' ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-700">재생 가능한 영상이 없습니다.</div>
          <p className="mt-2 text-[12px] leading-6 text-slate-500">강의 영상 URL이 비어 있습니다. 관리자라면 아래에서 R2 asset key를 재매핑할 수 있습니다.</p>
          {canManageCurrent ? (
            <div className="mt-3"><div className="flex flex-wrap gap-2"><input type="text" value={remapAssetKey} onChange={(event) => setRemapAssetKey(event.target.value)} placeholder="media/crs_xxx/lec_xxx.mp4" className="min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none" /><button type="button" disabled={remapBusy} onClick={() => void handleRemapAssetKey(detailLecture?.id)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[12px] font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60">R2 재매핑</button></div>{remapMessage ? <div className="mt-2 text-[11px] text-slate-500">{remapMessage}</div> : null}</div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {viewMode === 'watch' ? (
          isLocked ? (
            <button type="button" onClick={() => onEnroll(course.id)} className={primaryButtonClass}>수강 신청하기</button>
          ) : (
            <>
              <button type="button" onClick={() => onNavigate('courses')} className={secondaryButtonClass}>강의 상세로 돌아가기</button>
              <button type="button" onClick={() => onNavigate('shortform')} className={primaryButtonClass}>숏폼 만들기</button>
              {canManageCurrent ? <button type="button" onClick={() => onNavigate('media-pipeline')} className={secondaryButtonClass}>업로드/전사 관리</button> : null}
            </>
          )
        ) : (
          isLocked ? (
            <button type="button" onClick={() => onEnroll(course.id)} className={primaryButtonClass}>수강 신청하기</button>
          ) : (
            <>
              <button type="button" onClick={() => { onSelectLecture(detailLecture.id); onNavigate('lecture-watch'); }} className={primaryButtonClass}>강의 시청으로 이동</button>
              <button type="button" onClick={() => onNavigate('ai-chat')} className={secondaryButtonClass}>챗봇으로 질문</button>
            </>
          )
        )}
      </div>
    </div>
  );
}
