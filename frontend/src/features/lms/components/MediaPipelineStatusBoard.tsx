import type { AudioExtraction, LecturePipeline, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import type { MediaUploadResult } from '../../../lib/api-media';
import { DetailSections, HealthCards, PipelineCards } from './media-pipeline/MediaPipelineBoardSections';

type MediaPipelineStatusBoardProps = {
  compact?: boolean;
  selectedLecture: { title: string; duration_minutes: number } | null;
  pipeline: LecturePipeline | null;
  providers: STTProviderCatalog | null;
  processorHealth: MediaProcessorHealth | null;
  uploadResult: MediaUploadResult | null;
  extraction: AudioExtraction | null;
  recentExtractions?: AudioExtraction[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
};

export function MediaPipelineStatusBoard({
  compact = false,
  selectedLecture,
  pipeline,
  providers,
  processorHealth,
  uploadResult,
  extraction,
  recentExtractions = [],
  isRefreshing = false,
  onRefresh,
}: MediaPipelineStatusBoardProps) {
  return (
    <div className="space-y-4">
      <HealthCards processorHealth={processorHealth} />
      <PipelineCards
        selectedLecture={selectedLecture}
        pipeline={pipeline}
        uploadResult={uploadResult}
        extraction={extraction}
      />
      {compact ? null : (
        <DetailSections
          selectedLecture={selectedLecture}
          pipeline={pipeline}
          providers={providers}
          processorHealth={processorHealth}
          uploadResult={uploadResult}
          extraction={extraction}
          recentExtractions={recentExtractions}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
