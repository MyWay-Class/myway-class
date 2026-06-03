import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import { type LectureStudioDraft } from './types';
import { LectureStudioEditorCoreSections } from './LectureStudioEditorCoreSections';
import { LectureStudioEditorFormSections } from './LectureStudioEditorFormSections';

type LectureStudioEditorMainSectionsProps = {
  courses: CourseCard[];
  courseOptions: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  draft: LectureStudioDraft;
  statusNote: string;
  onChange: (draft: LectureStudioDraft) => void;
  onSelectCourse: (courseId: string) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};

export function LectureStudioEditorMainSections({
  courseOptions,
  selectedCourse,
  highlightedLecture,
  draft,
  statusNote,
  onChange,
  onSelectCourse,
  onSaveDraft,
  onMarkReady,
}: LectureStudioEditorMainSectionsProps) {
  return (
    <>
      <LectureStudioEditorCoreSections
        courseOptions={courseOptions}
        selectedCourse={selectedCourse}
        highlightedLecture={highlightedLecture}
        draft={draft}
        statusNote={statusNote}
        onSelectCourse={onSelectCourse}
        onSaveDraft={onSaveDraft}
        onMarkReady={onMarkReady}
        onChange={onChange}
      />
      <LectureStudioEditorFormSections draft={draft} onChange={onChange} />
    </>
  );
}
