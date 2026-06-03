import type { AudioExtraction } from '@myway/shared';
import { createMediaPipelineReviewActions } from './mediaPipelineReviewActions';
import { createMediaPipelineUploadActions } from './mediaPipelineUploadActions';
import type { ShortformExportStatusSummary } from '../../../lib/api-shortforms';
import type { MediaUploadResult } from '../../../lib/api-media';

type RetrySource = {
  video_url?: string;
  video_asset_key?: string;
  source_file_name?: string;
  source_content_type?: string;
  source_size_bytes?: number;
};

type MediaPipelineActionInput = {
  demoMode: boolean;
  lectureId: string;
  sessionToken: string;
  audioUrl: string;
  latestExtraction: AudioExtraction | null;
  retrySource: RetrySource;
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  setBusy: (busy: boolean) => void;
  setNotice: (message: string) => void;
  setBannerDescription: (message: string) => void;
  setBannerMeta: (meta: string | null) => void;
  setUploadResult: (result: MediaUploadResult | null) => void;
  refreshMediaState: (lectureId: string, options?: { silent?: boolean }) => Promise<void>;
  setSpeakerReview: (review: any) => void;
  speakerLabel: string;
  instructorName: string;
  speakerConfidence: string;
  speakerNote: string;
  setShortformExportStatus: (status: ShortformExportStatusSummary | null) => void;
};

export function createMediaPipelineActions(input: MediaPipelineActionInput) {
  const uploadActions = createMediaPipelineUploadActions({
    demoMode: input.demoMode,
    lectureId: input.lectureId,
    sessionToken: input.sessionToken,
    audioUrl: input.audioUrl,
    latestExtraction: input.latestExtraction,
    retrySource: input.retrySource,
    setBusy: input.setBusy,
    setNotice: input.setNotice,
    setBannerDescription: input.setBannerDescription,
    setBannerMeta: input.setBannerMeta,
    setUploadResult: input.setUploadResult,
    refreshMediaState: input.refreshMediaState,
  });

  const reviewActions = createMediaPipelineReviewActions({
    demoMode: input.demoMode,
    lectureId: input.lectureId,
    sessionToken: input.sessionToken,
    latestExtraction: input.latestExtraction,
    viewerRole: input.viewerRole,
    setBusy: input.setBusy,
    setNotice: input.setNotice,
    refreshMediaState: input.refreshMediaState,
    setSpeakerReview: input.setSpeakerReview,
    speakerLabel: input.speakerLabel,
    instructorName: input.instructorName,
    speakerConfidence: input.speakerConfidence,
    speakerNote: input.speakerNote,
    setShortformExportStatus: input.setShortformExportStatus,
  });

  return { ...uploadActions, ...reviewActions };
}
