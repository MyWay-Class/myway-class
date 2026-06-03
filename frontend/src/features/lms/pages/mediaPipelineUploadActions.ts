import type { AudioExtraction } from '@myway/shared';
import { createAudioExtractionDetailed, uploadLectureVideoDetailed } from '../../../lib/api-media';
import { getAiErrorMessage, getQuotaStatusText } from '../../../lib/ai-access';
import type { MediaUploadResult } from '../../../lib/api-media';

type RetrySource = {
  video_url?: string;
  video_asset_key?: string;
  source_file_name?: string;
  source_content_type?: string;
  source_size_bytes?: number;
};

type UploadActionsInput = {
  demoMode: boolean;
  lectureId: string;
  sessionToken: string;
  audioUrl: string;
  latestExtraction: AudioExtraction | null;
  retrySource: RetrySource;
  setBusy: (busy: boolean) => void;
  setNotice: (message: string) => void;
  setBannerDescription: (message: string) => void;
  setBannerMeta: (meta: string | null) => void;
  setUploadResult: (result: MediaUploadResult | null) => void;
  refreshMediaState: (lectureId: string, options?: { silent?: boolean }) => Promise<void>;
};

export function createMediaPipelineUploadActions(input: UploadActionsInput) {
  async function submitExtraction(payload: {
    lecture_id: string;
    video_url?: string;
    video_asset_key?: string;
    source_file_name?: string;
    source_content_type?: string;
    source_size_bytes?: number;
    audio_url?: string;
    language?: string;
  }): Promise<boolean> {
    const extractionResult = await createAudioExtractionDetailed(payload, input.sessionToken);
    if (!extractionResult?.success || !extractionResult.data) {
      const message = getAiErrorMessage(extractionResult, '오디오 추출 job 생성에 실패했습니다.');
      input.setBannerDescription(message);
      input.setBannerMeta(getQuotaStatusText(extractionResult));
      input.setNotice(message);
      return false;
    }

    const extraction = extractionResult.data;
    input.setBannerDescription('미디어 처리가 시작되었습니다. 공개 테스트에서는 3분 이하 입력과 로그인 상태만 허용됩니다.');
    input.setBannerMeta(getQuotaStatusText(extractionResult));
    await input.refreshMediaState(payload.lecture_id);
    input.setNotice(extraction.transcript_id ? '업로드, 추출, 전사, 자동 요약까지 완료되었습니다.' : '업로드와 추출 job이 등록되었습니다. 외부 처리 서비스 callback 이후 전사가 자동으로 이어집니다.');
    return true;
  }

  async function handleSubmit(videoFile: File | null) {
    if (input.demoMode) {
      input.setNotice('데모 데이터 상태에서는 업로드를 실행하지 않습니다. 실제 강의를 선택하면 업로드와 추출이 연결됩니다.');
      return;
    }
    if (!input.lectureId) {
      input.setNotice('먼저 강의를 선택해 주세요.');
      return;
    }
    if (!videoFile) {
      input.setNotice('업로드할 영상 파일을 선택해 주세요.');
      return;
    }

    input.setBusy(true);
    input.setNotice('영상 업로드와 외부 오디오 추출 job을 생성하는 중입니다.');
    try {
      const uploadResult = await uploadLectureVideoDetailed(input.lectureId, videoFile, input.sessionToken);
      if (!uploadResult?.success || !uploadResult.data) {
        const fallbackMessage = uploadResult
          ? '영상 업로드에 실패했습니다. R2 binding, 권한, 또는 저장소 상태를 확인해 주세요.'
          : '백엔드에 연결할 수 없습니다. `npm run dev`로 backend와 media processor가 실행 중인지 확인해 주세요.';
        const message = getAiErrorMessage(uploadResult, fallbackMessage);
        input.setBannerDescription(message);
        input.setBannerMeta(getQuotaStatusText(uploadResult));
        input.setNotice(message);
        return;
      }

      const upload = uploadResult.data;
      input.setUploadResult(upload);
      input.setBannerDescription('공개 테스트에서는 관리자 전용 업로드만 허용됩니다. 짧은 STT만 체험해 주세요.');
      input.setBannerMeta(getQuotaStatusText(uploadResult));
      await submitExtraction({
        lecture_id: input.lectureId,
        video_url: upload.video_url,
        video_asset_key: upload.asset_key,
        source_file_name: upload.file_name,
        source_content_type: upload.content_type,
        source_size_bytes: upload.size_bytes,
        audio_url: input.audioUrl.trim() || undefined,
        language: 'ko',
      });
    } finally {
      input.setBusy(false);
    }
  }

  async function handleRetryExtraction() {
    if (input.demoMode) {
      input.setNotice('데모 데이터 상태에서는 재추출을 실행하지 않습니다.');
      return;
    }
    if (!input.lectureId || !input.retrySource.video_url) {
      input.setNotice('재시도를 위해 다시 업로드하거나 사용할 video URL이 필요합니다.');
      return;
    }

    input.setBusy(true);
    input.setNotice('직전 추출 입력값으로 다시 요청하는 중입니다.');
    try {
      const retryResult = await createAudioExtractionDetailed(
        {
          lecture_id: input.lectureId,
          video_url: input.retrySource.video_url,
          video_asset_key: input.retrySource.video_asset_key,
          source_file_name: input.retrySource.source_file_name,
          source_content_type: input.retrySource.source_content_type,
          source_size_bytes: input.retrySource.source_size_bytes,
          audio_url: input.audioUrl.trim() || undefined,
          language: input.latestExtraction?.language ?? 'ko',
        },
        input.sessionToken,
      );

      if (!retryResult?.success || !retryResult.data) {
        const message = getAiErrorMessage(retryResult, '재추출 요청에 실패했습니다.');
        input.setBannerDescription(message);
        input.setBannerMeta(getQuotaStatusText(retryResult));
        input.setNotice(message);
        return;
      }

      input.setBannerDescription('재추출 요청이 접수되었습니다. quota와 STT 길이 제한이 함께 적용됩니다.');
      input.setBannerMeta(getQuotaStatusText(retryResult));
      await input.refreshMediaState(input.lectureId);
    } finally {
      input.setBusy(false);
    }
  }

  return { handleSubmit, handleRetryExtraction };
}
