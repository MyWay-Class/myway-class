import type { CourseCard, CourseDetail, Lecture, LectureDetail, LectureStudioDraft } from '@myway/shared';
import { LectureStudioEditor } from '../components/lecture-studio/LectureStudioEditor';
import { LectureStudioPreview } from '../components/lecture-studio/LectureStudioPreview';

type LectureStudioPageHeroProps = {
  selectedCourse: CourseDetail | null;
  draft: LectureStudioDraft;
  statusNote: string;
  draftCount: number;
  outlineCount: number;
  materialCount: number;
};

export function LectureStudioPageHero({
  selectedCourse,
  draft,
  statusNote,
  draftCount,
  outlineCount,
  materialCount,
}: LectureStudioPageHeroProps) {
  return (
    <section className="rounded-3xl border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Instructor Studio</div>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em]">강의 제작 스튜디오</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">
            수강 인원, 강의실, 온라인/오프라인, 과제, 시험, 퀴즈, AI 연계 옵션까지 한 화면에서 조정하는 강사 전용 제작 공간입니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">선택 강의</div>
            <div className="mt-1">{selectedCourse?.title ?? '강의 미선택'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">목차 / 자료</div>
            <div className="mt-1">
              {outlineCount}개 · {materialCount}개
            </div>
            <div className="mt-1 text-slate-300">초안 {draftCount}개</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">현재 상태</div>
            <div className="mt-1 capitalize">
              {draft.reviewState === 'ready' ? '발행 준비' : draft.reviewState === 'review' ? '검토 중' : '작성 중'}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">{statusNote}</div>
    </section>
  );
}

type LectureStudioPageWorkspaceProps = {
  courses: CourseCard[];
  activeCourse: CourseDetail;
  previewLecture: LectureDetail | Lecture | null;
  draft: LectureStudioDraft;
  statusNote: string;
  onChange: (draft: LectureStudioDraft) => void;
  onSelectCourse: (courseId: string) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
};

export function LectureStudioPageWorkspace({
  courses,
  activeCourse,
  previewLecture,
  draft,
  statusNote,
  onChange,
  onSelectCourse,
  onSaveDraft,
  onMarkReady,
}: LectureStudioPageWorkspaceProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <LectureStudioEditor
        courses={courses}
        selectedCourse={activeCourse}
        highlightedLecture={previewLecture}
        draft={draft}
        statusNote={statusNote}
        onChange={onChange}
        onSelectCourse={onSelectCourse}
        onSaveDraft={onSaveDraft}
        onMarkReady={onMarkReady}
      />
      <LectureStudioPreview draft={draft} selectedCourse={activeCourse} highlightedLecture={previewLecture} statusNote={statusNote} />
    </section>
  );
}
