import type { AudioExtraction } from '@myway/shared';
import { approveSttExtractionDetailed, saveTranscriptSpeakerReviewDetailed } from '../../../lib/api-media';
import { retryFailedShortformExports, type ShortformExportStatusSummary } from '../../../lib/api-shortforms';
import { getAiErrorMessage } from '../../../lib/ai-access';

type ReviewActionsInput = {
  demoMode: boolean;
  lectureId: string;
  sessionToken: string;
  latestExtraction: AudioExtraction | null;
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  setBusy: (busy: boolean) => void;
  setNotice: (message: string) => void;
  refreshMediaState: (lectureId: string, options?: { silent?: boolean }) => Promise<void>;
  setSpeakerReview: (review: any) => void;
  speakerLabel: string;
  instructorName: string;
  speakerConfidence: string;
  speakerNote: string;
  setShortformExportStatus: (status: ShortformExportStatusSummary | null) => void;
};

export function createMediaPipelineReviewActions(input: ReviewActionsInput) {
  async function handleApproveStt() {
    if (input.demoMode) {
      input.setNotice('데모 데이터 상태에서는 승인 실행을 하지 않습니다.');
      return;
    }
    if (!input.lectureId || !input.latestExtraction?.id) {
      input.setNotice('승인할 추출 항목을 먼저 선택해 주세요.');
      return;
    }

    input.setBusy(true);
    input.setNotice('승인된 STT를 실행하고 있습니다.');
    try {
      const approved = await approveSttExtractionDetailed(input.latestExtraction.id, { lecture_id: input.lectureId }, input.sessionToken);
      if (!approved?.success || !approved.data) {
        input.setNotice(getAiErrorMessage(approved, 'STT 승인 실행에 실패했습니다.'));
        return;
      }
      input.setNotice('승인된 STT 실행이 완료되었습니다.');
      await input.refreshMediaState(input.lectureId);
    } finally {
      input.setBusy(false);
    }
  }

  async function handleSaveSpeakerReview() {
    if (input.demoMode) {
      input.setNotice('데모 데이터 상태에서는 화자 검수를 저장하지 않습니다.');
      return;
    }
    if (!input.lectureId) {
      input.setNotice('강의를 먼저 선택해 주세요.');
      return;
    }
    if (!input.instructorName.trim()) {
      input.setNotice('강사명은 필수입니다.');
      return;
    }

    const confidence = Number(input.speakerConfidence);
    const response = await saveTranscriptSpeakerReviewDetailed(
      input.lectureId,
      {
        speaker_label: input.speakerLabel.trim() || 'SPEAKER_01',
        instructor_name: input.instructorName.trim(),
        confidence: Number.isFinite(confidence) ? confidence : undefined,
        note: input.speakerNote.trim() || undefined,
      },
      input.sessionToken,
    );
    if (!response?.success || !response.data) {
      input.setNotice(getAiErrorMessage(response, '화자 검수 저장에 실패했습니다.'));
      return;
    }
    input.setSpeakerReview(response.data);
    input.setNotice('화자/강사 검수가 저장되었습니다.');
  }

  async function handleRetryFailedShortforms() {
    if (input.viewerRole !== 'ADMIN' || input.demoMode) return;
    const status = await retryFailedShortformExports({ include_permanent: false, limit: 20 }, input.sessionToken);
    if (status) {
      input.setShortformExportStatus(status);
      input.setNotice('실패한 숏폼 export 재시도를 실행했습니다.');
    } else {
      input.setNotice('숏폼 export 재시도 실행에 실패했습니다.');
    }
  }

  return { handleApproveStt, handleSaveSpeakerReview, handleRetryFailedShortforms };
}
