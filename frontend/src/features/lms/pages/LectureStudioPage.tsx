import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import { LectureStudioPageHero, LectureStudioPageWorkspace } from './LectureStudioPageSections';
import { useLectureStudioPageFlow } from './useLectureStudioPageFlow';

type LectureStudioPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  onSelectCourse: (courseId: string) => void;
};

export function LectureStudioPage({ courses, selectedCourse, highlightedLecture, onSelectCourse }: LectureStudioPageProps) {
  const {
    activeCourse,
    draft,
    setDraft,
    statusNote,
    draftSummaries,
    previewLecture,
    outlineCount,
    materialCount,
    handleSaveDraft,
    handleMarkReady,
  } = useLectureStudioPageFlow({ selectedCourse, highlightedLecture });

  return (
    <div className="space-y-5">
      <LectureStudioPageHero
        selectedCourse={selectedCourse}
        draft={draft}
        statusNote={statusNote}
        draftCount={draftSummaries.length}
        outlineCount={outlineCount}
        materialCount={materialCount}
      />

      <LectureStudioPageWorkspace
        courses={courses.length > 0 ? courses : [activeCourse]}
        activeCourse={activeCourse}
        previewLecture={previewLecture}
        draft={draft}
        statusNote={statusNote}
        onChange={setDraft}
        onSelectCourse={onSelectCourse}
        onSaveDraft={handleSaveDraft}
        onMarkReady={handleMarkReady}
      />
    </div>
  );
}
