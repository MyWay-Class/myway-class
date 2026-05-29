import type { CourseCard, CourseCreateRequest, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseCreateFormSection, CourseCreateHero, CourseCreateStepBanner, CourseCreateStudioSection, CourseCreateTabs } from './CourseCreatePageSections';
import { useCourseCreateWorkspace } from './useCourseCreateWorkspace';

type CourseCreatePageProps = {
  courses: CourseCard[];
  canManageCurrent: boolean;
  busy: boolean;
  sessionToken: string;
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  onCreateCourse: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function CourseCreatePage(props: CourseCreatePageProps) {
  const {
    activeTab,
    setActiveTab,
    categoryCount,
    activeCourse,
    pendingSummary,
    courseSummary,
    videoFile,
    setVideoFile,
    autoExtract,
    setAutoExtract,
    workspaceNote,
    handlePrepareCreate,
    handleFinalizeCreate,
  } = useCourseCreateWorkspace({
    courses: props.courses,
    sessionToken: props.sessionToken,
    selectedCourse: props.selectedCourse,
    onCreateCourse: props.onCreateCourse,
    onSelectCourse: props.onSelectCourse,
    onSelectLecture: props.onSelectLecture,
    onNavigate: props.onNavigate,
  });

  return (
    <div className="space-y-5">
      <CourseCreateHero courses={props.courses} categoryCount={categoryCount} workspaceNote={workspaceNote} />
      <CourseCreateTabs activeTab={activeTab} onChange={setActiveTab} />
      <CourseCreateStepBanner activeTab={activeTab} />

      {activeTab === 'create' ? (
        <CourseCreateFormSection
          canManageCurrent={props.canManageCurrent}
          busy={props.busy}
          onCreateCourse={props.onCreateCourse}
          onPrepare={handlePrepareCreate}
          pendingSummary={pendingSummary}
          courseSummary={courseSummary}
          videoFile={videoFile}
          onChangeVideoFile={setVideoFile}
          autoExtract={autoExtract}
          onToggleAutoExtract={() => setAutoExtract((current) => !current)}
        />
      ) : (
        <CourseCreateStudioSection
          busy={props.busy}
          courses={props.courses}
          activeCourse={activeCourse}
          highlightedLecture={props.highlightedLecture}
          pendingSummary={pendingSummary}
          workspaceNote={workspaceNote}
          videoFile={videoFile}
          autoExtract={autoExtract}
          onBack={() => setActiveTab('create')}
          onFinalize={() => void handleFinalizeCreate()}
          onSelectCourse={props.onSelectCourse}
        />
      )}
    </div>
  );
}
