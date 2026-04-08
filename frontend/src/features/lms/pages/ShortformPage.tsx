import type { CourseCard, LectureDetail } from '@myway/shared';

type ShortformPageProps = {
  highlightedLecture: LectureDetail | null;
  courses: CourseCard[];
};

export function ShortformPage({ highlightedLecture, courses }: ShortformPageProps) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">숏폼 제작</h2>
        <p className="mt-1 text-[12px] text-slate-500">강의 핵심 구간을 짧은 클립으로 재구성하는 레퍼런스 톤의 편집 화면입니다.</p>

        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex gap-3 rounded-2xl border border-slate-200 px-4 py-4 hover:bg-slate-50">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-slate-500">{highlightedLecture?.course_title ?? courses[0]?.title ?? '선택한 강의'}</div>
                <div className="mt-1 text-[13px] font-medium text-slate-900">
                  {highlightedLecture?.title ?? '핵심 개념과 예제를 숏폼 클립으로 재구성합니다.'}
                </div>
                <div className="mt-2 flex gap-3 text-[11px] text-slate-400">
                  <span>00:0{index} - 00:1{index}</span>
                  <span>추천 클립</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">미리보기</h3>
        <div className="mt-4 aspect-video rounded-2xl bg-[linear-gradient(135deg,#1e293b,#334155)]" />
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 w-1/2 rounded-full bg-indigo-500" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>선택된 클립 3개</span>
            <span>00:32</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
