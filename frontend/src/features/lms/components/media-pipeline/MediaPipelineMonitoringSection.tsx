import type { AudioExtraction, LectureDetail, LecturePipeline, LectureTranscript, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import { StatePanel } from '../StatePanel';
import { MediaPipelineStatusBoard } from '../MediaPipelineStatusBoard';
import { TranscriptTimelineWorkspace } from '../TranscriptTimelineWorkspace';
import type { MediaUploadResult } from '../../../../lib/api-media';

type MediaPipelineMonitoringSectionProps = {
  viewerRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  selectedLecture: LectureDetail;
  pipeline: LecturePipeline | null;
  providers: STTProviderCatalog | null;
  processorHealth: MediaProcessorHealth | null;
  uploadResult: MediaUploadResult | null;
  latestExtraction: AudioExtraction | null;
  extractions: AudioExtraction[];
  isRefreshing: boolean;
  transcript: LectureTranscript | null;
  onRefresh: () => void;
};

export function MediaPipelineMonitoringSection({
  viewerRole,
  selectedLecture,
  pipeline,
  providers,
  processorHealth,
  uploadResult,
  latestExtraction,
  extractions,
  isRefreshing,
  transcript,
  onRefresh,
}: MediaPipelineMonitoringSectionProps) {
  if (viewerRole === 'STUDENT') {
    return (
      <StatePanel
        compact
        icon="ri-lock-line"
        tone="slate"
        title="세부 상태는 관리자 전용입니다."
        description="일반 사용자는 업로드 결과와 전사 완료 여부만 볼 수 있습니다. 내부 FFmpeg, processor job, callback 상세는 운영자 화면에서 확인합니다."
      />
    );
  }

  return (
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
        onRefresh={onRefresh}
      />
      <TranscriptTimelineWorkspace selectedLecture={selectedLecture} transcript={transcript} />
    </section>
  );
}
