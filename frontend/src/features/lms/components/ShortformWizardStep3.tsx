import type { ClipSuggestion } from './ShortformWizardTypes';
import { ShortformWizardStep3Sections } from './ShortformWizardStep3Sections';

type ShortformWizardStep3Props = {
  courseTitle?: string | null;
  selectedClips: ClipSuggestion[];
  title: string;
  description: string;
  createdVideoId: string | null;
  previewVideoUrl: string | null;
  exportStatus: string | null;
  status: string;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onRemoveClip: (key: string) => void;
  onUpdateClipTimes: (key: string, startTimeMs: number, endTimeMs: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  formatDuration: (ms: number) => string;
};

export function ShortformWizardStep3({
  courseTitle,
  selectedClips,
  title,
  description,
  createdVideoId,
  previewVideoUrl,
  exportStatus,
  status,
  onBack,
  onSave,
  onShare,
  onRemoveClip,
  onUpdateClipTimes,
  onTitleChange,
  onDescriptionChange,
  formatDuration,
}: ShortformWizardStep3Props) {
  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);

  return (
    <ShortformWizardStep3Sections
      courseTitle={courseTitle}
      selectedClips={selectedClips}
      title={title}
      description={description}
      createdVideoId={createdVideoId}
      previewVideoUrl={previewVideoUrl}
      exportStatus={exportStatus}
      status={status}
      totalDurationMs={totalDurationMs}
      onBack={onBack}
      onSave={onSave}
      onShare={onShare}
      onRemoveClip={onRemoveClip}
      onUpdateClipTimes={onUpdateClipTimes}
      onTitleChange={onTitleChange}
      onDescriptionChange={onDescriptionChange}
      formatDuration={formatDuration}
    />
  );
}
