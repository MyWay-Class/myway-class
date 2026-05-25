import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AudioExtraction, CourseDetail, LectureDetail, LecturePipeline, LectureTranscript, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import { getSTTProviderCatalog } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { StatePanel } from '../components/StatePanel';
import { MediaPipelineStatusBoard } from '../components/MediaPipelineStatusBoard';
import { TranscriptTimelineWorkspace } from '../components/TranscriptTimelineWorkspace';
import { MediaPipelineSummaryPanel } from '../components/MediaPipelineSummaryPanel';
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

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

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
      <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)]">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
          Cloudflare R2 · Workers AI · media pipeline
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">실제 강의 업로드와 오디오 추출 파이프라인</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/75">
          강의 영상을 R2에 업로드하고, 오디오 추출 job과 STT 전사를 같은 화면에서 이어서 확인할 수 있습니다.
        </p>
      </section>

      <AiNoticeBanner title="공개 테스트 안내" description={bannerDescription} tone="amber" meta={bannerMeta} />

      <>
        <MediaPipelineSummaryPanel
          selectedLecture={selectedLecture}
          pipeline={pipeline}
          uploadResult={uploadResult}
          extraction={latestExtraction}
          notice={notice}
        />

        <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">대상 강의</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{selectedLecture?.title ?? displayCourse.title}</div>
                <div className="mt-1 text-sm text-slate-500">{displayCourse.title} · {displayCourse.instructor_name}</div>
              </div>
              <div className="rounded-2xl bg-[#f4faff] px-4 py-3 text-right">
                <div className="text-xs text-slate-400">업로드 가능한 파일</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">3분 ~ 1시간 내외 영상</div>
              </div>
            </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">강의 선택</span>
                <select
                  value={lectureId}
                  onChange={(event) => setLectureId(event.target.value)}
                  className="w-full rounded-2xl border border-[#cce0f2] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                >
                  {lectureOptions.map((lecture) => (
                    <option key={lecture.id} value={lecture.id}>
                      {lecture.title}
                    </option>
                  ))}
                </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">오디오 URL</span>
                <input
                  value={audioUrl}
                  onChange={(event) => setAudioUrl(event.target.value)}
                  placeholder="이미 추출된 audio_url이 있으면 바로 입력"
                  className="w-full rounded-2xl border border-[#cce0f2] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                />
                </label>
              </div>

              <div className="mt-4 space-y-2">
                <span className="text-sm font-semibold text-slate-700">영상 파일 업로드</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-2xl border border-dashed border-[#b9d7ef] bg-[#f4faff] px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {videoFile ? (
                  <div className="text-xs text-slate-500">
                    선택됨: {videoFile.name} · {formatBytes(videoFile.size)}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">mp4, webm, mov 등 영상 파일을 선택하세요.</div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy || demoMode}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#00b8e6_0%,#0077b6_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,119,182,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                  <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-upload-2-line'}`} />
                {busy ? '진행 중' : demoMode ? '데모 모드' : '업로드 및 추출 요청'}
              </button>
              <div className="text-sm text-slate-500">{notice}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
            <div className="text-sm font-semibold text-slate-900">현재 선택 정보</div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-[#f4faff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">강의</div>
                <div className="mt-1 font-semibold text-slate-900">{selectedLecture?.title ?? '선택된 강의 없음'}</div>
              </div>
              <div className="rounded-2xl bg-[#f4faff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">영상 업로드 결과</div>
                <div className="mt-1 break-all font-semibold text-slate-900">{uploadResult?.video_url ?? '아직 없음'}</div>
              </div>
              <div className="rounded-2xl bg-[#f4faff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">전사 결과</div>
                <div className="mt-1 font-semibold text-slate-900">{latestExtraction?.transcript_id ?? pipeline?.transcript_id ?? '아직 없음'}</div>
              </div>
              <div className="rounded-2xl bg-[#f4faff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 서비스 job</div>
                <div className="mt-1 font-semibold text-slate-900">{latestExtraction?.processing_job_id ?? '아직 없음'}</div>
                {latestExtraction?.processing_error ? (
                  <div className="mt-2 text-xs text-rose-600">{latestExtraction.processing_error}</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {latestExtraction?.status === 'FAILED' ? (
          <StatePanel
            compact
            icon="ri-error-warning-line"
            tone="rose"
            title="오디오 추출이 실패했습니다."
            description={latestExtraction.processing_error ?? '외부 처리 서비스 또는 callback 반영 과정에서 실패했습니다. 입력 경로를 확인한 뒤 다시 요청해 주세요.'}
          />
        ) : null}

        {requiresManualApproval ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">승인 대기 중인 STT</div>
                <div className="mt-1 text-sm text-slate-600">
                  현재 추출 건은 자동 시작이 보류되었습니다. 검토 후 승인 실행 버튼으로 전사를 시작할 수 있습니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleApproveStt()}
                disabled={busy || viewerRole === 'STUDENT'}
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-check-double-line'}`} />
                STT 승인 실행
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              extraction: {latestExtraction.id} · mode: {latestExtraction.stt_sync_mode ?? '-'} · approval: {latestExtraction.stt_approval_state ?? '-'}
            </div>
          </section>
        ) : null}

        {latestExtraction?.status === 'FAILED' ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">실패 후 다음 단계</div>
                <div className="mt-1 text-sm text-slate-600">
                  영상 업로드 결과나 기존 source video URL이 남아 있으면 같은 입력으로 다시 추출을 요청할 수 있습니다.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetryExtraction}
                disabled={busy || !retrySource.video_url || demoMode}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}`} />
                추출 다시 시도
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-100 bg-white/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">재시도 source video</div>
                <div className="mt-1 break-all text-sm text-slate-700">{retrySource.video_url ?? '없음'}</div>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-white/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">재시도 전 확인</div>
                <div className="mt-1 text-sm text-slate-700">
                  callback secret, media processor 연결 상태, 업로드 asset URL 접근 가능 여부를 먼저 확인하세요.
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {viewerRole === 'STUDENT' ? (
          <StatePanel
            compact
            icon="ri-lock-line"
            tone="slate"
            title="세부 상태는 관리자 전용입니다."
            description="일반 사용자는 업로드 결과와 전사 완료 여부만 볼 수 있습니다. 내부 FFmpeg, processor job, callback 상세는 운영자 화면에서 확인합니다."
          />
        ) : (
          <section className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
            <MediaPipelineStatusBoard
              selectedLecture={selectedLecture}
              pipeline={pipeline}
              providers={providers}
              processorHealth={processorHealth}
              uploadResult={uploadResult}
              extraction={latestExtraction}
              recentExtractions={extractions}
              isRefreshing={isRefreshing}
              onRefresh={() => {
                void refreshMediaState(lectureId);
              }}
            />

            <TranscriptTimelineWorkspace selectedLecture={selectedLecture} transcript={transcript} />
          </section>
        )}

        {(viewerRole === 'ADMIN' || viewerRole === 'INSTRUCTOR') && !demoMode ? (
          <section className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">화자/강사 검수</div>
                <div className="mt-1 text-xs text-slate-500">
                  STT 화자 라벨을 실제 강사명으로 매핑해 RAG/요약 품질을 안정화합니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveSpeakerReview()}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                <i className="ri-save-line" />
                검수 저장
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-600">화자 라벨</span>
                <input value={speakerLabel} onChange={(event) => setSpeakerLabel(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-600">강사명</span>
                <input value={instructorName} onChange={(event) => setInstructorName(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-600">신뢰도 (0~1)</span>
                <input value={speakerConfidence} onChange={(event) => setSpeakerConfidence(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-600">메모</span>
                <input value={speakerNote} onChange={(event) => setSpeakerNote(event.target.value)} className="w-full rounded-xl border border-[#cce0f2] px-3 py-2 text-sm" />
              </label>
            </div>
            {speakerReview ? (
              <div className="mt-3 text-xs text-slate-500">
                마지막 검수: {speakerReview.reviewed_at ?? '-'} · {speakerReview.reviewed_by ?? '-'}
              </div>
            ) : null}
          </section>
        ) : null}

        {viewerRole === 'ADMIN' && !demoMode ? (
          <section className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">숏폼 Export 운영 현황</div>
                <div className="mt-1 text-xs text-slate-500">실패 건만 일괄 재시도하고 최신 상태를 확인합니다.</div>
              </div>
              <button
                type="button"
                onClick={() => void handleRetryFailedShortforms()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <i className="ri-refresh-line" />
                실패 건 재시도
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">PENDING</div><div className="mt-1 text-base font-bold text-slate-900">{shortformExportStatus?.pending_count ?? '-'}</div></div>
              <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">PROCESSING</div><div className="mt-1 text-base font-bold text-slate-900">{shortformExportStatus?.processing_count ?? '-'}</div></div>
              <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">COMPLETED</div><div className="mt-1 text-base font-bold text-emerald-700">{shortformExportStatus?.completed_count ?? '-'}</div></div>
              <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">FAILED</div><div className="mt-1 text-base font-bold text-rose-700">{shortformExportStatus?.failed_count ?? '-'}</div></div>
              <div className="rounded-xl border border-slate-200 p-3 text-xs"><div className="text-slate-400">FAILED_PERMANENT</div><div className="mt-1 text-base font-bold text-rose-900">{shortformExportStatus?.failed_permanent_count ?? '-'}</div></div>
            </div>
            <div className="mt-3 text-xs text-slate-500">마지막 갱신: {shortformExportStatus?.last_updated_at ?? '-'}</div>
            <div className="mt-3 max-h-52 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3">
              {(shortformExportStatus?.failed_items ?? []).length === 0 ? (
                <div className="text-xs text-slate-500">실패 항목이 없습니다.</div>
              ) : (
                (shortformExportStatus?.failed_items ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                    <div className="font-semibold text-slate-900">{item.title || item.id}</div>
                    <div className="mt-1 text-slate-500">{item.export_status} · retry {item.retry_count} · {item.updated_at ?? '-'}</div>
                    {item.error_message ? <div className="mt-1 text-rose-700">{item.error_message}</div> : null}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}
      </>
    </div>
  );
}
