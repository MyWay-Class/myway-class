import { useMemo } from 'react';
import type { AudioExtraction, CourseDetail, LectureDetail } from '@myway/shared';
import type { MediaUploadResult } from '../../../lib/api-media';
import { demoLectureDetail } from '../data/demo';
import { isManualApprovalRequired, toSttPolicySummary } from './mediaPipelinePageUtils';

type Params = {
  lectureOptions: LectureDetail[];
  lectureId: string;
  highlightedLecture: LectureDetail | null;
  extractions: AudioExtraction[];
  uploadResult: MediaUploadResult | null;
};

export function useMediaPipelineDerived({
  lectureOptions,
  lectureId,
  highlightedLecture,
  extractions,
  uploadResult,
}: Params) {
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

  const requiresManualApproval = useMemo(() => isManualApprovalRequired(latestExtraction), [latestExtraction]);
  const sttPolicySummary = useMemo(() => toSttPolicySummary(latestExtraction), [latestExtraction]);

  return {
    selectedLecture,
    latestExtraction,
    retrySource,
    requiresManualApproval,
    sttPolicySummary,
  };
}
