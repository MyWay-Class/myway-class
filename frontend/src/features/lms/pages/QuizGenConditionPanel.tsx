export type QuestionType = '객관식' | '단답형' | '서술형' | '빈칸';

export const questionTypes: QuestionType[] = ['객관식', '단답형', '서술형', '빈칸'];

export const difficultyLabels: Record<import('./QuizGenHeroSection').Difficulty, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

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
  difficulty: import('./QuizGenHeroSection').Difficulty;
  onDifficultyChange: (value: import('./QuizGenHeroSection').Difficulty) => void;
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
            {(['beginner', 'intermediate', 'advanced'] as import('./QuizGenHeroSection').Difficulty[]).map((item) => {
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
