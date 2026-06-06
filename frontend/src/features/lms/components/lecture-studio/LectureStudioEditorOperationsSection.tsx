import { TogglePill, updateDraft } from './lectureStudioEditorControls';
import type { LectureStudioDraft } from './types';

type Props = {
  draft: LectureStudioDraft;
  onChange: (draft: LectureStudioDraft) => void;
};

export function LectureStudioEditorOperationsSection({ draft, onChange }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h3 className="text-[14px] font-bold text-slate-900">운영 방식</h3>
      <p className="mt-1 text-[12px] text-slate-500">수강 인원, 강의실, 온라인/오프라인, 진행 속도를 세밀하게 설정합니다.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">수강 인원</span>
          <input value={draft.classSize} onChange={(event) => updateDraft(draft, onChange, 'classSize', Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">강의실</span>
          <input value={draft.classroom} onChange={(event) => updateDraft(draft, onChange, 'classroom', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">온라인 링크</span>
          <input value={draft.onlineRoom} onChange={(event) => updateDraft(draft, onChange, 'onlineRoom', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">오피스아워</span>
          <input value={draft.officeHours} onChange={(event) => updateDraft(draft, onChange, 'officeHours', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400" />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TogglePill label="출석 체크" checked={draft.attendanceRequired} hint="강의 참여 여부를 관리합니다." onToggle={() => updateDraft(draft, onChange, 'attendanceRequired', !draft.attendanceRequired)} />
        <TogglePill label="강의 녹화" checked={draft.recordingEnabled} hint="후속 학습과 복습용 저장을 허용합니다." onToggle={() => updateDraft(draft, onChange, 'recordingEnabled', !draft.recordingEnabled)} />
      </div>
    </article>
  );
}
