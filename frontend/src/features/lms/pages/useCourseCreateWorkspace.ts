import { useMemo, useState } from 'react';
import type { CourseCard, CourseCreateRequest, CourseDetail, LectureDetail } from '@myway/shared';
import { createAudioExtractionDetailed, uploadLectureVideoDetailed } from '../../../lib/api-media';

export type WorkspaceTab = 'create' | 'studio';

type UseCourseCreateWorkspaceInput = {
  courses: CourseCard[];
  sessionToken: string;
  selectedCourse: CourseDetail | null;
  onCreateCourse: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function useCourseCreateWorkspace({
  courses,
  sessionToken,
  selectedCourse,
  onCreateCourse,
  onSelectCourse,
  onSelectLecture,
  onNavigate,
}: UseCourseCreateWorkspaceInput) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('create');
  const [createdCourse, setCreatedCourse] = useState<CourseDetail | null>(null);
  const [pendingCreateInput, setPendingCreateInput] = useState<CourseCreateRequest | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [autoExtract, setAutoExtract] = useState(true);
  const [workspaceNote, setWorkspaceNote] = useState('강의 개설, 제작 스튜디오, 자동 전사 흐름을 한 번에 이어서 사용할 수 있습니다.');

  const categoryCount = new Set(courses.map((item) => item.category)).size;
  const activeCourse = createdCourse ?? selectedCourse;

  const courseSummary = useMemo(
    () => ({
      title: activeCourse?.title ?? '선택된 강의 없음',
      lectureCount: activeCourse?.lectures.length ?? 0,
      instructor: activeCourse?.instructor_name ?? '강의 개설 후 확인',
    }),
    [activeCourse],
  );

  const pendingSummary = useMemo(
    () => ({
      title: pendingCreateInput?.title?.trim() ?? '아직 입력되지 않음',
      description: pendingCreateInput?.description?.trim() ?? '아직 입력되지 않음',
      category: pendingCreateInput?.category?.trim() ?? '아직 입력되지 않음',
      difficulty: pendingCreateInput?.difficulty ?? 'intermediate',
      lectureCount: pendingCreateInput?.lecture_titles?.length ?? 0,
    }),
    [pendingCreateInput],
  );

  function handlePrepareCreate(input: CourseCreateRequest) {
    setPendingCreateInput(input);
    setWorkspaceNote('기본 정보를 저장했습니다. 이제 스튜디오 단계에서 강의 개설을 완료할 수 있습니다.');
    setActiveTab('studio');
  }

  async function runAutoMediaPipeline(course: CourseDetail) {
    const lecture = course.lectures[0];
    if (!lecture || !videoFile || !autoExtract) {
      setWorkspaceNote('강의 개설이 끝났습니다. 제작 스튜디오에서 다음 단계를 이어갈 수 있습니다.');
      return;
    }

    setWorkspaceNote(`${lecture.title}에 업로드된 영상을 연결하고 오디오 추출을 자동으로 시작합니다.`);
    const uploadResult = await uploadLectureVideoDetailed(lecture.id, videoFile, sessionToken);
    if (!uploadResult?.success || !uploadResult.data) {
      setWorkspaceNote(
        uploadResult
          ? '영상 업로드는 실패했습니다. R2 binding, 권한, 저장소 상태를 확인해 주세요.'
          : '백엔드에 연결할 수 없습니다. `npm run dev`로 backend와 media processor가 실행 중인지 확인해 주세요.',
      );
      return;
    }

    const upload = uploadResult.data;
    const extractionResult = await createAudioExtractionDetailed(
      {
        lecture_id: lecture.id,
        video_url: upload.video_url,
        video_asset_key: upload.asset_key,
        source_file_name: upload.file_name,
        source_content_type: upload.content_type,
        source_size_bytes: upload.size_bytes,
        language: 'ko',
      },
      sessionToken,
    );

    if (!extractionResult?.success || !extractionResult.data) {
      setWorkspaceNote('영상 업로드는 완료되었지만 오디오 추출 요청은 실패했습니다. 제작 스튜디오에서 다시 시도해 주세요.');
      return;
    }

    setWorkspaceNote(
      extractionResult.data.transcript_id
        ? '업로드, 오디오 추출, 전사, 자동 요약까지 완료되었습니다.'
        : '업로드와 오디오 추출 요청이 완료되었습니다. 제작 스튜디오에서 처리 상태를 확인할 수 있습니다.',
    );
  }

  async function handleFinalizeCreate() {
    if (!pendingCreateInput) {
      setWorkspaceNote('먼저 강의 개설 정보를 입력해 주세요.');
      setActiveTab('create');
      return;
    }

    const created = await onCreateCourse(pendingCreateInput);
    if (!created) {
      setWorkspaceNote('강의 개설에 실패했습니다. 입력값을 다시 확인해 주세요.');
      return;
    }

    setCreatedCourse(created);
    onSelectCourse(created.id);
    onSelectLecture(created.lectures[0]?.id ?? '');
    onNavigate('courses');
    setActiveTab('studio');
    setWorkspaceNote(`${created.title} 강의를 개설했습니다. 자동 처리와 스튜디오 설정을 이어갑니다.`);
    void runAutoMediaPipeline(created);
  }

  return {
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
  };
}
