import type { CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import {
  splitLectureStudioLines,
  type LectureStudioDraft,
} from './types';
import { LectureStudioPreviewSections } from './LectureStudioPreviewSections';

type LectureStudioPreviewProps = {
  draft: LectureStudioDraft;
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  statusNote: string;
};

export function LectureStudioPreview({ draft, selectedCourse, highlightedLecture, statusNote }: LectureStudioPreviewProps) {
  const outlineItems = splitLectureStudioLines(draft.outlineText);
  const materialItems = splitLectureStudioLines(draft.materialsText);
  const activeLecture = highlightedLecture ?? selectedCourse?.lectures[0] ?? null;

  return (
    <LectureStudioPreviewSections
      draft={draft}
      selectedCourse={selectedCourse}
      activeLecture={activeLecture}
      outlineItems={outlineItems}
      materialItems={materialItems}
      statusNote={statusNote}
    />
  );
}
