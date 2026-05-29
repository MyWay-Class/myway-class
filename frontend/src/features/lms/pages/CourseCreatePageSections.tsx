import type { CourseCard, CourseCreateRequest, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseCreateCard } from '../components/CourseCreateCard';
import { LectureStudioPage } from './LectureStudioPage';
import type { WorkspaceTab } from './useCourseCreateWorkspace';

export const tabList: Array<{ id: WorkspaceTab; label: string; hint: string; icon: string }> = [
  { id: 'create', label: '강의 개설', hint: '기본 정보와 첫 차시를 등록합니다.', icon: 'ri-add-circle-line' },
  { id: 'studio', label: '제작 스튜디오', hint: '강의 개설 후 세부 옵션과 자동 처리를 이어갑니다.', icon: 'ri-layout-masonry-line' },
];

export const stepLabels: Record<WorkspaceTab, string> = {
  create: '1. 강의 개설',
  studio: '2. 제작 스튜디오',
};

export function CourseCreateHero({ courses, categoryCount, workspaceNote }: { courses: CourseCard[]; categoryCount: number; workspaceNote: string }) {
  return (
    <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur"><i className="ri-add-circle-line" />강좌개설</div>
          <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.05em]">새 강좌를 입력하고, 개설과 스튜디오를 한 번에 이어가기</h1>
          <p className="mt-2 text-[13px] leading-7 text-white/75">교수, 강사, 운영자가 개설 정보를 먼저 입력하고 다음 단계로 넘어가면, 그 정보 그대로 강의를 개설하고 제작 스튜디오로 이어갈 수 있습니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricBox label="현재 강의 수" value={courses.length} />
          <MetricBox label="카테고리" value={categoryCount} />
          <MetricBox label="진입 방식" value="2단계 워크플로우" />
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">{workspaceNote}</div>
    </section>
  );
}

function MetricBox({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">{label}</div><div className="mt-1 text-[18px] font-extrabold text-white">{value}</div></div>;
}

export function CourseCreateTabs({ activeTab, onChange }: { activeTab: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  return (
    <section className="rounded-3xl border border-[#d6e6f5] bg-white p-2 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="grid gap-2 md:grid-cols-2">
        {tabList.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`rounded-2xl border px-4 py-4 text-left transition ${active ? 'border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100' : 'border-slate-200 bg-slate-50/70 hover:bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900"><i className={tab.icon} />{tab.label}</div><div className="mt-1 text-[12px] leading-6 text-slate-500">{tab.hint}</div></div>
                {active ? <i className="ri-checkbox-circle-fill text-[18px] text-cyan-600" /> : <i className="ri-checkbox-blank-circle-line text-[18px] text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CourseCreateStepBanner({ activeTab }: { activeTab: WorkspaceTab }) {
  return <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-4 shadow-[0_14px_30px_rgba(6,31,57,0.08)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">진행 단계</div><div className="mt-1 text-[14px] font-bold text-slate-900">{stepLabels[activeTab]}</div></div><div className="text-[12px] leading-6 text-slate-500">입력한 정보는 탭을 옮겨도 유지되고, 다음 단계에서 강의 개설과 자동 전사 처리가 이어집니다.</div></div></section>;
}

type CreateSectionProps = {
  canManageCurrent: boolean;
  busy: boolean;
  onCreateCourse: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onPrepare: (input: CourseCreateRequest) => void;
  pendingSummary: { title: string; category: string; difficulty: string; lectureCount: number; description: string };
  courseSummary: { title: string; lectureCount: number; instructor: string };
  videoFile: File | null;
  onChangeVideoFile: (file: File | null) => void;
  autoExtract: boolean;
  onToggleAutoExtract: () => void;
};

export function CourseCreateFormSection(props: CreateSectionProps) {
  const { canManageCurrent, busy, onCreateCourse, onPrepare, pendingSummary, courseSummary, videoFile, onChangeVideoFile, autoExtract, onToggleAutoExtract } = props;
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="space-y-5">
        <CourseCreateCard canCreate={canManageCurrent} busy={busy} submitMode="prepare" submitLabel="다음" onPrepare={onPrepare} onCreate={onCreateCourse} />
        <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
          <h2 className="text-[15px] font-bold text-slate-900">자동 전사 안내</h2>
          <p className="mt-1 text-[12px] leading-6 text-slate-500">첫 차시 영상이 준비되어 있으면, 강의가 개설된 뒤 곧바로 업로드와 오디오 추출, STT 전사가 자동으로 이어집니다.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">첫 차시 영상</span>
              <input type="file" accept="video/*" onChange={(event) => onChangeVideoFile(event.target.files?.[0] ?? null)} className="block w-full cursor-pointer rounded-2xl border border-dashed border-[#b9d7ef] bg-[#f4faff] px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
              <div className="text-[11px] leading-5 text-slate-500">선택된 영상은 개설 후 자동 처리 단계로 넘어갑니다. 업로드가 끝나면 오디오 추출과 STT가 이어집니다.</div>
              <div className="text-[12px] text-slate-600">{videoFile ? `선택됨: ${videoFile.name}` : '아직 선택된 영상이 없습니다.'}</div>
            </label>
            <button type="button" onClick={onToggleAutoExtract} className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${autoExtract ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <div><div className="text-[13px] font-semibold">개설 후 자동 추출</div><div className="mt-1 text-[12px] leading-6 opacity-80">업로드된 영상이 오디오 추출과 STT 처리로 바로 넘어갑니다.</div></div>
              <div className={`flex h-6 w-11 items-center rounded-full p-1 transition ${autoExtract ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`h-4 w-4 rounded-full bg-white transition ${autoExtract ? 'translate-x-5' : 'translate-x-0'}`} /></div>
            </button>
          </div>
        </section>
      </div>
      <aside className="space-y-5">
        <InfoCard title="입력된 개설 정보" items={[`강의명: ${pendingSummary.title}`, `카테고리: ${pendingSummary.category}`, `난이도: ${pendingSummary.difficulty}`, `차시: ${pendingSummary.lectureCount}개`, `설명: ${pendingSummary.description}`]} />
        <section className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50 px-5 py-5 text-[12px] leading-6 text-cyan-900"><div className="font-bold">권한 안내</div><p className="mt-2 text-cyan-800">{canManageCurrent ? '현재 계정은 강의 개설 권한이 있습니다.' : '현재 계정은 강의 개설 권한이 없습니다. 관리자 또는 강사 계정으로 전환해 주세요.'}</p><div className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-slate-600"><div className="font-semibold text-slate-900">현재 선택 정보</div><div className="mt-1">강의: {courseSummary.title}</div><div>차시 수: {courseSummary.lectureCount}개</div><div>담당자: {courseSummary.instructor}</div></div></section>
      </aside>
    </section>
  );
}

type StudioSectionProps = {
  busy: boolean;
  courses: CourseCard[];
  activeCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  pendingSummary: { title: string; category: string; difficulty: string; lectureCount: number };
  workspaceNote: string;
  videoFile: File | null;
  autoExtract: boolean;
  onBack: () => void;
  onFinalize: () => void;
  onSelectCourse: (courseId: string) => void;
};

export function CourseCreateStudioSection(props: StudioSectionProps) {
  const { busy, courses, activeCourse, highlightedLecture, pendingSummary, workspaceNote, videoFile, autoExtract, onBack, onFinalize, onSelectCourse } = props;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div><h2 className="text-[15px] font-bold text-slate-900">제작 스튜디오에서 강의 개설 완료</h2><p className="mt-1 text-[12px] text-slate-500">입력한 정보로 강의를 생성하고, 이후 제작 세부 옵션과 오디오 추출, STT 전사를 바로 이어갑니다.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={onBack} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">이전: 정보 입력</button><button type="button" onClick={onFinalize} disabled={busy} className="rounded-full bg-[linear-gradient(135deg,#00b8e6_0%,#0077b6_100%)] px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">{busy ? '개설 중...' : '강의 개설하고 스튜디오 열기'}</button></div>
      </div>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5">
          <InfoCard title="강의 개설 전 확인" items={[`제목: ${pendingSummary.title}`, `카테고리: ${pendingSummary.category}`, `난이도: ${pendingSummary.difficulty}`, `첫 차시 수: ${pendingSummary.lectureCount}개`]} />
          {activeCourse ? <LectureStudioPage courses={courses} selectedCourse={activeCourse} highlightedLecture={highlightedLecture} onSelectCourse={onSelectCourse} /> : <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]"><h3 className="text-[14px] font-bold text-slate-900">스튜디오 대기 상태</h3><p className="mt-2 text-[12px] leading-6 text-slate-500">아직 개설된 강의가 없습니다. 위의 버튼으로 강의를 개설해야 스튜디오 설정이 활성화됩니다.</p></section>}
        </div>
        <aside className="space-y-5">
          <InfoCard title="자동 처리 순서" items={['1. 강의 개설', '2. 첫 차시 연결', '3. 영상 업로드', '4. 오디오 추출과 STT 자동 진행']} />
          <section className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50 px-5 py-5 text-[12px] leading-6 text-cyan-900"><div className="font-bold">현재 상태</div><p className="mt-2 text-indigo-800">{workspaceNote}</p><div className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-slate-600"><div className="font-semibold text-slate-900">영상 처리</div><div className="mt-1">{videoFile ? videoFile.name : '아직 선택된 영상이 없습니다.'}</div><div className="mt-1">{autoExtract ? '자동 추출 사용' : '자동 추출 해제'}</div></div></section>
        </aside>
      </section>
    </section>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]"><h2 className="text-[15px] font-bold text-slate-900">{title}</h2><div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">{items.map((item) => <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</div>)}</div></section>;
}
