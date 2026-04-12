import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, Lecture, LectureDetail, LectureStudioDraftSummary } from '@myway/shared';
import {
  createAudioExtractionDetailed,
  loadLectureStudioDraft,
  loadLectureStudioDrafts,
  publishLectureStudioDraft,
  saveLectureStudioDraft,
  updateLectureStudioDraft,
} from '../../../lib/api';
import { LectureStudioEditor } from '../components/lecture-studio/LectureStudioEditor';
import { LectureStudioPreview } from '../components/lecture-studio/LectureStudioPreview';
import {
  buildLectureStudioDraft,
  buildLectureStudioDraftFromRecord,
  toLectureStudioDraftInput,
  type LectureStudioDraft,
} from '../components/lecture-studio/types';

type LectureStudioPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  onSelectCourse: (courseId: string) => void;
};

export function LectureStudioPage({ courses, selectedCourse, highlightedLecture, onSelectCourse }: LectureStudioPageProps) {
  const [draft, setDraft] = useState<LectureStudioDraft>(() => buildLectureStudioDraft(selectedCourse, highlightedLecture));
  const [statusNote, setStatusNote] = useState('수강 인원, 강의실, 평가 방식, AI 보조 옵션을 단계적으로 채워보세요.');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSummaries, setDraftSummaries] = useState<LectureStudioDraftSummary[]>([]);

  const previewLecture = useMemo(() => highlightedLecture ?? selectedCourse?.lectures[0] ?? null, [highlightedLecture, selectedCourse]);
  const outlineCount = draft.outlineText.split(/\r?\n/).filter(Boolean).length;
  const materialCount = draft.materialsText.split(/\r?\n/).filter(Boolean).length;

  useEffect(() => {
    let alive = true;
    const baseDraft = buildLectureStudioDraft(selectedCourse, highlightedLecture);

    setDraft(baseDraft);
    setDraftId(null);

    if (!selectedCourse) {
      setDraftSummaries([]);
      setStatusNote('강의를 선택하면 세부 옵션이 자동으로 채워집니다.');
      return () => {
        alive = false;
      };
    }

    const lectureId = previewLecture?.id ?? selectedCourse.lectures[0]?.id ?? null;
    setStatusNote(`${selectedCourse.title} 기준 강의 제작 초안을 불러오는 중입니다.`);

    loadLectureStudioDrafts(selectedCourse.id).then(async (summaries) => {
      if (!alive) {
        return;
      }

      setDraftSummaries(summaries);

      const matchedSummary = lectureId ? summaries.find((item) => item.lecture_id === lectureId) ?? null : null;
      if (!matchedSummary) {
        setStatusNote(
          summaries.length > 0
            ? `${selectedCourse.title}에 초안 ${summaries.length}개가 있습니다. 새 초안을 바로 시작할 수 있습니다.`
            : `${selectedCourse.title} 기준 새 초안을 시작합니다.`,
        );
        return;
      }

      const record = await loadLectureStudioDraft(selectedCourse.id, matchedSummary.id);
      if (!alive || !record) {
        return;
      }

      setDraft(buildLectureStudioDraftFromRecord(record));
      setDraftId(record.id);
      setStatusNote(`${record.lecture_title} 초안을 불러왔습니다. 저장이나 발행 준비를 이어갈 수 있습니다.`);
    });

    return () => {
      alive = false;
    };
  }, [selectedCourse?.id, highlightedLecture?.id]);

  async function persistDraft() {
    if (!selectedCourse || !previewLecture) {
      setStatusNote('저장할 강의와 차시를 먼저 선택해 주세요.');
      return null;
    }

    const input = toLectureStudioDraftInput(draft, previewLecture.id);
    const record = draftId
      ? await updateLectureStudioDraft(selectedCourse, draftId, previewLecture, input)
      : await saveLectureStudioDraft(selectedCourse, previewLecture, input);

    if (!record) {
      setStatusNote('초안 저장에 실패했습니다. 다시 시도해 주세요.');
      return null;
    }

    setDraftId(record.id);
    setDraft(buildLectureStudioDraftFromRecord(record));
    return record;
  }

  async function startMediaPipelineAfterPublish(publishedTitle: string, lecture: LectureDetail | Lecture | null) {
    if (!lecture || !('video_url' in lecture) || !lecture.video_url) {
      setStatusNote(`${publishedTitle}은 발행 준비까지 완료했습니다. 영상 소스가 없어 미디어 파이프라인 자동 시작은 건너뜁니다.`);
      return;
    }

    setStatusNote(`${publishedTitle} 발행 후 영상 기반 미디어 파이프라인을 자동 시작합니다.`);

    const extraction = await createAudioExtractionDetailed(
      {
        lecture_id: lecture.id,
        video_url: lecture.video_url,
        source_file_name: `${lecture.title}.mp4`,
        source_content_type: 'video/mp4',
        language: 'ko',
      },
    );

    if (!extraction?.success) {
      setStatusNote(`${publishedTitle} 발행은 완료했지만 미디어 파이프라인 자동 시작은 실패했습니다. 제작 스튜디오에서 다시 시도할 수 있습니다.`);
      return;
    }

    setStatusNote(`${publishedTitle} 발행 후 미디어 파이프라인을 자동 시작했습니다.`);
  }

  const handleSaveDraft = () => {
    void (async () => {
      const record = await persistDraft();
      if (!record) {
        return;
      }

      setDraft((current) => ({ ...current, reviewState: 'review' }));
      setStatusNote(`${record.title} 초안을 저장하고 검토 상태로 전환했습니다.`);
    })();
  };

  const handleMarkReady = () => {
    void (async () => {
      const record = await persistDraft();
      if (!record) {
        return;
      }

      const published = await publishLectureStudioDraft(record.course_id, record.id);
      if (!published) {
        setStatusNote('발행 준비 상태로 전환하지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      setDraftId(published.id);
      setDraft(buildLectureStudioDraftFromRecord(published));
      setStatusNote(`${published.title} 초안을 발행 준비 상태로 전환했습니다.`);
      void startMediaPipelineAfterPublish(published.title, previewLecture);
    })();
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
              <div className="mt-1 text-slate-300">초안 {draftSummaries.length}개</div>
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
