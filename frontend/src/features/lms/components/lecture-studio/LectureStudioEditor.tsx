import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import {
  type LectureStudioDraft,
} from './types';
import { LectureStudioEditorContentActions } from './LectureStudioEditorContentActions';
import { LectureStudioEditorMainSections } from './LectureStudioEditorSections';

type LectureStudioEditorProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  draft: LectureStudioDraft;
  statusNote: string;
  onChange: (draft: LectureStudioDraft) => void;
  onSelectCourse: (courseId: string) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};


export function LectureStudioEditor({
  courses,
  selectedCourse,
  highlightedLecture,
  draft,
  statusNote,
  onChange,
  onSelectCourse,
  onSaveDraft,
  onMarkReady,
}: LectureStudioEditorProps) {
  const courseOptions = courses.slice(0, 6);
  const outlineCount = draft.outlineText.split(/\r?\n/).filter(Boolean).length;
  const materialCount = draft.materialsText.split(/\r?\n/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <LectureStudioEditorMainSections
        courses={courses}
        courseOptions={courseOptions}
        selectedCourse={selectedCourse}
        highlightedLecture={highlightedLecture}
        draft={draft}
        statusNote={statusNote}
        onChange={onChange}
        onSelectCourse={onSelectCourse}
        onSaveDraft={onSaveDraft}
        onMarkReady={onMarkReady}
      />

      <LectureStudioEditorContentActions
        draft={draft}
        outlineCount={outlineCount}
        materialCount={materialCount}
        onChange={onChange}
        onSaveDraft={onSaveDraft}
        onMarkReady={onMarkReady}
      />
    </div>
  );
}
