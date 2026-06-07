import { LectureStudioEditorAssessmentSection } from './LectureStudioEditorAssessmentSection';
import { LectureStudioEditorBasicInfoSection } from './LectureStudioEditorBasicInfoSection';
import { LectureStudioEditorOperationsSection } from './LectureStudioEditorOperationsSection';
import type { LectureStudioDraft } from './types';

type LectureStudioEditorFormSectionsProps = {
  draft: LectureStudioDraft;
  onChange: (draft: LectureStudioDraft) => void;
};

export function LectureStudioEditorFormSections({ draft, onChange }: LectureStudioEditorFormSectionsProps) {
  return (
    <>
      <section className="grid gap-5 xl:grid-cols-2">
        <LectureStudioEditorBasicInfoSection draft={draft} onChange={onChange} />
        <LectureStudioEditorOperationsSection draft={draft} onChange={onChange} />
      </section>
      <LectureStudioEditorAssessmentSection draft={draft} onChange={onChange} />
    </>
  );
}
