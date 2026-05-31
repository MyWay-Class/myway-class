import {
  lectureStudioAssignmentLabel,
  lectureStudioAudienceLabel,
  lectureStudioModeLabel,
  lectureStudioQuizLabel,
  type LectureStudioDraft,
} from './types';
import { TogglePill, updateDraft } from './lectureStudioEditorControls';

type LectureStudioEditorContentActionsProps = {
  draft: LectureStudioDraft;
  outlineCount: number;
  materialCount: number;
  onChange: (draft: LectureStudioDraft) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};

export function LectureStudioEditorContentActions({
  draft,
  outlineCount,
  materialCount,
  onChange,
  onSaveDraft,
  onMarkReady,
}: LectureStudioEditorContentActionsProps) {
  return (
    <>
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-[14px] font-bold text-slate-900">목차와 자료</h3>
          <p className="mt-1 text-[12px] text-slate-500">줄바꿈 단위로 입력하면 차시별 목차와 연결 자료를 바로 정리할 수 있습니다.</p>

          <div className="mt-4 space-y-4">
            <label className="space-y-2">
              <span className="text-[12px] font-semibold text-slate-700">목차</span>
              <textarea value={draft.outlineText} onChange={(event) => updateDraft(draft, onChange, 'outlineText', event.target.value)} rows={7} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-7 text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
            <label className="space-y-2">
              <span className="text-[12px] font-semibold text-slate-700">연결 자료</span>
              <textarea value={draft.materialsText} onChange={(event) => updateDraft(draft, onChange, 'materialsText', event.target.value)} rows={6} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-7 text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-[14px] font-bold text-slate-900">AI 보조 옵션</h3>
          <p className="mt-1 text-[12px] text-slate-500">요약, 타임스탬프, 숏폼 후보를 자동으로 준비할지 선택합니다.</p>

          <div className="mt-4 grid gap-3">
            <TogglePill label="AI 강의 요약" checked={draft.aiSummaryEnabled} hint="강의 전체 설명을 자동으로 정리합니다." onToggle={() => updateDraft(draft, onChange, 'aiSummaryEnabled', !draft.aiSummaryEnabled)} />
            <TogglePill label="타임스탬프 자동 생성" checked={draft.aiTimestampEnabled} hint="전사 기반 구간 표시를 빠르게 만듭니다." onToggle={() => updateDraft(draft, onChange, 'aiTimestampEnabled', !draft.aiTimestampEnabled)} />
            <TogglePill label="숏폼 후보 연동" checked={draft.aiShortformEnabled} hint="하이라이트 구간을 숏폼 후보로 연결합니다." onToggle={() => updateDraft(draft, onChange, 'aiShortformEnabled', !draft.aiShortformEnabled)} />
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-[12px] leading-6 text-slate-500">
            <div className="font-semibold text-slate-900">제작 연결 상태</div>
            <ul className="mt-2 space-y-1">
              <li>• 목차 {outlineCount}개</li>
              <li>• 자료 {materialCount}개</li>
              <li>• 과제 {lectureStudioAssignmentLabel(draft.assignmentMode)}</li>
              <li>• 시험 {draft.examMode === 'midterm-final' ? '중간/기말 평가' : draft.examMode === 'quiz-only' ? '퀴즈형 평가' : '시험 없음'}</li>
              <li>• 퀴즈 {lectureStudioQuizLabel(draft.quizMode)}</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">최종 행동</h3>
            <p className="mt-1 text-[12px] text-slate-500">저장, 검토, 발행 준비를 한 번에 맞추는 버튼입니다. 실제 저장 API는 다음 이슈에서 연결합니다.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {lectureStudioModeLabel(draft.deliveryMode)} · {lectureStudioAudienceLabel(draft.audience)} · {draft.classSize}명
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onSaveDraft} className="rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-indigo-500">
            초안 저장
          </button>
          <button type="button" onClick={onMarkReady} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            검토 완료
          </button>
          <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            발행 준비
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-4 text-[12px] leading-6 text-indigo-900">
          <div className="font-semibold">연결 예정</div>
          <div className="mt-1 text-indigo-700">
            이 화면은 강의 제작 중심의 UI를 먼저 완성해 두고, 초안 저장과 발행 API는 별도 이슈(#133)에서 이어 붙입니다.
          </div>
        </div>
      </section>
    </>
  );
}
