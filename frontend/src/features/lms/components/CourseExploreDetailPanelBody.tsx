import type { CourseDetail, LectureDetail } from '@myway/shared';
import type { ReactNode } from 'react';
import { CourseSessionTimeline } from './CourseSessionTimeline';
import { StatePanel } from './StatePanel';
import { CourseExploreLectureCard } from './CourseExploreLectureCard';

type CourseExploreDetailPanelBodyProps = {
  course: CourseDetail | null;
  selectedLectureId: string;
  viewMode: 'detail' | 'watch';
  activeTab: '강의' | '공지' | '자료';
  detailLecture: LectureDetail | null;
  isLocked: boolean;
  canManageCurrent: boolean;
  resolvedLectureVideoUrl?: string;
  sessionToken?: string | null;
  remapAssetKey: string;
  setRemapAssetKey: (value: string) => void;
  remapBusy: boolean;
  remapMessage: string;
  handleRemapAssetKey: () => void;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
  onTabChange: (tab: '강의' | '공지' | '자료') => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
  renderNoticeList: (course: CourseDetail) => ReactNode;
  renderMaterialList: (course: CourseDetail, canManageCurrent: boolean, onOpenMaterial: (fileName: string) => void, onNavigateStudio: () => void) => ReactNode;
};

const courseTabs: { key: '강의' | '공지' | '자료'; label: string; icon: string }[] = [
  { key: '강의', label: '강의', icon: 'ri-play-circle-line' },
  { key: '공지', label: '공지', icon: 'ri-megaphone-line' },
  { key: '자료', label: '자료', icon: 'ri-folder-line' },
];

export function CourseExploreDetailPanelBody({
  course,
  selectedLectureId,
  viewMode,
  activeTab,
  detailLecture,
  isLocked,
  canManageCurrent,
  resolvedLectureVideoUrl,
  sessionToken,
  remapAssetKey,
  setRemapAssetKey,
  remapBusy,
  remapMessage,
  handleRemapAssetKey,
  onSelectLecture,
  onEnroll,
  onTabChange,
  onNavigate,
  renderNoticeList,
  renderMaterialList,
}: CourseExploreDetailPanelBodyProps) {
  const handleOpenMaterial = (fileName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(fileName);
    }
  };

  return (
    <div className="px-5 py-5">
      {course ? (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--app-border)] pb-0.5">
            {courseTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                    active ? 'border-cyan-500 text-[var(--app-text)]' : 'border-transparent text-[var(--app-text-muted)] hover:border-slate-300 hover:text-[var(--app-text-secondary)]'
                  }`}
                >
                  <i className={`${tab.icon} text-[15px]`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pt-5">
            {activeTab === '강의' ? (
              <div className="space-y-5">
                <CourseSessionTimeline
                  course={course}
                  selectedLectureId={selectedLectureId}
                  onSelectLecture={onSelectLecture}
                  onOpenLecture={(lectureId) => {
                    onSelectLecture(lectureId);
                    onNavigate('lecture-watch');
                  }}
                />
                <CourseExploreLectureCard
                  course={course}
                  detailLecture={detailLecture}
                  viewMode={viewMode}
                  isLocked={isLocked}
                  canManageCurrent={canManageCurrent}
                  resolvedLectureVideoUrl={resolvedLectureVideoUrl}
                  sessionToken={sessionToken}
                  remapAssetKey={remapAssetKey}
                  setRemapAssetKey={setRemapAssetKey}
                  remapBusy={remapBusy}
                  remapMessage={remapMessage}
                  handleRemapAssetKey={handleRemapAssetKey}
                  onEnroll={onEnroll}
                  onNavigate={onNavigate}
                  onSelectLecture={onSelectLecture}
                />
              </div>
            ) : activeTab === '공지' ? (
              renderNoticeList(course)
            ) : activeTab === '자료' ? (
              renderMaterialList(course, canManageCurrent, handleOpenMaterial, () => onNavigate('lecture-studio'))
            ) : (
              <div className="space-y-3">
                {isLocked ? (
                  <StatePanel compact icon="ri-lock-line" tone="amber" title="수강 신청 후 Q&A를 사용할 수 있습니다." description="질문 검색과 강의 내용 탐색은 수강 신청한 뒤 활성화됩니다." />
                ) : (
                  <StatePanel compact icon="ri-question-line" tone="slate" title="Q&A는 강의 내용 검색으로 연결됩니다." description="질문은 우측 챗봇에서 먼저 바로 물어보고, 필요한 경우 강의 시청 화면으로 이어서 확인할 수 있습니다." />
                )}
                <div className="flex flex-wrap gap-2">
                  {isLocked ? (
                    <button type="button" onClick={() => course && onEnroll(course.id)} className="rounded-xl bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500">
                      수강 신청하기
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => onNavigate('ai-chat')} className="rounded-xl bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500">
                        AI 챗봇으로 질문하기
                      </button>
                      <button type="button" onClick={() => onNavigate('lecture-watch')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700">
                        강의 시청으로 이동
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <StatePanel compact icon="ri-play-circle-line" tone="amber" title="강의를 선택하면 상세가 펼쳐집니다." description="선택한 코스의 주차/차시 타임라인, 공지, 자료가 이 영역에 표시됩니다." />
      )}
    </div>
  );
}
