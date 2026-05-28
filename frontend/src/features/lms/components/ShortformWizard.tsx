import { useEffect, useMemo, useState } from 'react';
import { type CourseCard, type CourseDetail, type LectureDetail, type ShortformCommunityItem, type ShortformVideo } from '@myway/shared';
import { loadCourseDetail, loadLectureTranscriptDetailed } from '../../../lib/api';
import {
  composeShortformDraft,
  loadShortformCommunity,
  loadShortformVideoDraft,
  shareShortformDraft,
} from '../../../lib/api-shortforms';
import { ShortformWizardSidebar } from './ShortformWizardSidebar';
import { ShortformWizardStep1 } from './ShortformWizardStep1';
import { ShortformWizardStep2 } from './ShortformWizardStep2';
import { ShortformWizardStep3 } from './ShortformWizardStep3';
import { resolvePlayableVideoUrl } from '../../../lib/video-url';
import type { ClipSuggestion, WizardStep } from './ShortformWizardTypes';
import { buildClipSuggestions, clipKey, formatDuration, mapComposeError, MAX_CLIP_MS, MIN_CLIP_MS, type TranscriptSnapshot } from './shortformWizardUtils';

type ShortformWizardProps = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

export function ShortformWizard({ highlightedLecture, selectedCourse, courses, sessionToken }: ShortformWizardProps) {
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
        return [lecture.id, transcript ? { segments: transcript.segments ?? [], duration_ms: transcript.duration_ms } : null] as const;
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

  const clipSuggestions = useMemo(() => buildClipSuggestions(courseDetail, transcriptMap), [courseDetail, transcriptMap]);
  const lectureTabs = useMemo(() => {
    if (!courseDetail) return [];
    return courseLectures.map((lecture, index) => ({
      id: lecture.id,
      title: lecture.title,
      label: `${lecture.week_number ?? 1}주차 · ${lecture.session_number ?? index + 1}차시`,
    }));
  }, [courseLectures, courseDetail]);

  const filteredSuggestions = useMemo(() => lectureFilter === 'all' ? clipSuggestions : clipSuggestions.filter((clip) => clip.lecture_id === lectureFilter), [clipSuggestions, lectureFilter]);
  const selectedClipKeys = useMemo(() => selectedClips.map((clip) => clipKey(clip)), [selectedClips]);
  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);
  const totalDurationLabel = formatDuration(totalDurationMs);
  const stepLabel = step === 1 ? '강좌 선택' : step === 2 ? '구간 선택' : '미리보기 / 저장';
  const previewVideoUrl =
    resolvePlayableVideoUrl(createdVideo?.export_result_url ?? undefined) ??
    (createdVideo?.video_url && !createdVideo.video_url.startsWith('/static/shortforms/') ? resolvePlayableVideoUrl(createdVideo.video_url) : null);

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

  async function handleCompose() {
    if (!courseDetail || selectedClips.length === 0) {
      setStatus('조립할 강의와 클립이 필요합니다.');
      return;
    }
    setStatus('선택한 구간으로 숏폼을 생성하는 중입니다.');
    const result = await composeShortformDraft({
      course_id: courseDetail.id,
      title: title.trim() || `${courseDetail.title} 숏폼`,
      description,
      clips: selectedClips.map((clip) => ({ lecture_id: clip.lecture_id, start_ms: clip.start_time_ms, end_ms: clip.end_time_ms })),
    }, sessionToken);

    if (!result.video) {
      setStatus(mapComposeError(result.errorCode, result.errorMessage));
      return;
    }
    const video = result.video;
    setCreatedVideo(video);
    setStatus(video.export_status === 'COMPLETED' || video.export_result_url ? '숏폼이 생성되어 재생 가능합니다.' : '숏폼이 생성되었고 export를 처리 중입니다.');
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems((Array.isArray(refreshed) ? refreshed : []).slice(0, 4));
    setStep(3);
  }

  async function handleShare() {
    if (!createdVideo || !courseDetail) {
      setStatus('먼저 숏폼을 만들어야 공유할 수 있습니다.');
      return;
    }
    const shared = await shareShortformDraft({ video_id: createdVideo.id, course_id: createdVideo.course_id, message: '학습용 숏폼을 공유합니다.' }, sessionToken);
    setStatus(shared ? '숏폼을 공유했습니다.' : '공유에 실패했습니다.');
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems((Array.isArray(refreshed) ? refreshed : []).slice(0, 4));
  }

  function toggleClip(clip: ClipSuggestion) {
    const key = clipKey(clip);
    setSelectedClips((current) => (current.some((item) => clipKey(item) === key) ? current.filter((item) => clipKey(item) !== key) : [...current, clip]));
  }

  function removeClip(key: string) {
    setSelectedClips((current) => current.filter((item) => clipKey(item) !== key));
  }

  function updateClipTimes(key: string, startTimeMs: number, endTimeMs: number) {
    setSelectedClips((current) => current.map((clip) => {
      if (clipKey(clip) !== key) return clip;
      const requestedDuration = Math.max(MIN_CLIP_MS, endTimeMs - startTimeMs);
      const boundedDuration = Math.min(MAX_CLIP_MS, requestedDuration);
      const safeStart = Math.max(0, Math.min(startTimeMs, endTimeMs - MIN_CLIP_MS));
      const safeEnd = safeStart + boundedDuration;
      return { ...clip, start_time_ms: safeStart, end_time_ms: safeEnd };
    }));
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-scissors-cut-line" />
              숏폼 제작 허브
            </div>
            <h1 className="mt-3 text-[24px] font-bold lg:text-[28px]">숏폼 제작 워크플로우</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">강좌 선택, 추천 구간 선택, 미리보기 저장을 하나의 흐름으로 정리해 중간에 길을 잃지 않도록 바꿨습니다.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">현재 강좌</div><div className="mt-1">{courseDetail?.title ?? '강좌 선택 필요'}</div></div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">선택 클립</div><div className="mt-1">{selectedClips.length}개 · {totalDurationLabel}</div></div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">현재 단계</div><div className="mt-1">{stepLabel}</div></div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">차시 바로 시작</div><div className="mt-1">현재 보고 있는 강의에서 곧바로 구간을 좁힐 수 있습니다.</div></div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">추천 구간 확인</div><div className="mt-1">차시별 추천 후보를 탭으로 빠르게 좁힙니다.</div></div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">저장 전 확인</div><div className="mt-1">미리보기와 제목을 마지막에 정리할 수 있습니다.</div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">제작 단계</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">강좌 선택 → 차시별 구간 선택 → 제목/미리보기/저장의 3단계로 정리했습니다.</p>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">{selectedClips.length}개 클립</span>
        </div>

        <div className="mt-5 flex items-center gap-0 overflow-x-auto pb-1">
          {(['강좌 선택', '구간 선택', '미리보기 / 저장'] as const).map((label, index) => {
            const current = (index + 1) as WizardStep;
            const active = step === current;
            const completed = step > current;
            return (
              <div key={label} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                {index > 0 ? <div className={`mx-2 h-0.5 flex-1 rounded ${completed || active ? 'bg-cyan-500' : 'bg-slate-200'}`} /> : null}
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? 'bg-emerald-500 text-white' : active ? 'bg-cyan-600 text-white ring-4 ring-cyan-100' : 'bg-slate-200 text-slate-500'}`}>
                    {completed ? <i className="ri-check-line" /> : index + 1}
                  </div>
                  <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-cyan-700' : 'text-slate-400'}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          {step === 1 ? <ShortformWizardStep1 courses={courses} activeCourseId={activeCourseId} courseTitle={courseDetail?.title ?? null} highlightedLecture={highlightedLecture} onSelectCourse={(courseId) => setActiveCourseId(courseId)} onUseHighlightedLecture={() => { if (highlightedLecture?.id) setLectureFilter(highlightedLecture.id); setStep(2); }} onNext={() => setStep(2)} canContinue={courseLectures.length > 0} /> : null}
          {step === 2 ? <ShortformWizardStep2 lectureFilter={lectureFilter} lectureTabs={lectureTabs} filteredSuggestions={filteredSuggestions} selectedClipKeys={selectedClipKeys} onBack={() => setStep(1)} onNext={() => setStep(3)} onToggleClip={toggleClip} onFilterChange={setLectureFilter} /> : null}
          {step === 3 ? <ShortformWizardStep3 courseTitle={courseDetail?.title ?? null} selectedClips={selectedClips} title={title} description={description} createdVideoId={createdVideo?.id ?? null} previewVideoUrl={previewVideoUrl} exportStatus={createdVideo?.export_status ?? null} status={status} onBack={() => setStep(2)} onSave={() => void handleCompose()} onShare={() => void handleShare()} onRemoveClip={removeClip} onUpdateClipTimes={updateClipTimes} onTitleChange={setTitle} onDescriptionChange={setDescription} formatDuration={formatDuration} /> : null}
        </section>

        <ShortformWizardSidebar courseTitle={courseDetail?.title ?? null} selectedClipsCount={selectedClips.length} selectedDurationLabel={totalDurationLabel} highlightedLectureTitle={highlightedLecture?.title ?? null} communityItems={communityItems} />
      </div>
    </div>
  );
}
