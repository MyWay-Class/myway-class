export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export function QuizGenHero({
  selectedCourseTitle,
  coverageSummary,
  difficultyLabel,
  questionCount,
}: {
  selectedCourseTitle: string;
  coverageSummary: string;
  difficultyLabel: string;
  questionCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
            <i className="ri-question-line" />
            시험·퀴즈 자동 생성
          </div>
          <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
            강의 선택부터 문항 수와
            <br />
            난이도까지 한 흐름으로 조정합니다.
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
            레퍼런스처럼 입력과 요약을 분리해, 강의 선택 다음에 바로 문제 생성 조건이 보이도록 정리했습니다.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">설정 요약</div>
          <div className="mt-3 text-[18px] font-extrabold text-white">{selectedCourseTitle}</div>
          <div className="mt-2 text-[12px] leading-6 text-white/70">{coverageSummary}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-white/60">난이도</div>
              <div className="mt-1 text-[16px] font-bold text-white">{difficultyLabel}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-white/60">문항</div>
              <div className="mt-1 text-[16px] font-bold text-white">{questionCount}개</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
