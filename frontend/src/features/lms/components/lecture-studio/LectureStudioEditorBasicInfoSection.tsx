import { ChoiceGrid, updateDraft } from './lectureStudioEditorControls';
import { audienceOptions, deliveryModes, paceOptions } from './lectureStudioEditorOptions';
import type { LectureStudioDraft } from './types';

type Props = {
  draft: LectureStudioDraft;
  onChange: (draft: LectureStudioDraft) => void;
};

export function LectureStudioEditorBasicInfoSection({ draft, onChange }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h3 className="text-[14px] font-bold text-slate-900">기본 정보</h3>
      <p className="mt-1 text-[12px] text-slate-500">제목, 카테고리, 대상, 난이도를 먼저 맞추면 이후 설정이 쉬워집니다.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">강의 제목</span>
          <input value={draft.title} onChange={(event) => updateDraft(draft, onChange, 'title', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">한 줄 소개</span>
          <input value={draft.subtitle} onChange={(event) => updateDraft(draft, onChange, 'subtitle', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">카테고리</span>
          <input value={draft.category} onChange={(event) => updateDraft(draft, onChange, 'category', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">난이도</span>
          <input value={draft.difficulty} onChange={(event) => updateDraft(draft, onChange, 'difficulty', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">학습 목표</span>
          <textarea value={draft.learningGoal} onChange={(event) => updateDraft(draft, onChange, 'learningGoal', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-7 text-slate-900 outline-none transition focus:border-indigo-400" />
        </label>
      </div>
      <div className="mt-4">
        <ChoiceGrid
          title="강의 형태"
          description="온라인, 오프라인, 혼합형 중에서 수업 운영 방식을 선택합니다."
          value={draft.deliveryMode}
          options={deliveryModes}
          onChange={(value) => updateDraft(draft, onChange, 'deliveryMode', value)}
        />
        <ChoiceGrid
          title="주차 구성"
          description="정규 주차형, 집중형, 자율형 중에서 강의 흐름을 선택합니다."
          value={draft.pace}
          options={paceOptions}
          onChange={(value) => updateDraft(draft, onChange, 'pace', value)}
        />
        <ChoiceGrid
          title="대상 수준"
          description="입문, 중급, 심화에 따라 퀴즈와 과제 난이도도 달라집니다."
          value={draft.audience}
          options={audienceOptions}
          onChange={(value) => updateDraft(draft, onChange, 'audience', value)}
        />
      </div>
    </article>
  );
}
