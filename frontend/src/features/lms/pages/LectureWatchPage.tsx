import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';
import { useLectureWatchPlayback } from './useLectureWatchPlayback';
import { LectureWatchHero, LectureWatchMain } from './LectureWatchPageSections';
import { LectureWatchAside } from './LectureWatchPageAside';
import type { LectureWatchPanelTab } from './lectureWatchPageUtils';

type LectureWatchPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onEnroll: (courseId: string) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function LectureWatchPage({
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onEnroll,
  onSelectLecture,
  onNavigate,
}: LectureWatchPageProps) {
  const playback = useLectureWatchPlayback({
    selectedCourse,
    highlightedLecture,
    selectedLectureId,
    canManageCurrent,
    sessionToken,
    onSelectLecture,
    onNavigate,
  });

  if (!selectedCourse) {
    return (
      <StatePanel
        icon="ri-play-circle-line"
        tone="indigo"
        title="시청할 강의를 먼저 선택하세요."
        description="내 강의에서 코스를 고르면 상세/진도율 화면을 지나 시청 페이지로 들어갈 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-5">
      <LectureWatchHero selectedCourse={selectedCourse} currentLecture={playback.currentLecture} canManageCurrent={canManageCurrent} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <LectureWatchMain
          selectedCourse={selectedCourse}
          currentLecture={playback.currentLecture}
          highlightedLecture={highlightedLecture}
          transcript={playback.transcript}
          transcriptAccessState={playback.transcriptAccessState}
          isLocked={playback.isLocked}
          canManageCurrent={canManageCurrent}
          onEnroll={onEnroll}
          onNavigate={onNavigate}
          protectedVideoUrl={playback.protectedVideoUrl}
          videoRef={playback.videoRef}
          videoErrorKind={playback.videoErrorKind}
          setVideoErrorKind={playback.setVideoErrorKind}
          videoErrorMessage={playback.videoErrorMessage}
          setVideoErrorMessage={playback.setVideoErrorMessage}
          videoChecking={playback.videoChecking}
          remapAssetKey={playback.remapAssetKey}
          setRemapAssetKey={playback.setRemapAssetKey}
          remapBusy={playback.remapBusy}
          remapMessage={playback.remapMessage}
          handleRemapAssetKey={playback.handleRemapAssetKey}
          upcomingLectures={playback.upcomingLectures}
        />

        <LectureWatchAside
          isLocked={playback.isLocked}
          selectedCourse={selectedCourse}
          onEnroll={onEnroll}
          activePanelTab={playback.activePanelTab as LectureWatchPanelTab}
          setActivePanelTab={(tab) => playback.setActivePanelTab(tab)}
          selectedLectureId={selectedLectureId}
          onSelectLecture={onSelectLecture}
          onNavigate={onNavigate}
          transcriptLoading={playback.transcriptLoading}
          transcript={playback.transcript}
          seekVideoTo={playback.seekVideoTo}
          highlightedLecture={highlightedLecture}
          sessionToken={sessionToken}
          handleSeekFromChat={playback.handleSeekFromChat}
        />
      </section>
    </div>
  );
}
