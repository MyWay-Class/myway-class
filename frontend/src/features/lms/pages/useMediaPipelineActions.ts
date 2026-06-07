import type { AudioExtraction } from '@myway/shared';
import { createMediaPipelineActions } from './mediaPipelineActions';
import type { ShortformExportStatusSummary } from '../../../lib/api-shortforms';

type RetrySource = {
  video_url?: string;
  video_asset_key?: string;
  source_file_name?: string;
  source_content_type?: string;
  source_size_bytes?: number;
};

type UseMediaPipelineActionsInput = {
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
  setUploadResult: (result: { lecture_id: string; asset_key: string; video_url: string; file_name: string; content_type: string; size_bytes: number } | null) => void;
  refreshMediaState: (lectureId: string, options?: { silent?: boolean }) => Promise<void>;
  setSpeakerReview: (review: any) => void;
  speakerLabel: string;
  instructorName: string;
  speakerConfidence: string;
  speakerNote: string;
  setShortformExportStatus: (status: ShortformExportStatusSummary | null) => void;
};

export function useMediaPipelineActions(input: UseMediaPipelineActionsInput) {
  return createMediaPipelineActions(input);
}
