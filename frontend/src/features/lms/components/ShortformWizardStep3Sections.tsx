import type { ClipSuggestion } from './ShortformWizardTypes';
import { ShortformWizardStep3Actions } from './ShortformWizardStep3Actions';
import { ShortformWizardStep3Meta } from './ShortformWizardStep3Meta';
import { ShortformWizardStep3Preview } from './ShortformWizardStep3Preview';

type ShortformWizardStep3SectionsProps = {
  courseTitle?: string | null;
  selectedClips: ClipSuggestion[];
  title: string;
  description: string;
  createdVideoId: string | null;
  previewVideoUrl: string | null;
  exportStatus: string | null;
  status: string;
  totalDurationMs: number;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onRemoveClip: (key: string) => void;
  onUpdateClipTimes: (key: string, startTimeMs: number, endTimeMs: number) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  formatDuration: (ms: number) => string;
};

export function ShortformWizardStep3Sections({
  courseTitle,
  selectedClips,
  title,
  description,
  createdVideoId,
  previewVideoUrl,
  exportStatus,
  status,
  totalDurationMs,
  onBack,
  onSave,
  onShare,
  onRemoveClip,
  onUpdateClipTimes,
  onTitleChange,
  onDescriptionChange,
  formatDuration,
}: ShortformWizardStep3SectionsProps) {
  return (
    <article className="space-y-5 rounded-2xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <i className="ri-edit-line text-[18px] text-cyan-600" />
            <h2 className="text-[16px] font-semibold text-slate-900">3단계 · 미리보기 / 저장</h2>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">선택한 클립을 미리보고 제목과 설명을 입력한 뒤 저장합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{formatDuration(totalDurationMs)} 합계</span>
          <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-600">
            이전
          </button>
        </div>
      </div>

      <ShortformWizardStep3Preview
        courseTitle={courseTitle}
        selectedClips={selectedClips}
        title={title}
        previewVideoUrl={previewVideoUrl}
        exportStatus={exportStatus}
        totalDurationMs={totalDurationMs}
        onRemoveClip={onRemoveClip}
        onUpdateClipTimes={onUpdateClipTimes}
        formatDuration={formatDuration}
      />

      <ShortformWizardStep3Meta
        title={title}
        description={description}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      <ShortformWizardStep3Actions status={status} createdVideoId={createdVideoId} onBack={onBack} onSave={onSave} onShare={onShare} />
      {createdVideoId ? <p className="text-[11px] text-slate-400">생성 ID: {createdVideoId}</p> : null}
    </article>
  );
}
