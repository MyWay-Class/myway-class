import { ChoiceGrid, updateDraft } from './lectureStudioEditorControls';
import { assignmentModes, examModes, quizModes } from './lectureStudioEditorOptions';
import type { LectureStudioDraft, LectureStudioQuizMode } from './types';

type Props = {
  draft: LectureStudioDraft;
  onChange: (draft: LectureStudioDraft) => void;
};

export function LectureStudioEditorAssessmentSection({ draft, onChange }: Props) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <ChoiceGrid
          title="과제 설계"
          description="과제 없음, 가벼운 과제, 프로젝트형 과제 중에서 선택합니다."
          value={draft.assignmentMode}
          options={assignmentModes}
          onChange={(value) => updateDraft(draft, onChange, 'assignmentMode', value)}
        />
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <ChoiceGrid
          title="시험 설정"
          description="퀴즈형 시험이나 중간/기말 평가를 선택합니다."
          value={draft.examMode}
          options={examModes}
          onChange={(value) => updateDraft(draft, onChange, 'examMode', value)}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[12px] font-semibold text-slate-700">퀴즈 방식</span>
            <select value={draft.quizMode} onChange={(event) => updateDraft(draft, onChange, 'quizMode', event.target.value as LectureStudioQuizMode)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400">
              {quizModes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[12px] font-semibold text-slate-700">퀴즈 개수</span>
            <input type="number" min={0} max={20} value={draft.quizCount} onChange={(event) => updateDraft(draft, onChange, 'quizCount', Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
          </label>
          <label className="space-y-2">
            <span className="text-[12px] font-semibold text-slate-700">퀴즈 난이도</span>
            <input value={draft.quizDifficulty} onChange={(event) => updateDraft(draft, onChange, 'quizDifficulty', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
          </label>
          <label className="space-y-2">
            <span className="text-[12px] font-semibold text-slate-700">평가 범위</span>
            <input value={draft.examScope} onChange={(event) => updateDraft(draft, onChange, 'examScope', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
          </label>
        </div>
      </article>
    </section>
  );
}
