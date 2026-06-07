import type { CourseDetail, LectureDetail } from '@myway/shared';
import { resolveLectureVideoUrl } from '../../../lib/video-url';
import { useLectureAssetRemap } from './useLectureAssetRemap';
import { renderMaterialList, renderNoticeList } from './CourseExploreDetailPanelSections';
import { CourseExploreDetailHeader } from './CourseExploreDetailPanelHeader';
import { CourseExploreDetailPanelBody } from './CourseExploreDetailPanelBody';

type CourseExploreDetailPanelProps = {
  course: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  viewMode: 'detail' | 'watch';
  activeTab: '강의' | '공지' | '자료';
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
  onTabChange: (tab: '강의' | '공지' | '자료') => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function CourseExploreDetailPanel({
  course,
  highlightedLecture,
  selectedLectureId,
  viewMode,
  activeTab,
  canManageCurrent,
  sessionToken,
  onSelectLecture,
  onEnroll,
  onTabChange,
  onNavigate,
}: CourseExploreDetailPanelProps) {
  const { remapAssetKey, setRemapAssetKey, remapBusy, remapMessage, handleRemapAssetKey } = useLectureAssetRemap(sessionToken);
  const detailLecture = highlightedLecture;
  const isLocked = Boolean(course && !course.enrolled && !canManageCurrent);
  const resolvedLectureVideoUrl = detailLecture ? resolveLectureVideoUrl(detailLecture) : undefined;

  return (
    <section className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
      <CourseExploreDetailHeader course={course} />

      <CourseExploreDetailPanelBody
        course={course}
        selectedLectureId={selectedLectureId}
        viewMode={viewMode}
        activeTab={activeTab}
        detailLecture={detailLecture}
        isLocked={isLocked}
        canManageCurrent={canManageCurrent}
        resolvedLectureVideoUrl={resolvedLectureVideoUrl}
        sessionToken={sessionToken}
        remapAssetKey={remapAssetKey}
        setRemapAssetKey={setRemapAssetKey}
        remapBusy={remapBusy}
        remapMessage={remapMessage}
        handleRemapAssetKey={handleRemapAssetKey}
        onSelectLecture={onSelectLecture}
        onEnroll={onEnroll}
        onTabChange={onTabChange}
        onNavigate={onNavigate}
        renderNoticeList={renderNoticeList}
        renderMaterialList={renderMaterialList}
      />
    </section>
  );
}
