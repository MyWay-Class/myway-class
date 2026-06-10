import { useEffect, useMemo, useState } from 'react';
import {
  type CourseCard,
  type CourseDetail,
  type LectureDetail,
  type ShortformCommunityItem,
  type ShortformExtractionDetail,
  type ShortformVideo,
} from '@myway/shared';
import { loadCourseDetail, loadLectureTranscriptDetailed } from '../../../lib/api';
import { generateShortformExtractionDraft, loadShortformCommunity, loadShortformVideoDraft } from '../../../lib/api-shortforms';
import { resolvePlayableVideoUrl } from '../../../lib/video-url';
import type { ClipSuggestion, WizardStep } from './ShortformWizardTypes';
import { clipKey, formatDuration, type TranscriptSnapshot } from './shortformWizardUtils';
import { useShortformWizardActions } from './useShortformWizardActions';

type UseShortformWizardStateParams = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

export function useShortformWizardState({ highlightedLecture, selectedCourse, courses, sessionToken }: UseShortformWizardStateParams) {
  const [step, setStep] = useState<WizardStep>(1);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(selectedCourse?.id ?? courses[0]?.id ?? null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(selectedCourse);
  const [lectureFilter, setLectureFilter] = useState<string>(highlightedLecture?.id ?? 'all');
  const [selectedClips, setSelectedClips] = useState<ClipSuggestion[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('핵심 구간을 이어 붙여 학습용 숏폼으로 정리합니다.');
  const [status, setStatus] = useState('아직 조립된 숏폼이 없습니다.');
  const [createdVideo, setCreatedVideo] = useState<ShortformVideo | null>(null);
  const [communityItems, setCommunityItems] = useState<ShortformCommunityItem[]>([]);
  const [transcriptMap, setTranscriptMap] = useState<Record<string, TranscriptSnapshot>>({});
  const [extractionDraft, setExtractionDraft] = useState<ShortformExtractionDetail | null>(null);

  const courseLectures = Array.isArray(courseDetail?.lectures) ? courseDetail.lectures : [];

  useEffect(() => {
    if (selectedCourse?.id) {
      setActiveCourseId(selectedCourse.id);
      setCourseDetail(selectedCourse);
    }
  }, [selectedCourse?.id, selectedCourse]);

  useEffect(() => {
    setLectureFilter(highlightedLecture?.id ?? 'all');
  }, [activeCourseId, highlightedLecture?.id]);

  useEffect(() => {
    setSelectedClips([]);
    setLectureFilter('all');
    setCreatedVideo(null);
    setExtractionDraft(null);
    setStatus('아직 조립된 숏폼이 없습니다.');
    setStep(1);
  }, [activeCourseId]);

  useEffect(() => {
    let alive = true;
    if (!activeCourseId) {
      setCourseDetail(null);
      return undefined;
    }
    if (selectedCourse?.id === activeCourseId) {
      setCourseDetail(selectedCourse);
      return undefined;
    }
    loadCourseDetail(activeCourseId, sessionToken).then((detail) => {
      if (alive) setCourseDetail(detail);
    });
    return () => {
      alive = false;
    };
  }, [activeCourseId, selectedCourse, sessionToken]);

  useEffect(() => {
    let alive = true;
    if (courseLectures.length === 0) {
      setTranscriptMap({});
      return undefined;
    }
    Promise.all(
      courseLectures.map(async (lecture) => {
        const transcript = await loadLectureTranscriptDetailed(lecture.id, sessionToken);
        return [
          lecture.id,
          transcript
            ? {
                chunks: transcript.segments ?? [],
                duration_ms: transcript.duration_ms,
              }
            : null,
        ] as const;
      }),
    ).then((entries) => {
      if (alive) setTranscriptMap(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [courseDetail?.id, courseLectures, sessionToken]);

  useEffect(() => {
    let alive = true;
    loadShortformCommunity(activeCourseId, sessionToken).then((items) => {
      if (alive) setCommunityItems((Array.isArray(items) ? items : []).slice(0, 4));
    });
    return () => {
      alive = false;
    };
  }, [activeCourseId, sessionToken]);

  useEffect(() => {
    let active = true;
    if (!createdVideo?.id || createdVideo.export_status === 'COMPLETED' || createdVideo.export_status === 'FAILED') return undefined;
    const timer = window.setInterval(async () => {
      const updated = await loadShortformVideoDraft(createdVideo.id, sessionToken);
      if (active && updated) setCreatedVideo(updated as ShortformVideo);
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [createdVideo?.export_status, createdVideo?.id, sessionToken]);

  useEffect(() => {
    let alive = true;
    if (!courseDetail?.id || courseLectures.length === 0) {
      setExtractionDraft(null);
      return undefined;
    }

    const transcriptSegmentsByLecture = Object.fromEntries(
      Object.entries(transcriptMap)
        .filter(([, snapshot]) => Boolean(snapshot?.chunks?.length))
        .map(([lectureId, snapshot]) => [
          lectureId,
          (snapshot?.chunks ?? []).map((segment) => ({
            lecture_id: lectureId,
            transcript_id: segment.transcript_id ?? undefined,
            start_ms: segment.start_ms,
            end_ms: segment.end_ms,
            text: segment.text,
            confidence: segment.confidence,
            speaker: segment.speaker ?? null,
            topic_tags: segment.topic_tags ?? [],
            chunk_index: segment.chunk_index ?? segment.index,
            index: segment.index ?? segment.chunk_index,
          })),
        ]),
    );

    if (Object.keys(transcriptSegmentsByLecture).length === 0) {
      setExtractionDraft(null);
      return undefined;
    }

    generateShortformExtractionDraft(
      {
        course_id: courseDetail.id,
        mode: 'cross',
        transcript_chunks_by_lecture: transcriptSegmentsByLecture,
        transcript_segments_by_lecture: transcriptSegmentsByLecture,
      },
      sessionToken,
    ).then((result) => {
      if (alive) setExtractionDraft(result);
    });

    return () => {
      alive = false;
    };
  }, [courseDetail?.id, courseLectures.length, transcriptMap, sessionToken]);

  const clipSuggestions = useMemo(
    () => extractionDraft?.candidates ?? [],
    [extractionDraft],
  );
  const lectureTabs = useMemo(() => {
    if (!courseDetail) return [];
    return courseLectures.map((lecture, index) => ({
      id: lecture.id,
      title: lecture.title,
      label: `${lecture.week_number ?? 1}주차 · ${lecture.session_number ?? index + 1}차시`,
    }));
  }, [courseLectures, courseDetail]);
  const filteredSuggestions = useMemo(
    () => (lectureFilter === 'all' ? clipSuggestions : clipSuggestions.filter((clip) => clip.lecture_id === lectureFilter)),
    [clipSuggestions, lectureFilter],
  );
  const selectedClipKeys = useMemo(() => selectedClips.map((clip) => clipKey(clip)), [selectedClips]);
  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);
  const totalDurationLabel = formatDuration(totalDurationMs);
  const stepLabel = step === 1 ? '강좌 선택' : step === 2 ? '구간 선택' : '미리보기 / 저장';
  const previewVideoUrl =
    resolvePlayableVideoUrl(createdVideo?.export_result_url ?? undefined) ??
    (createdVideo?.video_url && !createdVideo.video_url.startsWith('/static/shortforms/') ? resolvePlayableVideoUrl(createdVideo.video_url) : null);

  const { handleCompose, handleShare, toggleClip, removeClip, updateClipTimes } = useShortformWizardActions({
    courseDetail,
    extractionId: extractionDraft?.extraction.id ?? null,
    selectedClips,
    title,
    description,
    sessionToken,
    createdVideo,
    setStatus,
    setCreatedVideo,
    setCommunityItems,
    setStep,
    setSelectedClips,
  });

  return {
    step,
    setStep,
    activeCourseId,
    setActiveCourseId,
    courseDetail,
    lectureFilter,
    setLectureFilter,
    selectedClips,
    title,
    setTitle,
    description,
    setDescription,
    status,
    createdVideo,
    communityItems,
    extractionDraft,
    courseLectures,
    clipSuggestions,
    lectureTabs,
    filteredSuggestions,
    selectedClipKeys,
    totalDurationLabel,
    stepLabel,
    previewVideoUrl,
    formatDuration,
    handleCompose,
    handleShare,
    toggleClip,
    removeClip,
    updateClipTimes,
  };
}
