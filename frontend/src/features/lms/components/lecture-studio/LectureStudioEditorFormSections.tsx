import { type LectureStudioDraft, type LectureStudioQuizMode } from './types';
import { ChoiceGrid, TogglePill, updateDraft } from './lectureStudioEditorControls';
import { assignmentModes, audienceOptions, deliveryModes, examModes, paceOptions, quizModes } from './lectureStudioEditorOptions';

type LectureStudioEditorFormSectionsProps = {
  draft: LectureStudioDraft;
  onChange: (draft: LectureStudioDraft) => void;
};

export function LectureStudioEditorFormSections({ draft, onChange }: LectureStudioEditorFormSectionsProps) {
  return (
    <>
      <section className="grid gap-5 xl:grid-cols-2">
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
            <label className="space-y-2 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">강의 소개</span>
              <textarea value={draft.summary} onChange={(event) => updateDraft(draft, onChange, 'summary', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-7 text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">선수 지식</span>
              <input value={draft.prerequisites} onChange={(event) => updateDraft(draft, onChange, 'prerequisites', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-[14px] font-bold text-slate-900">운영 방식</h3>
          <p className="mt-1 text-[12px] text-slate-500">수강 인원, 강의실, 온라인/오프라인, 진행 속도를 세밀하게 설정합니다.</p>

          <div className="mt-4 space-y-5">
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

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-700">수강 인원</span>
                <select value={String(draft.classSize)} onChange={(event) => updateDraft(draft, onChange, 'classSize', Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400">
                  {[
                    [24, '24명 내외'],
                    [30, '30명'],
                    [50, '50명'],
                    [80, '80명'],
                    [120, '120명'],
                    [200, '200명 이상'],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-700">강의실</span>
                <input value={draft.classroom} onChange={(event) => updateDraft(draft, onChange, 'classroom', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-700">온라인 링크</span>
                <input value={draft.onlineRoom} onChange={(event) => updateDraft(draft, onChange, 'onlineRoom', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-semibold text-slate-700">오피스아워</span>
                <input value={draft.officeHours} onChange={(event) => updateDraft(draft, onChange, 'officeHours', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TogglePill label="출석 체크" checked={draft.attendanceRequired} hint="강의 참여 여부를 관리합니다." onToggle={() => updateDraft(draft, onChange, 'attendanceRequired', !draft.attendanceRequired)} />
              <TogglePill label="강의 녹화" checked={draft.recordingEnabled} hint="후속 학습과 복습용 저장을 허용합니다." onToggle={() => updateDraft(draft, onChange, 'recordingEnabled', !draft.recordingEnabled)} />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <ChoiceGrid
            title="과제 설계"
            description="과제 없음, 가벼운 과제, 프로젝트형 과제 중에서 선택합니다."
            value={draft.assignmentMode}
            options={assignmentModes}
            onChange={(value) => updateDraft(draft, onChange, 'assignmentMode', value)}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[12px] font-semibold text-slate-700">과제 비중(%)</span>
              <input type="number" min={0} max={100} value={draft.assignmentWeight} onChange={(event) => updateDraft(draft, onChange, 'assignmentWeight', Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
            <label className="space-y-2">
              <span className="text-[12px] font-semibold text-slate-700">과제 마감 기준</span>
              <input value={draft.assignmentDue} onChange={(event) => updateDraft(draft, onChange, 'assignmentDue', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">과제 설명</span>
              <textarea value={draft.assignmentNotes} onChange={(event) => updateDraft(draft, onChange, 'assignmentNotes', event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-7 text-slate-900 outline-none transition focus:border-indigo-400" />
            </label>
          </div>
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
    </>
  );
}
