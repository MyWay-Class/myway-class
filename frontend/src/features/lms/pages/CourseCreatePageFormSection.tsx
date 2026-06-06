import type { CourseCreateRequest, CourseDetail } from '@myway/shared';
import { CourseCreateCard } from '../components/CourseCreateCard';

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

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]"><h2 className="text-[15px] font-bold text-slate-900">{title}</h2><div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">{items.map((item) => <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</div>)}</div></section>;
}
