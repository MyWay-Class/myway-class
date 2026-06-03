import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CourseCard, CourseDetail, Lecture, LectureDetail, LectureStudioDraftSummary } from '@myway/shared';
import {
  createAudioExtractionDetailed,
  loadLectureStudioDraft,
  loadLectureStudioDrafts,
  publishLectureStudioDraft,
  saveLectureStudioDraft,
  updateLectureStudioDraft,
} from '../../../lib/api';
import { queryKeys } from '../../../lib/query-keys';
import {
  buildLectureStudioDraft,
  buildLectureStudioDraftFromRecord,
  toLectureStudioDraftInput,
  type LectureStudioDraft,
} from '../components/lecture-studio/types';
import { demoCourseDetail, demoLectureDetail } from '../data/demo';
import { LectureStudioPageHero, LectureStudioPageWorkspace } from './LectureStudioPageSections';

type LectureStudioPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | Lecture | null;
  onSelectCourse: (courseId: string) => void;
};

export function LectureStudioPage({ courses, selectedCourse, highlightedLecture, onSelectCourse }: LectureStudioPageProps) {
  const queryClient = useQueryClient();
  const activeCourse = selectedCourse ?? demoCourseDetail;
  const activeLecture = highlightedLecture ?? demoLectureDetail;
  const demoMode = !selectedCourse;
  const [draft, setDraft] = useState<LectureStudioDraft>(() => buildLectureStudioDraft(activeCourse, activeLecture));
  const [statusNote, setStatusNote] = useState('수강 인원, 강의실, 평가 방식, AI 보조 옵션을 단계적으로 채워보세요.');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSummaries, setDraftSummaries] = useState<LectureStudioDraftSummary[]>([]);

  const previewLecture = useMemo(() => activeLecture ?? activeCourse.lectures[0] ?? null, [activeCourse, activeLecture]);
  const outlineCount = draft.outlineText.split(/\r?\n/).filter(Boolean).length;
  const materialCount = draft.materialsText.split(/\r?\n/).filter(Boolean).length;
  const selectedCourseId = selectedCourse?.id ?? '';

  const draftsQuery = useQuery({
    queryKey: queryKeys.learning.drafts(selectedCourseId),
    queryFn: () => loadLectureStudioDrafts(selectedCourseId),
    enabled: !demoMode && !!selectedCourseId,
  });

  const matchedSummary = useMemo(() => {
    if (demoMode || !selectedCourse) {
      return null;
    }
    const lectureId = previewLecture?.id ?? selectedCourse.lectures[0]?.id ?? null;
    if (!lectureId || !draftsQuery.data) {
      return null;
    }
    return draftsQuery.data.find((item) => item.lecture_id === lectureId) ?? null;
  }, [demoMode, draftsQuery.data, previewLecture?.id, selectedCourse]);

  const draftDetailQuery = useQuery({
    queryKey: queryKeys.learning.draftDetail(selectedCourseId, matchedSummary?.id ?? ''),
    queryFn: () => loadLectureStudioDraft(selectedCourseId, matchedSummary!.id),
    enabled: !demoMode && !!selectedCourseId && !!matchedSummary?.id,
  });

  useEffect(() => {
    if (demoMode) {
      setDraft(buildLectureStudioDraft(activeCourse, activeLecture));
      setDraftId(null);
      setDraftSummaries([]);
      setStatusNote('데모 데이터로 강의 제작 스튜디오를 미리 보여주고 있습니다. 실제 저장은 강의 선택 후 가능합니다.');
      return;
    }

    if (!selectedCourse) {
      return;
    }

    setDraft(buildLectureStudioDraft(selectedCourse, highlightedLecture));
    setDraftId(null);
    setStatusNote(`${selectedCourse.title} 기준 강의 제작 초안을 불러오는 중입니다.`);
  }, [activeCourse, activeLecture, demoMode, highlightedLecture, selectedCourse]);

  useEffect(() => {
    if (demoMode || !selectedCourse || draftsQuery.isLoading) {
      return;
    }

    const summaries = draftsQuery.data ?? [];
    setDraftSummaries(summaries);

    if (!matchedSummary) {
      setStatusNote(
        summaries.length > 0
          ? `${selectedCourse.title}에 초안 ${summaries.length}개가 있습니다. 새 초안을 바로 시작할 수 있습니다.`
          : `${selectedCourse.title} 기준 새 초안을 시작합니다.`,
      );
    }
  }, [demoMode, draftsQuery.data, draftsQuery.isLoading, matchedSummary, selectedCourse]);

  useEffect(() => {
    if (demoMode || !draftDetailQuery.data) {
      return;
    }
    const record = draftDetailQuery.data;
    setDraft(buildLectureStudioDraftFromRecord(record));
    setDraftId(record.id);
    setStatusNote(`${record.lecture_title} 초안을 불러왔습니다. 저장이나 발행 준비를 이어갈 수 있습니다.`);
  }, [demoMode, draftDetailQuery.data]);

  async function persistDraft() {
    if (demoMode || !selectedCourse || !previewLecture) {
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

  const publishDraftMutation = useMutation({
    mutationFn: ({ courseId, targetDraftId }: { courseId: string; targetDraftId: string }) =>
      publishLectureStudioDraft(courseId, targetDraftId),
  });

  const handleMarkReady = () => {
    void (async () => {
      const record = await persistDraft();
      if (!record) {
        return;
      }

      const published = await publishDraftMutation.mutateAsync({ courseId: record.course_id, targetDraftId: record.id });
      if (!published) {
        setStatusNote('발행 준비 상태로 전환하지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      setDraftId(published.id);
      setDraft(buildLectureStudioDraftFromRecord(published));
      await queryClient.invalidateQueries({ queryKey: queryKeys.learning.drafts(record.course_id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.learning.draftDetail(record.course_id, published.id) });
      setStatusNote(`${published.title} 초안을 발행 준비 상태로 전환했습니다.`);
      void startMediaPipelineAfterPublish(published.title, previewLecture);
    })();
  };

  return (
    <div className="space-y-5">
      <LectureStudioPageHero
        selectedCourse={selectedCourse}
        draft={draft}
        statusNote={statusNote}
        draftCount={draftSummaries.length}
        outlineCount={outlineCount}
        materialCount={materialCount}
      />

      <LectureStudioPageWorkspace
        courses={courses.length > 0 ? courses : [demoCourseDetail]}
        activeCourse={activeCourse}
        previewLecture={previewLecture}
        draft={draft}
        statusNote={statusNote}
        onChange={setDraft}
        onSelectCourse={onSelectCourse}
        onSaveDraft={handleSaveDraft}
        onMarkReady={handleMarkReady}
      />
    </div>
  );
}
