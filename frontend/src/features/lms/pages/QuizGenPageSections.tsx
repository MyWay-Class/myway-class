import type { CourseCard } from '@myway/shared';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = '객관식' | '단답형' | '서술형' | '빈칸';

export const questionTypes: QuestionType[] = ['객관식', '단답형', '서술형', '빈칸'];

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

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

export function QuizGenCoursePicker({
  courses,
  selectedCourseId,
  onSelectCourse,
}: {
  courses: CourseCard[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-book-open-line text-cyan-700" />
        강의 선택
      </h3>
      <div className="mt-4 space-y-2">
        {courses.map((course) => {
          const active = selectedCourseId === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course.id)}
              className={`flex w-full items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                active ? 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-100' : 'border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-white'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-[20px] text-cyan-700">
                <i className="ri-play-circle-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-1 text-[12px] text-slate-500">
                  {course.category} · {course.instructor_name} · {course.lecture_count}차시
                </div>
              </div>
              <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-700">{course.progress_percent}%</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function QuizGenConditionPanel({
  questionCount,
  onQuestionCountChange,
  difficulty,
  onDifficultyChange,
  activeTypes,
  onToggleType,
}: {
  questionCount: number;
  onQuestionCountChange: (value: number) => void;
  difficulty: Difficulty;
  onDifficultyChange: (value: Difficulty) => void;
  activeTypes: QuestionType[];
  onToggleType: (value: QuestionType) => void;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-settings-3-line text-cyan-700" />
        생성 조건
      </h3>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-[12px] text-slate-500">
            <span>문항 수</span>
            <span>{questionCount}개</span>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={1}
            value={questionCount}
            onChange={(event) => onQuestionCountChange(Number(event.target.value))}
            className="w-full accent-cyan-600"
          />
        </div>

        <div>
          <div className="mb-2 text-[12px] text-slate-500">난이도</div>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((item) => {
              const active = difficulty === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onDifficultyChange(item)}
                  className={`rounded-2xl px-3 py-3 text-[12px] font-semibold transition ${
                    active ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-200 hover:text-cyan-700'
                  }`}
                >
                  {difficultyLabels[item]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[12px] text-slate-500">문항 유형</div>
          <div className="flex flex-wrap gap-2">
            {questionTypes.map((type) => {
              const active = activeTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                    active ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
