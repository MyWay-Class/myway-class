import type { CourseDetail, LectureDetail } from '@myway/shared';
import type { RefObject } from 'react';
import { CourseSessionTimeline } from '../components/CourseSessionTimeline';
import { LectureSideChatPanel } from '../components/LectureSideChatPanel';
import { StatePanel } from '../components/StatePanel';
import { formatWatchTimecode, lectureWatchTabs, type LectureWatchPanelTab } from './lectureWatchPageUtils';

type TranscriptView = {
  duration_ms?: number;
  segments?: Array<{ index: number; start_ms: number; end_ms: number; text: string }>;
} | null;

type NavigatePage = 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline';

export function LectureWatchAside({
  isLocked, selectedCourse, onEnroll, activePanelTab, setActivePanelTab, selectedLectureId, onSelectLecture, onNavigate,
  transcriptLoading, transcript, seekVideoTo, highlightedLecture, sessionToken, handleSeekFromChat,
  transcriptAccessState,
}: {
  isLocked: boolean;
  selectedCourse: CourseDetail;
  onEnroll: (courseId: string) => void;
  activePanelTab: LectureWatchPanelTab;
  setActivePanelTab: (tab: LectureWatchPanelTab) => void;
  selectedLectureId: string;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: NavigatePage) => void;
  transcriptLoading: boolean;
  transcriptAccessState: 'loading' | 'ready' | 'empty' | 'forbidden' | 'error';
  transcript: TranscriptView;
  seekVideoTo: (startMs: number) => void;
  highlightedLecture: LectureDetail | null;
  sessionToken?: string | null;
  handleSeekFromChat: (startMs: number) => void;
}) {
  return (
    <aside className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
      {isLocked ? (
        <div className="p-5">
          <StatePanel icon="ri-lock-line" tone="amber" title="수강 신청 후 시청 패널이 열립니다." description="차시 목록, 스크립트, 챗봇은 수강 신청이 완료된 뒤 사용할 수 있습니다." />
          <button type="button" onClick={() => onEnroll(selectedCourse.id)} className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-indigo-500">수강 신청하기</button>
        </div>
      ) : (
        <>
          <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4"><div className="flex gap-2">{lectureWatchTabs.map((tab) => { const active = activePanelTab === tab.key; return <button key={tab.key} type="button" onClick={() => setActivePanelTab(tab.key)} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-sm' : 'border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]'}`}><i className={tab.icon} />{tab.label}</button>; })}</div></div>
          <div className="p-4">
            {activePanelTab === 'sessions' ? <div className="space-y-4"><div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4"><div className="text-[12px] font-semibold text-indigo-600">다음 차시 선택</div><div className="mt-1 text-[14px] font-bold text-[var(--app-text)]">현재 강의의 차시 목록을 바로 전환합니다.</div><p className="mt-2 text-[12px] leading-6 text-[var(--app-text-muted)]">원하는 주차를 눌러 선택하고, 이어서 영상 시청과 챗봇 질문으로 연결할 수 있습니다.</p></div><CourseSessionTimeline course={selectedCourse} selectedLectureId={selectedLectureId} onSelectLecture={onSelectLecture} onOpenLecture={(lectureId) => { onSelectLecture(lectureId); onNavigate('lecture-watch'); }} /></div> : null}
            {activePanelTab === 'script' ? <div className="space-y-4"><div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4"><div className="text-[12px] font-semibold text-indigo-600">스크립트</div><div className="mt-1 text-[16px] font-bold text-[var(--app-text)]">타임스탬프 기준으로 바로 찾아볼 수 있습니다.</div><p className="mt-2 text-[12px] leading-6 text-[var(--app-text-muted)]">필요한 구간의 시작 시간을 누르면 영상이 해당 위치로 이동하고 재생을 시도합니다.</p></div>{transcriptLoading ? <StatePanel compact icon="ri-loader-4-line" tone="slate" title="스크립트를 불러오는 중입니다." description="전사 데이터를 가져오고 있습니다." /> : transcriptAccessState === 'forbidden' ? <StatePanel compact icon="ri-lock-line" tone="amber" title="스크립트 접근 권한이 없습니다." description="이 차시는 수강 권한이 있어야 스크립트를 볼 수 있습니다. 먼저 수강 상태를 확인해 주세요." /> : transcriptAccessState === 'error' ? <StatePanel compact icon="ri-error-warning-line" tone="rose" title="스크립트를 불러오지 못했습니다." description="전사 데이터를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." /> : transcript?.segments?.length ? <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">{transcript.segments.map((segment) => <article key={segment.index} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => seekVideoTo(segment.start_ms)} className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-600">{formatWatchTimecode(segment.start_ms)} - {formatWatchTimecode(segment.end_ms)}</button><span className="text-[11px] font-semibold text-slate-400">#{segment.index + 1}</span></div><p className="mt-3 text-[13px] leading-7 text-[var(--app-text)]">{segment.text}</p></article>)}</div> : <StatePanel compact icon="ri-subtitle" tone="slate" title="스크립트가 아직 없습니다." description="이 차시는 아직 전사 데이터가 없거나, 전사 완료가 반영되기 전입니다. 다른 차시를 선택하면 타임스탬프 스크립트가 표시될 수 있습니다." />}</div> : null}
            {activePanelTab === 'chat' ? <LectureSideChatPanel highlightedLecture={highlightedLecture} sessionToken={sessionToken} onSeekTimestamp={handleSeekFromChat} /> : null}
          </div>
        </>
      )}
    </aside>
  );
}
