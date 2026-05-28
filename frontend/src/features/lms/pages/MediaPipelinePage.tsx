import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AudioExtraction, CourseDetail, LectureDetail, LecturePipeline, LectureTranscript, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import { getSTTProviderCatalog } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { MediaPipelineSummaryPanel } from '../components/MediaPipelineSummaryPanel';
import { MediaUploadWorkspacePanel } from '../components/media-pipeline/MediaUploadWorkspacePanel';
import { MediaAdminOperationsPanel } from '../components/media-pipeline/MediaAdminOperationsPanel';
import { MediaPipelinePolicyPanels } from '../components/media-pipeline/MediaPipelinePolicyPanels';
import { MediaPipelineHeroSection } from '../components/media-pipeline/MediaPipelineHeroSection';
import { MediaPipelineMonitoringSection } from '../components/media-pipeline/MediaPipelineMonitoringSection';
import {
  loadAudioExtractions,
  loadLectureTranscriptDetailed,
  loadMediaPipeline,
  loadMediaProcessorHealth,
  loadMediaProviders,
  loadTranscriptSpeakerReview,
  type TranscriptSpeakerReview,
  type MediaUploadResult,
} from '../../../lib/api-media';
import {
  loadShortformExportStatus,
  type ShortformExportStatusSummary,
} from '../../../lib/api-shortforms';
import { getAiErrorMessage, getQuotaStatusText, getPublicTestPolicyText } from '../../../lib/ai-access';
import { demoAudioExtraction, demoCourseDetail, demoLectureDetail, demoLecturePipeline, demoLectureTranscript, demoMediaProcessorHealth } from '../data/demo';
import { buildDefaultDemoUploadResult, isManualApprovalRequired, toSttPolicySummary } from './mediaPipelinePageUtils';
import { useMediaPipelineActions } from './useMediaPipelineActions';

type MediaPipelinePageProps = {
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  sessionToken: string;
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
};

export function MediaPipelinePage({ selectedCourse, highlightedLecture, sessionToken, viewerRole }: MediaPipelinePageProps) {
  const demoMode = !selectedCourse;
  const displayCourse = selectedCourse ?? demoCourseDetail;
  const lectureOptions = selectedCourse?.lectures ?? demoCourseDetail.lectures;
  const defaultLectureId = highlightedLecture?.id ?? lectureOptions[0]?.id ?? demoLectureDetail.id;
  const [lectureId, setLectureId] = useState(defaultLectureId);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('영상 파일을 업로드하면 R2 업로드 후 외부 오디오 추출 서비스와 STT 파이프라인이 순서대로 연결됩니다.');
  const [bannerDescription, setBannerDescription] = useState(getPublicTestPolicyText('media'));
  const [bannerMeta, setBannerMeta] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<LecturePipeline | null>(null);
  const [transcript, setTranscript] = useState<LectureTranscript | null>(null);
  const [providers, setProviders] = useState<STTProviderCatalog | null>(demoMode ? getSTTProviderCatalog() : null);
  const [processorHealth, setProcessorHealth] = useState<MediaProcessorHealth | null>(demoMode ? demoMediaProcessorHealth : null);
  const [uploadResult, setUploadResult] = useState<MediaUploadResult | null>(
    demoMode ? buildDefaultDemoUploadResult(demoLectureDetail, demoAudioExtraction) : null,
  );
  const [extractions, setExtractions] = useState<AudioExtraction[]>(demoMode ? [demoAudioExtraction] : []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [speakerReview, setSpeakerReview] = useState<TranscriptSpeakerReview | null>(null);
  const [speakerLabel, setSpeakerLabel] = useState('SPEAKER_01');
  const [instructorName, setInstructorName] = useState('');
  const [speakerConfidence, setSpeakerConfidence] = useState('0.95');
  const [speakerNote, setSpeakerNote] = useState('');
  const [shortformExportStatus, setShortformExportStatus] = useState<ShortformExportStatusSummary | null>(null);

  useEffect(() => {
    setLectureId(defaultLectureId);
  }, [defaultLectureId]);

  useEffect(() => {
    setBannerDescription(getPublicTestPolicyText('media'));
    setBannerMeta(null);
  }, [lectureId, selectedCourse?.id]);

  const refreshMediaState = useCallback(
    async (targetLectureId: string, options?: { silent?: boolean }) => {
      if (demoMode) {
        setProviders(getSTTProviderCatalog());
        setPipeline(demoLecturePipeline);
        setExtractions([demoAudioExtraction]);
        setProcessorHealth(demoMediaProcessorHealth);
        setTranscript(demoLectureTranscript);
        setUploadResult({
          ...buildDefaultDemoUploadResult(demoLectureDetail, demoAudioExtraction),
        });
        return;
      }

      if (!targetLectureId) {
        setPipeline(null);
        setExtractions([]);
        setTranscript(null);
        return;
      }

      if (!options?.silent) {
        setIsRefreshing(true);
      }

      try {
        const [nextPipeline, nextExtractions, nextProcessorHealth, nextTranscript, nextSpeakerReview] = await Promise.all([
          loadMediaPipeline(targetLectureId, sessionToken),
          loadAudioExtractions(targetLectureId, sessionToken),
          loadMediaProcessorHealth(sessionToken),
          loadLectureTranscriptDetailed(targetLectureId, sessionToken),
          viewerRole === 'ADMIN' || viewerRole === 'INSTRUCTOR' ? loadTranscriptSpeakerReview(targetLectureId, sessionToken) : Promise.resolve(null),
        ]);
        setPipeline(nextPipeline);
        setExtractions(nextExtractions);
        setProcessorHealth(nextProcessorHealth);
        setTranscript(nextTranscript);
        setSpeakerReview(nextSpeakerReview);
        setSpeakerLabel(nextSpeakerReview?.speaker_label ?? 'SPEAKER_01');
        setInstructorName(nextSpeakerReview?.instructor_name ?? selectedCourse?.instructor_name ?? '');
        setSpeakerConfidence(String(nextSpeakerReview?.confidence ?? 0.95));
        setSpeakerNote(nextSpeakerReview?.note ?? '');
      } finally {
        if (!options?.silent) {
          setIsRefreshing(false);
        }
      }
    },
    [demoMode, selectedCourse?.instructor_name, sessionToken, viewerRole],
  );

  useEffect(() => {
    if (demoMode) {
      setProviders(getSTTProviderCatalog());
      setPipeline(demoLecturePipeline);
      setExtractions([demoAudioExtraction]);
      setProcessorHealth(demoMediaProcessorHealth);
      setTranscript(demoLectureTranscript);
      setSpeakerReview(null);
      setUploadResult({
        ...buildDefaultDemoUploadResult(demoLectureDetail, demoAudioExtraction),
      });
      setNotice('데모 데이터로 미디어 업로드, 전사, 타임라인, 파이프라인 상태를 미리 보여주고 있습니다.');
      return;
    }

    if (!lectureId) {
      setPipeline(null);
      setExtractions([]);
      setTranscript(null);
      return;
    }

    let active = true;
    Promise.all([
      loadMediaProviders(sessionToken),
      loadMediaPipeline(lectureId, sessionToken),
      loadAudioExtractions(lectureId, sessionToken),
      loadMediaProcessorHealth(sessionToken),
      loadLectureTranscriptDetailed(lectureId, sessionToken),
      viewerRole === 'ADMIN' || viewerRole === 'INSTRUCTOR' ? loadTranscriptSpeakerReview(lectureId, sessionToken) : Promise.resolve(null),
    ]).then(([nextProviders, nextPipeline, nextExtractions, nextProcessorHealth, nextTranscript, nextSpeakerReview]) => {
      if (!active) {
        return;
      }

      setProviders(nextProviders);
      setPipeline(nextPipeline);
      setExtractions(nextExtractions);
      setProcessorHealth(nextProcessorHealth);
      setTranscript(nextTranscript);
      setSpeakerReview(nextSpeakerReview);
      setSpeakerLabel(nextSpeakerReview?.speaker_label ?? 'SPEAKER_01');
      setInstructorName(nextSpeakerReview?.instructor_name ?? selectedCourse?.instructor_name ?? '');
      setSpeakerConfidence(String(nextSpeakerReview?.confidence ?? 0.95));
      setSpeakerNote(nextSpeakerReview?.note ?? '');
    });

    return () => {
      active = false;
    };
  }, [demoMode, lectureId, selectedCourse?.instructor_name, sessionToken, viewerRole]);

  const selectedLecture = useMemo(
    () => lectureOptions.find((lecture) => lecture.id === lectureId) ?? highlightedLecture ?? demoLectureDetail,
    [highlightedLecture, lectureId, lectureOptions],
  );

  const latestExtraction = useMemo(
    () =>
      [...extractions].sort((left, right) => {
        const leftKey = left.updated_at ?? left.created_at;
        const rightKey = right.updated_at ?? right.created_at;
        return rightKey.localeCompare(leftKey);
      })[0] ?? null,
    [extractions],
  );

  const retrySource = useMemo(
    () => ({
      video_url:
        uploadResult?.video_url ??
        latestExtraction?.source_url ??
        (highlightedLecture?.id === lectureId ? highlightedLecture.video_url : undefined),
      video_asset_key: uploadResult?.asset_key ?? latestExtraction?.source_video_key,
      source_file_name: uploadResult?.file_name ?? latestExtraction?.source_video_name,
      source_content_type: uploadResult?.content_type ?? latestExtraction?.source_content_type,
      source_size_bytes: uploadResult?.size_bytes ?? latestExtraction?.source_size_bytes,
    }),
    [highlightedLecture, latestExtraction, lectureId, uploadResult],
  );

  useEffect(() => {
    if (!lectureId) {
      return;
    }

    const needsPolling =
      latestExtraction?.status === 'PROCESSING' ||
      latestExtraction?.stt_status === 'PROCESSING' ||
      pipeline?.audio_status === 'PROCESSING' ||
      pipeline?.transcript_status === 'PROCESSING';

    if (!needsPolling) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshMediaState(lectureId, { silent: true });
    }, 4000);

    return () => window.clearInterval(timer);
  }, [latestExtraction?.status, latestExtraction?.stt_status, lectureId, pipeline?.audio_status, pipeline?.transcript_status, refreshMediaState]);

  useEffect(() => {
    if (viewerRole !== 'ADMIN' || demoMode) {
      setShortformExportStatus(null);
      return;
    }
    let active = true;
    loadShortformExportStatus(sessionToken).then((status) => {
      if (active) {
        setShortformExportStatus(status);
      }
    });
    return () => {
      active = false;
    };
  }, [demoMode, sessionToken, viewerRole]);

  const requiresManualApproval = useMemo(() => isManualApprovalRequired(latestExtraction), [latestExtraction]);
  const sttPolicySummary = useMemo(() => {
    return toSttPolicySummary(latestExtraction);
  }, [latestExtraction]);

  const {
    handleSubmit,
    handleRetryExtraction,
    handleApproveStt,
    handleSaveSpeakerReview,
    handleRetryFailedShortforms,
  } = useMediaPipelineActions({
    demoMode,
    lectureId,
    sessionToken,
    audioUrl,
    latestExtraction,
    retrySource,
    viewerRole,
    setBusy,
    setNotice,
    setBannerDescription,
    setBannerMeta,
    setUploadResult,
    refreshMediaState,
    setSpeakerReview,
    speakerLabel,
    instructorName,
    speakerConfidence,
    speakerNote,
    setShortformExportStatus,
  });

  return (
    <div className="space-y-5">
      <MediaPipelineHeroSection />

      <AiNoticeBanner title="공개 테스트 안내" description={bannerDescription} tone="amber" meta={bannerMeta} />

      <>
        <MediaPipelineSummaryPanel
          selectedLecture={selectedLecture}
          pipeline={pipeline}
          uploadResult={uploadResult}
          extraction={latestExtraction}
          notice={notice}
        />

        <MediaUploadWorkspacePanel
          displayCourse={displayCourse}
          lectureOptions={lectureOptions}
          selectedLecture={selectedLecture}
          lectureId={lectureId}
          audioUrl={audioUrl}
          videoFile={videoFile}
          busy={busy}
          demoMode={demoMode}
          notice={notice}
          uploadResult={uploadResult}
          latestExtraction={latestExtraction}
          pipeline={pipeline}
          retrySource={retrySource}
          onLectureChange={setLectureId}
          onAudioUrlChange={setAudioUrl}
          onVideoFileChange={setVideoFile}
          onSubmit={() => void handleSubmit(videoFile)}
        />

        <MediaPipelinePolicyPanels
          latestExtraction={latestExtraction}
          requiresManualApproval={requiresManualApproval}
          sttPolicySummary={sttPolicySummary}
          retrySource={retrySource}
          busy={busy}
          demoMode={demoMode}
          viewerRole={viewerRole}
          onApproveStt={() => void handleApproveStt()}
          onRetryExtraction={() => void handleRetryExtraction()}
        />

        <MediaPipelineMonitoringSection
          viewerRole={viewerRole}
          selectedLecture={selectedLecture}
          pipeline={pipeline}
          providers={providers}
          processorHealth={processorHealth}
          uploadResult={uploadResult}
          latestExtraction={latestExtraction}
          extractions={extractions}
          isRefreshing={isRefreshing}
          transcript={transcript}
          onRefresh={() => {
            void refreshMediaState(lectureId);
          }}
        />

        <MediaAdminOperationsPanel
          viewerRole={viewerRole}
          demoMode={demoMode}
          speakerReview={speakerReview}
          speakerLabel={speakerLabel}
          instructorName={instructorName}
          speakerConfidence={speakerConfidence}
          speakerNote={speakerNote}
          shortformExportStatus={shortformExportStatus}
          onSpeakerLabelChange={setSpeakerLabel}
          onInstructorNameChange={setInstructorName}
          onSpeakerConfidenceChange={setSpeakerConfidence}
          onSpeakerNoteChange={setSpeakerNote}
          onSaveSpeakerReview={() => void handleSaveSpeakerReview()}
          onRetryFailedShortforms={() => void handleRetryFailedShortforms()}
        />
      </>
    </div>
  );
}
