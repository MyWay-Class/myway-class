import type { AudioExtraction, CourseDetail, LectureDetail, LecturePipeline } from '@myway/shared';
import type { MediaUploadResult } from '../../../../lib/api-media';
import {
  MediaUploadWorkspaceFormSection,
  MediaUploadWorkspaceSummarySection,
} from './MediaUploadWorkspacePanelSections';

type RetrySource = {
  video_url?: string;
  video_asset_key?: string;
  source_file_name?: string;
  source_content_type?: string;
  source_size_bytes?: number;
};

type MediaUploadWorkspacePanelProps = {
  displayCourse: CourseDetail;
  lectureOptions: LectureDetail[];
  selectedLecture: LectureDetail | null;
  lectureId: string;
  audioUrl: string;
  videoFile: File | null;
  busy: boolean;
  demoMode: boolean;
  notice: string;
  uploadResult: MediaUploadResult | null;
  latestExtraction: AudioExtraction | null;
  pipeline: LecturePipeline | null;
  retrySource: RetrySource;
  onLectureChange: (lectureId: string) => void;
  onAudioUrlChange: (audioUrl: string) => void;
  onVideoFileChange: (file: File | null) => void;
  onSubmit: () => void;
};

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadWorkspacePanel({
  displayCourse,
  lectureOptions,
  selectedLecture,
  lectureId,
  audioUrl,
  videoFile,
  busy,
  demoMode,
  notice,
  uploadResult,
  latestExtraction,
  pipeline,
  retrySource,
  onLectureChange,
  onAudioUrlChange,
  onVideoFileChange,
  onSubmit,
}: MediaUploadWorkspacePanelProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
      <MediaUploadWorkspaceFormSection
        displayCourse={displayCourse}
        lectureOptions={lectureOptions}
        selectedLecture={selectedLecture}
        lectureId={lectureId}
        audioUrl={audioUrl}
        videoFile={videoFile}
        busy={busy}
        demoMode={demoMode}
        notice={notice}
        formatBytes={formatBytes}
        onLectureChange={onLectureChange}
        onAudioUrlChange={onAudioUrlChange}
        onVideoFileChange={onVideoFileChange}
        onSubmit={onSubmit}
      />
      <MediaUploadWorkspaceSummarySection
        selectedLecture={selectedLecture}
        uploadResult={uploadResult}
        latestExtraction={latestExtraction}
        pipeline={pipeline}
        retrySource={retrySource}
      />
    </section>
  );
}
