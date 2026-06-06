import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { LectureStudioPage } from './LectureStudioPage';

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
