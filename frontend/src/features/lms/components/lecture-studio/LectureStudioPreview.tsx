import type { CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import {
  lectureStudioAssignmentLabel,
  lectureStudioAudienceLabel,
  lectureStudioModeLabel,
  lectureStudioQuizLabel,
  splitLectureStudioLines,
  type LectureStudioDraft,
} from './types';

type LectureStudioPreviewProps = {
  draft: LectureStudioDraft;
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  statusNote: string;
};

function formatLectureLabel(lecture: LectureDetail | Lecture | null): string {
  if (!lecture) {
    return '강의를 선택하면 미리보기가 갱신됩니다.';
  }

  const sessionLabel = lecture.session_number ?? lecture.order_index + 1;
  return `${lecture.week_number ?? 1}주차 · ${sessionLabel}차시`;
}

export function LectureStudioPreview({ draft, selectedCourse, highlightedLecture, statusNote }: LectureStudioPreviewProps) {
  const outlineItems = splitLectureStudioLines(draft.outlineText);
  const materialItems = splitLectureStudioLines(draft.materialsText);
  const activeLecture = highlightedLecture ?? selectedCourse?.lectures[0] ?? null;

  return (
    <aside className="space-y-5">
      <section className="sticky top-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <i className="ri-eye-line text-indigo-600" />
          실시간 미리보기
        </h3>

        <div className="mt-4 rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-200">Lecture Studio</div>
          <div className="mt-2 text-[22px] font-extrabold tracking-[-0.03em]">{draft.title}</div>
          <div className="mt-2 text-[13px] leading-6 text-slate-300">{draft.summary}</div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-white/10 px-2.5 py-1">{lectureStudioModeLabel(draft.deliveryMode)}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">{lectureStudioAudienceLabel(draft.audience)}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">{draft.classSize}명</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">운영 정보</div>
            <div className="mt-1 text-[13px] leading-6 text-slate-700">
              {draft.classroom} · {draft.onlineRoom}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">선택된 차시</div>
            <div className="mt-1 text-[13px] font-semibold text-slate-900">{activeLecture?.title ?? '선택된 차시 없음'}</div>
            <div className="mt-1 text-[12px] text-slate-500">{formatLectureLabel(activeLecture)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-900">제작 상태</div>
          <div className="mt-2 text-[12px] leading-6 text-slate-600">{statusNote}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-white px-3 py-3">
              <div className="text-[18px] font-extrabold text-slate-900">{outlineItems.length}</div>
              <div className="text-[11px] text-slate-500">목차</div>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <div className="text-[18px] font-extrabold text-slate-900">{materialItems.length}</div>
              <div className="text-[11px] text-slate-500">자료</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-900">핵심 설계</div>
          <div className="mt-3 grid gap-2 text-[12px] text-slate-600">
            <div>• 수강 인원 {draft.classSize}명</div>
            <div>• 과제 {lectureStudioAssignmentLabel(draft.assignmentMode)}</div>
            <div>• 과제 메모 {draft.assignmentNotes}</div>
            <div>• 시험 {draft.examMode === 'midterm-final' ? '중간/기말 평가' : draft.examMode === 'quiz-only' ? '퀴즈형 평가' : '시험 없음'}</div>
            <div>• 퀴즈 {lectureStudioQuizLabel(draft.quizMode)} / {draft.quizCount}문항</div>
            <div>• 출석 {draft.attendanceRequired ? '필수' : '선택'}</div>
            <div>• 녹화 {draft.recordingEnabled ? '허용' : '비허용'}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-900">연결 가능한 AI 작업</div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            {draft.aiSummaryEnabled ? <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">요약</span> : null}
            {draft.aiTimestampEnabled ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">타임스탬프</span> : null}
            {draft.aiShortformEnabled ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">숏폼 후보</span> : null}
          </div>
          <p className="mt-3 text-[12px] leading-6 text-slate-500">
            강의 제작 이후 전사, 요약 노트, 퀴즈, 숏폼 후보 생성으로 자연스럽게 이어질 수 있습니다.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="text-[14px] font-bold text-slate-900">목차 미리보기</h3>
        <div className="mt-4 space-y-2">
          {outlineItems.length > 0 ? (
            outlineItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-bold text-indigo-600 ring-1 ring-indigo-100">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-900">{item}</div>
                    <div className="mt-1 text-[12px] leading-6 text-slate-500">요약, 퀴즈, 숏폼과 연결할 기준 구간입니다.</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
              목차를 입력하면 우측에 바로 반영됩니다.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="text-[14px] font-bold text-slate-900">자료 미리보기</h3>
        <div className="mt-4 space-y-2">
          {materialItems.length > 0 ? (
            materialItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
              연결 자료를 입력하면 목록으로 보입니다.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="text-[14px] font-bold text-slate-900">발행 전 체크리스트</h3>
        <div className="mt-4 space-y-2 text-[12px] text-slate-600">
          <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-emerald-500" />수강 인원과 운영 방식을 확정</div>
          <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-emerald-500" />과제, 시험, 퀴즈 정책 정리</div>
          <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-emerald-500" />목차와 연결 자료 검토</div>
          <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-emerald-500" />요약 / 타임스탬프 / 숏폼 연계 확인</div>
          <div className="flex items-center gap-2"><i className="ri-time-line text-amber-500" />초안 저장 API는 다음 이슈에서 연결</div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-950 px-5 py-5 text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-200">Preview Note</div>
        <div className="mt-2 text-[14px] font-semibold">{draft.title}</div>
        <div className="mt-2 text-[12px] leading-6 text-slate-300">
          선택한 강의와 운영 옵션을 바탕으로 실제 강의 제작 UX를 먼저 완성해 두고, 저장/발행은 백엔드 API가 준비되는 대로 연결합니다.
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-white/10 px-2.5 py-1">{lectureStudioModeLabel(draft.deliveryMode)}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">{lectureStudioAudienceLabel(draft.audience)}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">{draft.quizCount}문항</span>
        </div>
      </section>
    </aside>
  );
}
