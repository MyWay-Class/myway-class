import { useMemo, useState } from 'react';
import type { CourseCard, CourseCreateRequest, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseCreateCard } from '../components/CourseCreateCard';
import { LectureStudioPage } from './LectureStudioPage';
import { createAudioExtractionDetailed, uploadLectureVideoDetailed } from '../../../lib/api-media';

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
};

type WorkspaceTab = 'create' | 'studio';

const tabList: Array<{ id: WorkspaceTab; label: string; hint: string; icon: string }> = [
  { id: 'create', label: '강의 개설', hint: '기본 정보와 첫 차시를 등록합니다.', icon: 'ri-add-circle-line' },
  { id: 'studio', label: '제작 스튜디오', hint: '강의 개설 후 세부 옵션과 자동 처리를 이어갑니다.', icon: 'ri-layout-masonry-line' },
];

const stepLabels: Record<WorkspaceTab, string> = {
  create: '1. 강의 개설',
  studio: '2. 제작 스튜디오',
};

export function CourseCreatePage({
  courses,
  canManageCurrent,
  busy,
  sessionToken,
  selectedCourse,
  highlightedLecture,
  onCreateCourse,
  onSelectCourse,
  onSelectLecture,
}: CourseCreatePageProps) {
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
    setActiveTab('studio');
    setWorkspaceNote(`${created.title} 강의를 개설했습니다. 자동 처리와 스튜디오 설정을 이어갑니다.`);
    void runAutoMediaPipeline(created);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#4338ca_100%)] px-6 py-6 text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-add-circle-line" />
              강좌개설
            </div>
            <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.05em]">새 강좌를 입력하고, 개설과 스튜디오를 한 번에 이어가기</h1>
            <p className="mt-2 text-[13px] leading-7 text-white/75">
              교수, 강사, 운영자가 개설 정보를 먼저 입력하고 다음 단계로 넘어가면, 그 정보 그대로 강의를 개설하고 제작 스튜디오로 이어갈 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 강의 수</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">{courses.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">카테고리</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">{categoryCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">진입 방식</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">2단계 워크플로우</div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">
          {workspaceNote}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2">
          {tabList.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900">
                      <i className={tab.icon} />
                      {tab.label}
                    </div>
                    <div className="mt-1 text-[12px] leading-6 text-slate-500">{tab.hint}</div>
                  </div>
                  {active ? <i className="ri-checkbox-circle-fill text-[18px] text-indigo-600" /> : <i className="ri-checkbox-blank-circle-line text-[18px] text-slate-300" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">진행 단계</div>
            <div className="mt-1 text-[14px] font-bold text-slate-900">{stepLabels[activeTab]}</div>
          </div>
            <div className="text-[12px] leading-6 text-slate-500">
              입력한 정보는 탭을 옮겨도 유지되고, 다음 단계에서 강의 개설과 자동 전사 처리가 이어집니다.
            </div>
        </div>
      </section>

      {activeTab === 'create' ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <CourseCreateCard
              canCreate={canManageCurrent}
              busy={busy}
              submitMode="prepare"
              submitLabel="다음"
              onPrepare={handlePrepareCreate}
              onCreate={onCreateCourse}
            />

            <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h2 className="text-[15px] font-bold text-slate-900">자동 전사 안내</h2>
              <p className="mt-1 text-[12px] leading-6 text-slate-500">
                첫 차시 영상이 준비되어 있으면, 강의가 개설된 뒤 곧바로 업로드와 오디오 추출, STT 전사가 자동으로 이어집니다.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[12px] font-semibold text-slate-700">첫 차시 영상</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                    className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <div className="text-[11px] leading-5 text-slate-500">
                    선택된 영상은 개설 후 자동 처리 단계로 넘어갑니다. 업로드가 끝나면 오디오 추출과 STT가 이어집니다.
                  </div>
                  <div className="text-[12px] text-slate-600">{videoFile ? `선택됨: ${videoFile.name}` : '아직 선택된 영상이 없습니다.'}</div>
                </label>

                <button
                  type="button"
                  onClick={() => setAutoExtract((current) => !current)}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    autoExtract ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-semibold">개설 후 자동 추출</div>
                    <div className="mt-1 text-[12px] leading-6 opacity-80">업로드된 영상이 오디오 추출과 STT 처리로 바로 넘어갑니다.</div>
                  </div>
                  <div className={`flex h-6 w-11 items-center rounded-full p-1 transition ${autoExtract ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`h-4 w-4 rounded-full bg-white transition ${autoExtract ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h2 className="text-[15px] font-bold text-slate-900">입력된 개설 정보</h2>
              <div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">강의명: {pendingSummary.title}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">카테고리: {pendingSummary.category}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">난이도: {pendingSummary.difficulty}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">차시: {pendingSummary.lectureCount}개</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">설명: {pendingSummary.description}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50 px-5 py-5 text-[12px] leading-6 text-indigo-900">
              <div className="font-bold">권한 안내</div>
              <p className="mt-2 text-indigo-800">
                {canManageCurrent
                  ? '현재 계정은 강의 개설 권한이 있습니다.'
                  : '현재 계정은 강의 개설 권한이 없습니다. 관리자 또는 강사 계정으로 전환해 주세요.'}
              </p>
              <div className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-slate-600">
                <div className="font-semibold text-slate-900">현재 선택 정보</div>
                <div className="mt-1">강의: {courseSummary.title}</div>
                <div>차시 수: {courseSummary.lectureCount}개</div>
                <div>담당자: {courseSummary.instructor}</div>
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">제작 스튜디오에서 강의 개설 완료</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                입력한 정보로 강의를 생성하고, 이후 제작 세부 옵션과 오디오 추출, STT 전사를 바로 이어갑니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTab('create')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                이전: 정보 입력
              </button>
              <button
                type="button"
                onClick={() => void handleFinalizeCreate()}
                disabled={busy}
                className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? '개설 중...' : '강의 개설하고 스튜디오 열기'}
              </button>
            </div>
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <h3 className="text-[14px] font-bold text-slate-900">강의 개설 전 확인</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-6 text-slate-600">제목: {pendingSummary.title}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-6 text-slate-600">카테고리: {pendingSummary.category}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-6 text-slate-600">난이도: {pendingSummary.difficulty}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-6 text-slate-600">첫 차시 수: {pendingSummary.lectureCount}개</div>
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-4 text-[12px] leading-6 text-indigo-900">
                  강의 개설 버튼을 누르면 입력값으로 실제 강의가 만들어지고, 첫 차시 영상이 있으면 업로드와 오디오 추출이 자동으로 이어집니다.
                </div>
              </section>

              {activeCourse ? (
                <LectureStudioPage
                  courses={courses}
                  selectedCourse={activeCourse}
                  highlightedLecture={highlightedLecture}
                  onSelectCourse={onSelectCourse}
                />
              ) : (
                <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                  <h3 className="text-[14px] font-bold text-slate-900">스튜디오 대기 상태</h3>
                  <p className="mt-2 text-[12px] leading-6 text-slate-500">
                    아직 개설된 강의가 없습니다. 위의 버튼으로 강의를 개설해야 스튜디오 설정이 활성화됩니다.
                  </p>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <h2 className="text-[15px] font-bold text-slate-900">자동 처리 순서</h2>
                <div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">1. 강의 개설</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">2. 첫 차시 연결</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">3. 영상 업로드</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">4. 오디오 추출과 STT 자동 진행</div>
                </div>
              </section>

              <section className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50 px-5 py-5 text-[12px] leading-6 text-indigo-900">
                <div className="font-bold">현재 상태</div>
                <p className="mt-2 text-indigo-800">{workspaceNote}</p>
                <div className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-slate-600">
                  <div className="font-semibold text-slate-900">영상 처리</div>
                  <div className="mt-1">{videoFile ? videoFile.name : '아직 선택된 영상이 없습니다.'}</div>
                  <div className="mt-1">{autoExtract ? '자동 추출 사용' : '자동 추출 해제'}</div>
                </div>
              </section>
            </aside>
          </section>
        </section>
      )}
    </div>
  );
}
