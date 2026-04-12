import { useMemo, useState } from 'react';
import type { CourseCard, CourseCreateRequest, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseCreateCard } from '../components/CourseCreateCard';
import { LectureStudioPage } from './LectureStudioPage';
import { MediaPipelinePage } from './MediaPipelinePage';
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

type WorkspaceTab = 'create' | 'studio' | 'media';

const tabList: Array<{ id: WorkspaceTab; label: string; hint: string; icon: string }> = [
  { id: 'create', label: '강의 개설', hint: '기본 정보와 첫 차시를 등록합니다.', icon: 'ri-add-circle-line' },
  { id: 'studio', label: '제작 스튜디오', hint: '강의 제작 세부 옵션을 조정합니다.', icon: 'ri-layout-masonry-line' },
  { id: 'media', label: '미디어 파이프라인', hint: '영상 업로드와 STT 상태를 확인합니다.', icon: 'ri-movie-2-line' },
];

const stepLabels: Record<WorkspaceTab, string> = {
  create: '1. 강의 개설',
  studio: '2. 제작 스튜디오',
  media: '3. 미디어 파이프라인',
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [autoExtract, setAutoExtract] = useState(true);
  const [workspaceNote, setWorkspaceNote] = useState('강의 개설, 스튜디오, 미디어 파이프라인을 한 곳에서 이어서 사용할 수 있습니다.');

  const categoryCount = new Set(courses.map((item) => item.category)).size;
  const activeCourse = selectedCourse ?? createdCourse;
  const activeLecture = highlightedLecture ?? activeCourse?.lectures[0] ?? null;

  const courseSummary = useMemo(
    () => ({
      title: activeCourse?.title ?? '선택된 강의 없음',
      lectureCount: activeCourse?.lectures.length ?? 0,
      instructor: activeCourse?.instructor_name ?? '강의 개설 후 확인',
    }),
    [activeCourse],
  );

  async function runAutoMediaPipeline(course: CourseDetail) {
    const lecture = course.lectures[0];
    if (!lecture || !videoFile || !autoExtract) {
      setWorkspaceNote('강의 개설이 끝났습니다. 제작 스튜디오와 미디어 탭에서 다음 단계를 이어갈 수 있습니다.');
      return;
    }

    setActiveTab('media');
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
      setWorkspaceNote('영상 업로드는 완료되었지만 오디오 추출 요청은 실패했습니다. 미디어 탭에서 다시 시도해 주세요.');
      return;
    }

    setWorkspaceNote(
      extractionResult.data.transcript_id
        ? '업로드, 오디오 추출, 전사까지 자동으로 완료되었습니다.'
        : '업로드와 오디오 추출 요청이 완료되었습니다. 미디어 탭에서 처리 상태를 확인할 수 있습니다.',
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#4338ca_100%)] px-6 py-6 text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-add-circle-line" />
              강의 개설 워크스페이스
            </div>
            <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.05em]">새 강의를 쉽게 만들고 바로 제작 흐름으로 넘기기</h1>
            <p className="mt-2 text-[13px] leading-7 text-white/75">
              교수, 강사, 운영자가 배포 환경에서도 새 강의를 직접 개설하고, 첫 차시와 기본 자료/공지 초안을 함께 만들 수 있는 진입점입니다.
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
              <div className="mt-1 text-[18px] font-extrabold text-white">전용 페이지</div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">
          {workspaceNote}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-3">
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
            입력한 정보는 탭을 옮겨도 유지되고, 개설이 끝나면 다음 단계로 바로 이어집니다.
          </div>
        </div>
      </section>

      <section hidden={activeTab !== 'create'} aria-hidden={activeTab !== 'create'} className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <CourseCreateCard
              canCreate={canManageCurrent}
              busy={busy}
              onCreate={onCreateCourse}
              onCreated={(course) => {
                setCreatedCourse(course);
                onSelectCourse(course.id);
                onSelectLecture(course.lectures[0]?.id ?? '');
                setWorkspaceNote(`${course.title} 강의를 개설했습니다. 이어서 스튜디오와 미디어 설정을 진행할 수 있습니다.`);
                void runAutoMediaPipeline(course);
                if (!videoFile || !autoExtract) {
                  setActiveTab('studio');
                }
              }}
            />

            <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h2 className="text-[15px] font-bold text-slate-900">영상과 자동 추출</h2>
              <p className="mt-1 text-[12px] leading-6 text-slate-500">
                첫 차시용 영상을 먼저 선택해 두면, 강의 개설 후 바로 업로드와 오디오 추출을 이어서 처리합니다.
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
                    선택된 영상은 생성된 첫 차시에 연결됩니다. 업로드가 끝나면 오디오 추출과 STT가 자동으로 이어집니다.
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
                    <div className="text-[13px] font-semibold">강의 개설 후 자동 추출</div>
                    <div className="mt-1 text-[12px] leading-6 opacity-80">업로드된 영상이 바로 오디오 추출 파이프라인으로 넘어갑니다.</div>
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
              <h2 className="text-[15px] font-bold text-slate-900">처음 만들 때 안내</h2>
              <div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">1. 제목과 소개만 먼저 넣어도 바로 시작할 수 있습니다.</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">2. 차시는 한 줄씩 적으면 입력한 순서대로 등록됩니다.</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">3. 영상이 있으면 개설 후 바로 업로드와 추출이 이어집니다.</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">4. 개설이 끝나면 스튜디오와 미디어 탭으로 이어서 이동합니다.</div>
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

      <section hidden={activeTab !== 'studio'} aria-hidden={activeTab !== 'studio'} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">제작 스튜디오를 같은 흐름에서 이어가기</h2>
              <p className="mt-1 text-[12px] text-slate-500">강의 개설 직후 바로 제작 옵션과 발행 준비를 다듬을 수 있습니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTab('create')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                이전: 개설
              </button>
              <button type="button" onClick={() => setActiveTab('media')} className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500">
                미디어 탭으로 이동
              </button>
            </div>
          </div>
          <LectureStudioPage
            courses={courses}
            selectedCourse={activeCourse}
            highlightedLecture={activeLecture}
            onSelectCourse={onSelectCourse}
          />
      </section>

      <section hidden={activeTab !== 'media'} aria-hidden={activeTab !== 'media'} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">미디어 파이프라인을 같은 화면에서 확인하기</h2>
              <p className="mt-1 text-[12px] text-slate-500">업로드, 오디오 추출, STT, 타임스탬프 상태를 따로 이동하지 않고 바로 확인합니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTab('studio')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                이전: 스튜디오
              </button>
              <button type="button" onClick={() => setActiveTab('create')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                처음으로
              </button>
            </div>
          </div>
          <MediaPipelinePage selectedCourse={activeCourse} highlightedLecture={highlightedLecture} sessionToken={sessionToken} />
      </section>
    </div>
  );
}
