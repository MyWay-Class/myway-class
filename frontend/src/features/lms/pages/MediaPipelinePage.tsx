import type { CourseDetail, LectureDetail } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { MediaPipelineSummaryPanel } from '../components/MediaPipelineSummaryPanel';
import { MediaAdminOperationsPanel } from '../components/media-pipeline/MediaAdminOperationsPanel';
import { MediaPipelineHeroSection } from '../components/media-pipeline/MediaPipelineHeroSection';
import { MediaPipelineMonitoringSection } from '../components/media-pipeline/MediaPipelineMonitoringSection';
import { MediaPipelinePolicyPanels } from '../components/media-pipeline/MediaPipelinePolicyPanels';
import { MediaUploadWorkspacePanel } from '../components/media-pipeline/MediaUploadWorkspacePanel';
import { useMediaPipelineActions } from './useMediaPipelineActions';
import { useMediaPipelinePageState } from './useMediaPipelinePageState';

type MediaPipelinePageProps = {
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  sessionToken: string;
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
};

export function MediaPipelinePage({ selectedCourse, highlightedLecture, sessionToken, viewerRole }: MediaPipelinePageProps) {
  const s = useMediaPipelinePageState({ selectedCourse, highlightedLecture, sessionToken, viewerRole });
  const { handleSubmit, handleRetryExtraction, handleApproveStt, handleSaveSpeakerReview, handleRetryFailedShortforms } = useMediaPipelineActions({
    demoMode: s.demoMode,
    lectureId: s.lectureId,
    sessionToken,
    audioUrl: s.audioUrl,
    latestExtraction: s.latestExtraction,
    retrySource: s.retrySource,
    viewerRole,
    setBusy: s.setBusy,
    setNotice: s.setNotice,
    setBannerDescription: s.setBannerDescription,
    setBannerMeta: s.setBannerMeta,
    setUploadResult: s.setUploadResult,
    refreshMediaState: s.refreshMediaState,
    setSpeakerReview: s.setSpeakerReview,
    speakerLabel: s.speakerLabel,
    instructorName: s.instructorName,
    speakerConfidence: s.speakerConfidence,
    speakerNote: s.speakerNote,
    setShortformExportStatus: s.setShortformExportStatus,
  });

  return (
    <div className="space-y-5">
      <MediaPipelineHeroSection />
      <AiNoticeBanner title="공개 테스트 안내" description={s.bannerDescription} tone="amber" meta={s.bannerMeta} />
      <MediaPipelineSummaryPanel selectedLecture={s.selectedLecture} pipeline={s.pipeline} uploadResult={s.uploadResult} extraction={s.latestExtraction} notice={s.notice} />
      <MediaUploadWorkspacePanel
        displayCourse={s.displayCourse}
        lectureOptions={s.lectureOptions}
        selectedLecture={s.selectedLecture}
        lectureId={s.lectureId}
        audioUrl={s.audioUrl}
        videoFile={s.videoFile}
        busy={s.busy}
        demoMode={s.demoMode}
        notice={s.notice}
        uploadResult={s.uploadResult}
        latestExtraction={s.latestExtraction}
        pipeline={s.pipeline}
        retrySource={s.retrySource}
        onLectureChange={s.setLectureId}
        onAudioUrlChange={s.setAudioUrl}
        onVideoFileChange={s.setVideoFile}
        onSubmit={() => void handleSubmit(s.videoFile)}
      />
      <MediaPipelinePolicyPanels
        latestExtraction={s.latestExtraction}
        requiresManualApproval={s.requiresManualApproval}
        sttPolicySummary={s.sttPolicySummary}
        retrySource={s.retrySource}
        busy={s.busy}
        demoMode={s.demoMode}
        viewerRole={viewerRole}
        onApproveStt={() => void handleApproveStt()}
        onRetryExtraction={() => void handleRetryExtraction()}
      />
      <MediaPipelineMonitoringSection
        viewerRole={viewerRole}
        selectedLecture={s.selectedLecture}
        pipeline={s.pipeline}
        providers={s.providers}
        processorHealth={s.processorHealth}
        uploadResult={s.uploadResult}
        latestExtraction={s.latestExtraction}
        extractions={s.extractions}
        isRefreshing={s.isRefreshing}
        transcript={s.transcript}
        onRefresh={() => { void s.refreshMediaState(s.lectureId); }}
      />
      <MediaAdminOperationsPanel
        viewerRole={viewerRole}
        demoMode={s.demoMode}
        speakerReview={s.speakerReview}
        speakerLabel={s.speakerLabel}
        instructorName={s.instructorName}
        speakerConfidence={s.speakerConfidence}
        speakerNote={s.speakerNote}
        shortformExportStatus={s.shortformExportStatus}
        onSpeakerLabelChange={s.setSpeakerLabel}
        onInstructorNameChange={s.setInstructorName}
        onSpeakerConfidenceChange={s.setSpeakerConfidence}
        onSpeakerNoteChange={s.setSpeakerNote}
        onSaveSpeakerReview={() => void handleSaveSpeakerReview()}
        onRetryFailedShortforms={() => void handleRetryFailedShortforms()}
      />
    </div>
  );
}
