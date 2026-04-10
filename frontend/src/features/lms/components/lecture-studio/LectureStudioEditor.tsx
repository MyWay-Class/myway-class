import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import {
  lectureStudioAssignmentLabel,
  lectureStudioAudienceLabel,
  lectureStudioModeLabel,
  lectureStudioQuizLabel,
  type LectureStudioAssignmentMode,
  type LectureStudioAudience,
  type LectureStudioDeliveryMode,
  type LectureStudioDraft,
  type LectureStudioExamMode,
  type LectureStudioPace,
  type LectureStudioQuizMode,
} from './types';

type LectureStudioEditorProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  draft: LectureStudioDraft;
  statusNote: string;
  onChange: (draft: LectureStudioDraft) => void;
  onSelectCourse: (courseId: string) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};

const deliveryModes: Array<{ value: LectureStudioDeliveryMode; label: string; hint: string }> = [
  { value: 'online', label: '온라인', hint: '화상 강의 중심' },
  { value: 'offline', label: '오프라인', hint: '교실 운영' },
  { value: 'hybrid', label: '혼합형', hint: '온라인 + 오프라인 병행' },
];

const audienceOptions: Array<{ value: LectureStudioAudience; label: string; hint: string }> = [
  { value: 'beginner', label: '입문', hint: '기초 개념 중심' },
  { value: 'intermediate', label: '중급', hint: '실습과 응용 포함' },
  { value: 'advanced', label: '심화', hint: '프로젝트와 토론 중심' },
];

const paceOptions: Array<{ value: LectureStudioPace; label: string; hint: string }> = [
  { value: 'weekly', label: '주차형', hint: '정규 커리큘럼' },
  { value: 'bootcamp', label: '집중형', hint: '짧고 빠른 몰입형' },
  { value: 'self-paced', label: '자율형', hint: '개별 진도 허용' },
];

const assignmentModes: Array<{ value: LectureStudioAssignmentMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '과제 없이 운영' },
  { value: 'light', label: '가벼운 과제', hint: '복습용 제출' },
  { value: 'project', label: '프로젝트형', hint: '결과물 중심' },
];

const examModes: Array<{ value: LectureStudioExamMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '시험 미운영' },
  { value: 'quiz-only', label: '퀴즈형', hint: '중간 점검 중심' },
  { value: 'midterm-final', label: '중간/기말', hint: '정식 평가 운영' },
];

const quizModes: Array<{ value: LectureStudioQuizMode; label: string; hint: string }> = [
  { value: 'none', label: '없음', hint: '퀴즈 미운영' },
  { value: 'manual', label: '수동', hint: '직접 작성' },
  { value: 'auto', label: '자동', hint: 'AI가 생성' },
  { value: 'mixed', label: '혼합', hint: '수동 + 자동 병행' },
];

function updateDraft<K extends keyof LectureStudioDraft>(draft: LectureStudioDraft, onChange: (next: LectureStudioDraft) => void, key: K, value: LectureStudioDraft[K]) {
  onChange({ ...draft, [key]: value });
}

type ChoiceGridProps<T extends string> = {
  title: string;
  description: string;
  value: T;
  options: Array<{ value: T; label: string; hint: string }>;
  onChange: (value: T) => void;
};

function ChoiceGrid<T extends string>({ title, description, value, options, onChange }: ChoiceGridProps<T>) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-[12px] leading-6 text-slate-500">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
                active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{option.label}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{option.hint}</div>
                </div>
                {active ? <i className="ri-checkbox-circle-fill text-[18px] text-indigo-600" /> : <i className="ri-checkbox-blank-circle-line text-[18px] text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TogglePill({
  label,
  checked,
  hint,
  onToggle,
}: {
  label: string;
  checked: boolean;
  hint: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
        checked ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="mt-1 text-[12px] leading-6 opacity-80">{hint}</div>
      </div>
      <div className={`flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

export function LectureStudioEditor({
  courses,
  selectedCourse,
  highlightedLecture,
  draft,
  statusNote,
  onChange,
  onSelectCourse,
  onSaveDraft,
  onMarkReady,
}: LectureStudioEditorProps) {
  const courseOptions = courses.slice(0, 6);
  const outlineCount = draft.outlineText.split(/\r?\n/).filter(Boolean).length;
  const materialCount = draft.materialsText.split(/\r?\n/).filter(Boolean).length;
  const selectedLectureTitle = highlightedLecture?.title ?? selectedCourse?.lectures[0]?.title ?? '강의를 선택하세요';

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">강의 선택</h2>
            <p className="mt-1 text-[12px] text-slate-500">기존 강의 구조를 기반으로 강의 제작 초안을 시작합니다.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
            {selectedCourse?.title ?? '강의 미선택'}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courseOptions.map((course) => {
            const active = selectedCourse?.id === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
                className={`rounded-3xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
                  active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">{course.title}</div>
                    <div className="mt-1 text-[12px] text-slate-500">
                      {course.category} · {course.instructor_name}
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">{course.difficulty}</span>
                </div>
                <div className="mt-3 text-[12px] leading-6 text-slate-500">
                  {course.lecture_count}차시 · {course.total_duration_minutes}분 · 진도 {course.progress_percent}%
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">제작 상태</h2>
            <p className="mt-1 text-[12px] text-slate-500">상태를 바꾸면 발행 준비, 검토 중, 초안 작성 단계가 한눈에 보입니다.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-600">
            <div className="font-semibold text-slate-900">{statusNote}</div>
            <div className="mt-1 text-slate-500">선택한 강의: {selectedLectureTitle}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <TogglePill
            label="초안 저장 모드"
            checked={draft.reviewState !== 'draft'}
            hint="현재 화면 구성과 옵션을 검토용으로 유지합니다."
            onToggle={onSaveDraft}
          />
          <TogglePill
            label="발행 준비"
            checked={draft.reviewState === 'ready'}
            hint="발행 직전 체크리스트까지 마친 상태입니다."
            onToggle={onMarkReady}
          />
          <TogglePill
            label="제작 체크 강화"
            checked={draft.recordingEnabled}
            hint="강의 녹화, 요약, 퀴즈 연계를 함께 고려합니다."
            onToggle={() => updateDraft(draft, onChange, 'recordingEnabled', !draft.recordingEnabled)}
          />
        </div>
      </section>

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
    </div>
  );
}
