import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import { type LectureStudioDraft } from './types';
import { TogglePill, updateDraft } from './lectureStudioEditorControls';

type LectureStudioEditorCoreSectionsProps = {
  courseOptions: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  draft: LectureStudioDraft;
  statusNote: string;
  onChange: (draft: LectureStudioDraft) => void;
  onSelectCourse: (courseId: string) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};

function selectedLectureTitle(selectedCourse: CourseDetail | null, highlightedLecture: LectureDetail | Lecture | null): string {
  return highlightedLecture?.title ?? selectedCourse?.lectures[0]?.title ?? '강의를 선택하세요';
}

export function LectureStudioEditorCoreSections({
  courseOptions,
  selectedCourse,
  highlightedLecture,
  draft,
  statusNote,
  onChange,
  onSelectCourse,
  onSaveDraft,
  onMarkReady,
}: LectureStudioEditorCoreSectionsProps) {
  const selectedTitle = selectedLectureTitle(selectedCourse, highlightedLecture);

  return (
    <>
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
            <div className="mt-1 text-slate-500">선택한 강의: {selectedTitle}</div>
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
    </>
  );
}
