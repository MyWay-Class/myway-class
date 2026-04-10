import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, Lecture, LectureDetail } from '@myway/shared';
import { LectureStudioEditor } from '../components/lecture-studio/LectureStudioEditor';
import { LectureStudioPreview } from '../components/lecture-studio/LectureStudioPreview';
import { buildLectureStudioDraft, type LectureStudioDraft } from '../components/lecture-studio/types';

type LectureStudioPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  onSelectCourse: (courseId: string) => void;
};

export function LectureStudioPage({ courses, selectedCourse, highlightedLecture, onSelectCourse }: LectureStudioPageProps) {
  const [draft, setDraft] = useState<LectureStudioDraft>(() => buildLectureStudioDraft(selectedCourse, highlightedLecture));
  const [statusNote, setStatusNote] = useState('수강 인원, 강의실, 평가 방식, AI 보조 옵션을 단계적으로 채워보세요.');

  useEffect(() => {
    setDraft(buildLectureStudioDraft(selectedCourse, highlightedLecture));
    setStatusNote(selectedCourse ? `${selectedCourse.title} 기준 강의 제작 초안을 불러왔습니다.` : '강의를 선택하면 세부 옵션이 자동으로 채워집니다.');
  }, [selectedCourse?.id, highlightedLecture?.id]);

  const previewLecture = useMemo(() => highlightedLecture ?? selectedCourse?.lectures[0] ?? null, [highlightedLecture, selectedCourse]);
  const outlineCount = draft.outlineText.split(/\r?\n/).filter(Boolean).length;
  const materialCount = draft.materialsText.split(/\r?\n/).filter(Boolean).length;

  const handleSaveDraft = () => {
    setDraft((current) => ({ ...current, reviewState: 'review' }));
    setStatusNote('초안 저장 검토 상태로 전환했습니다. 실제 저장 API는 다음 이슈에서 연결됩니다.');
  };

  const handleMarkReady = () => {
    setDraft((current) => ({ ...current, reviewState: 'ready' }));
    setStatusNote('발행 준비 상태로 전환했습니다. 공개 전 검수 항목을 다시 확인해 주세요.');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-200">Instructor Studio</div>
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
              <div className="mt-1">{outlineCount}개 · {materialCount}개</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 상태</div>
              <div className="mt-1 capitalize">{draft.reviewState === 'ready' ? '발행 준비' : draft.reviewState === 'review' ? '검토 중' : '작성 중'}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">
          {statusNote}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <LectureStudioEditor
          courses={courses}
          selectedCourse={selectedCourse}
          highlightedLecture={previewLecture}
          draft={draft}
          statusNote={statusNote}
          onChange={setDraft}
          onSelectCourse={onSelectCourse}
          onSaveDraft={handleSaveDraft}
          onMarkReady={handleMarkReady}
        />
        <LectureStudioPreview
          draft={draft}
          selectedCourse={selectedCourse}
          highlightedLecture={previewLecture}
          statusNote={statusNote}
        />
      </section>
    </div>
  );
}
