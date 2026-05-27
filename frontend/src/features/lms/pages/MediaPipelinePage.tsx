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
  approveSttExtractionDetailed,
  createAudioExtractionDetailed,
  loadAudioExtractions,
  loadLectureTranscriptDetailed,
  loadMediaPipeline,
  loadMediaProcessorHealth,
  loadMediaProviders,
  loadTranscriptSpeakerReview,
  saveTranscriptSpeakerReviewDetailed,
  uploadLectureVideoDetailed,
  type TranscriptSpeakerReview,
  type MediaUploadResult,
} from '../../../lib/api-media';
import {
  loadShortformExportStatus,
  retryFailedShortformExports,
  type ShortformExportStatusSummary,
} from '../../../lib/api-shortforms';
import { getAiErrorMessage, getQuotaStatusText, getPublicTestPolicyText } from '../../../lib/ai-access';
import { demoAudioExtraction, demoCourseDetail, demoLectureDetail, demoLecturePipeline, demoLectureTranscript, demoMediaProcessorHealth } from '../data/demo';

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
    demoMode
      ? {
          lecture_id: demoLectureDetail.id,
          asset_key: demoAudioExtraction.source_video_key ?? 'media/demo/ai-orchestration-intro.mp4',
          video_url: demoLectureDetail.video_url,
          file_name: 'ai-orchestration-intro.mp4',
          content_type: 'video/mp4',
          size_bytes: demoAudioExtraction.source_size_bytes ?? 0,
        }
      : null,
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
          lecture_id: demoLectureDetail.id,
          asset_key: demoAudioExtraction.source_video_key ?? 'media/demo/ai-orchestration-intro.mp4',
          video_url: demoLectureDetail.video_url,
          file_name: 'ai-orchestration-intro.mp4',
          content_type: 'video/mp4',
          size_bytes: demoAudioExtraction.source_size_bytes ?? 0,
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
        lecture_id: demoLectureDetail.id,
        asset_key: demoAudioExtraction.source_video_key ?? 'media/demo/ai-orchestration-intro.mp4',
        video_url: demoLectureDetail.video_url,
        file_name: 'ai-orchestration-intro.mp4',
        content_type: 'video/mp4',
        size_bytes: demoAudioExtraction.source_size_bytes ?? 0,
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

  const requiresManualApproval = useMemo(
    () =>
      !!latestExtraction &&
      String(latestExtraction.stt_sync_mode ?? '').toLowerCase() === 'approval' &&
      String(latestExtraction.stt_approval_state ?? '').toLowerCase() === 'pending',
    [latestExtraction],
  );
  const sttPolicySummary = useMemo(() => {
    if (!latestExtraction) {
      return null;
    }
    const mode = String(latestExtraction.stt_sync_mode ?? '-');
    const overwritePolicy = String(latestExtraction.stt_overwrite_policy ?? '-');
    const approvalState = String(latestExtraction.stt_approval_state ?? '-');
    const notificationChannel = latestExtraction.stt_sync_notification_channel ?? '-';
    const notifiedAt = latestExtraction.stt_sync_notified_at ?? '-';
    const callbackEvents = latestExtraction.stt_sync_metrics?.callback_events ?? 0;
    const notifications = latestExtraction.stt_sync_metrics?.notifications ?? 0;
    return {
      mode,
      overwritePolicy,
      approvalState,
      notificationChannel,
      notifiedAt,
      callbackEvents,
      notifications,
    };
  }, [latestExtraction]);

  async function submitExtraction(input: {
    lecture_id: string;
    video_url?: string;
    video_asset_key?: string;
    source_file_name?: string;
    source_content_type?: string;
    source_size_bytes?: number;
    audio_url?: string;
    language?: string;
  }): Promise<boolean> {
    const extractionResult = await createAudioExtractionDetailed(input, sessionToken);

    if (!extractionResult?.success || !extractionResult.data) {
      setBannerDescription(getAiErrorMessage(extractionResult, '오디오 추출 job 생성에 실패했습니다.'));
      setBannerMeta(getQuotaStatusText(extractionResult));
      setNotice(getAiErrorMessage(extractionResult, '오디오 추출 job 생성에 실패했습니다.'));
      return false;
    }

    const extraction = extractionResult.data;
    setBannerDescription('미디어 처리가 시작되었습니다. 공개 테스트에서는 3분 이하 입력과 로그인 상태만 허용됩니다.');
    setBannerMeta(getQuotaStatusText(extractionResult));
    await refreshMediaState(input.lecture_id);
    setNotice(
      extraction.transcript_id
        ? '업로드, 추출, 전사, 자동 요약까지 완료되었습니다.'
        : '업로드와 추출 job이 등록되었습니다. 외부 처리 서비스 callback 이후 전사가 자동으로 이어집니다.',
    );

    return true;
  }

  async function handleSubmit() {
    if (demoMode) {
      setNotice('데모 데이터 상태에서는 업로드를 실행하지 않습니다. 실제 강의를 선택하면 업로드와 추출이 연결됩니다.');
      return;
    }

    if (!lectureId) {
      setNotice('먼저 강의를 선택해 주세요.');
      return;
    }

    if (!videoFile) {
      setNotice('업로드할 영상 파일을 선택해 주세요.');
      return;
    }

    setBusy(true);
    setNotice('영상 업로드와 외부 오디오 추출 job을 생성하는 중입니다.');

    try {
      const uploadResult = await uploadLectureVideoDetailed(lectureId, videoFile, sessionToken);
      if (!uploadResult?.success || !uploadResult.data) {
        const fallbackMessage = uploadResult
          ? '영상 업로드에 실패했습니다. R2 binding, 권한, 또는 저장소 상태를 확인해 주세요.'
          : '백엔드에 연결할 수 없습니다. `npm run dev`로 backend와 media processor가 실행 중인지 확인해 주세요.';
        setBannerDescription(getAiErrorMessage(uploadResult, fallbackMessage));
        setBannerMeta(getQuotaStatusText(uploadResult));
        setNotice(getAiErrorMessage(uploadResult, fallbackMessage));
        return;
      }

      const upload = uploadResult.data;
      setUploadResult(upload);
      setBannerDescription('공개 테스트에서는 관리자 전용 업로드만 허용됩니다. 짧은 STT만 체험해 주세요.');
      setBannerMeta(getQuotaStatusText(uploadResult));
      await submitExtraction({
        lecture_id: lectureId,
        video_url: upload.video_url,
        video_asset_key: upload.asset_key,
        source_file_name: upload.file_name,
        source_content_type: upload.content_type,
        source_size_bytes: upload.size_bytes,
        audio_url: audioUrl.trim() || undefined,
        language: 'ko',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryExtraction() {
    if (demoMode) {
      setNotice('데모 데이터 상태에서는 재추출을 실행하지 않습니다.');
      return;
    }

    if (!lectureId || !retrySource.video_url) {
      setNotice('재시도를 위해 다시 업로드하거나 사용할 video URL이 필요합니다.');
      return;
    }

    setBusy(true);
    setNotice('직전 추출 입력값으로 다시 요청하는 중입니다.');

    try {
      const retryResult = await createAudioExtractionDetailed({
        lecture_id: lectureId,
        video_url: retrySource.video_url,
        video_asset_key: retrySource.video_asset_key,
        source_file_name: retrySource.source_file_name,
        source_content_type: retrySource.source_content_type,
        source_size_bytes: retrySource.source_size_bytes,
        audio_url: audioUrl.trim() || undefined,
        language: latestExtraction?.language ?? 'ko',
      }, sessionToken);

      if (!retryResult?.success || !retryResult.data) {
        setBannerDescription(getAiErrorMessage(retryResult, '재추출 요청에 실패했습니다.'));
        setBannerMeta(getQuotaStatusText(retryResult));
        setNotice(getAiErrorMessage(retryResult, '재추출 요청에 실패했습니다.'));
        return;
      }

      setBannerDescription('재추출 요청이 접수되었습니다. quota와 STT 길이 제한이 함께 적용됩니다.');
      setBannerMeta(getQuotaStatusText(retryResult));
      await refreshMediaState(lectureId);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSpeakerReview() {
    if (demoMode) {
      setNotice('데모 데이터 상태에서는 화자 검수를 저장하지 않습니다.');
      return;
    }
    if (!lectureId) {
      setNotice('강의를 먼저 선택해 주세요.');
      return;
    }
    if (!instructorName.trim()) {
      setNotice('강사명은 필수입니다.');
      return;
    }
    const confidence = Number(speakerConfidence);
    const response = await saveTranscriptSpeakerReviewDetailed(
      lectureId,
      {
        speaker_label: speakerLabel.trim() || 'SPEAKER_01',
        instructor_name: instructorName.trim(),
        confidence: Number.isFinite(confidence) ? confidence : undefined,
        note: speakerNote.trim() || undefined,
      },
      sessionToken,
    );
    if (!response?.success || !response.data) {
      setNotice(getAiErrorMessage(response, '화자 검수 저장에 실패했습니다.'));
      return;
    }
    setSpeakerReview(response.data);
    setNotice('화자/강사 검수가 저장되었습니다.');
  }

  async function handleRetryFailedShortforms() {
    if (viewerRole !== 'ADMIN' || demoMode) {
      return;
    }
    const status = await retryFailedShortformExports({ include_permanent: false, limit: 20 }, sessionToken);
    if (status) {
      setShortformExportStatus(status);
      setNotice('실패한 숏폼 export 재시도를 실행했습니다.');
    } else {
      setNotice('숏폼 export 재시도 실행에 실패했습니다.');
    }
  }

  async function handleApproveStt() {
    if (demoMode) {
      setNotice('데모 데이터 상태에서는 승인 실행을 하지 않습니다.');
      return;
    }
    if (!lectureId || !latestExtraction?.id) {
      setNotice('승인할 추출 항목을 먼저 선택해 주세요.');
      return;
    }
    setBusy(true);
    setNotice('승인된 STT를 실행하고 있습니다.');
    try {
      const approved = await approveSttExtractionDetailed(
        latestExtraction.id,
        { lecture_id: lectureId },
        sessionToken,
      );
      if (!approved?.success || !approved.data) {
        setNotice(getAiErrorMessage(approved, 'STT 승인 실행에 실패했습니다.'));
        return;
      }
      setNotice('승인된 STT 실행이 완료되었습니다.');
      await refreshMediaState(lectureId);
    } finally {
      setBusy(false);
    }
  }

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
          onSubmit={() => void handleSubmit()}
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
