import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail, ShortformCommunityItem } from '@myway/shared';
import { composeCustomCourseDraft, loadCourseDetail, loadLectureTranscriptDetailed, loadShortformCommunity, shareCustomCourseDraft } from '../../../lib/api';
import { ShortformWizardSidebar } from './ShortformWizardSidebar';
import { ShortformWizardStep1 } from './ShortformWizardStep1';
import { ShortformWizardStep2 } from './ShortformWizardStep2';
import { ShortformWizardStep3 } from './ShortformWizardStep3';
import type { ClipSuggestion, WizardStep } from './ShortformWizardTypes';

type ShortformWizardProps = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function clipKey(clip: ClipSuggestion): string {
  return `${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`;
}

function buildTranscriptSuggestions(course: CourseDetail, lectureId: string, segments: Array<{ start_ms: number; end_ms: number; text: string }>): ClipSuggestion[] {
  const lecture = course.lectures.find((item) => item.id === lectureId);
  if (!lecture || segments.length === 0) {
    return [];
  }

  const validSegments = segments.filter((segment) => segment.text.trim().length > 0);
  if (validSegments.length === 0) {
    return [];
  }

  const clipCount = Math.min(3, validSegments.length);
  const chunkSize = Math.ceil(validSegments.length / clipCount);

  return Array.from({ length: clipCount }, (_, clipIndex) => {
    const startIndex = clipIndex * chunkSize;
    const chunk = validSegments.slice(startIndex, startIndex + chunkSize);
    const start = chunk[0]?.start_ms ?? 0;
    const end = chunk[chunk.length - 1]?.end_ms ?? start + 30_000;

    return {
      lecture_id: lecture.id,
      lecture_title: lecture.title,
      start_time_ms: start,
      end_time_ms: Math.max(end, start + 1_000),
      label: `${lecture.title} 전사 ${clipIndex + 1}`,
      description: chunk.map((segment) => segment.text).join(' ').slice(0, 90) || `${lecture.title} 전사 구간`,
    };
  });
}

function buildClipSuggestions(course: CourseDetail | null, transcriptMap: Record<string, Array<{ start_ms: number; end_ms: number; text: string }> | null>): ClipSuggestion[] {
  if (!course) {
    return [];
  }

  return course.lectures.flatMap((lecture, lectureIndex) => {
    const transcriptSegments = transcriptMap[lecture.id] ?? null;
    if (transcriptSegments && transcriptSegments.length > 0) {
      return buildTranscriptSuggestions(course, lecture.id, transcriptSegments);
    }

    const totalMs = Math.max(lecture.duration_minutes, 1) * 60_000;
    const segment = Math.max(Math.round(totalMs / 3), 30_000);

    return Array.from({ length: 3 }, (_, clipIndex) => {
      const start_time_ms = Math.min(clipIndex * segment, Math.max(totalMs - segment, 0));
      const end_time_ms = Math.min(start_time_ms + segment, totalMs);

      return {
        lecture_id: lecture.id,
        lecture_title: lecture.title,
        start_time_ms,
        end_time_ms,
        label: `${lecture.title} 핵심 ${clipIndex + 1} · ${lectureIndex + 1}차시`,
        description: lecture.content_text.slice(0, 72) || `${lecture.title} 요약 구간`,
      };
    });
  });
}

export function ShortformWizard({ highlightedLecture, selectedCourse, courses, sessionToken }: ShortformWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(selectedCourse?.id ?? courses[0]?.id ?? null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(selectedCourse);
  const [lectureFilter, setLectureFilter] = useState<string>(highlightedLecture?.id ?? 'all');
  const [selectedClips, setSelectedClips] = useState<ClipSuggestion[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('핵심 구간을 이어 붙여 학습용 개인 코스로 정리합니다.');
  const [status, setStatus] = useState('아직 조립된 개인 코스가 없습니다.');
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [communityItems, setCommunityItems] = useState<ShortformCommunityItem[]>([]);
  const [transcriptMap, setTranscriptMap] = useState<Record<string, Array<{ start_ms: number; end_ms: number; text: string }> | null>>({});

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
    setCreatedCourseId(null);
    setStatus('아직 조립된 개인 코스가 없습니다.');
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
      if (alive) {
        setCourseDetail(detail);
      }
    });

    return () => {
      alive = false;
    };
  }, [activeCourseId, selectedCourse, sessionToken]);

  useEffect(() => {
    let alive = true;

    if (!courseDetail?.lectures.length) {
      setTranscriptMap({});
      return undefined;
    }

    Promise.all(
      courseDetail.lectures.map(async (lecture) => {
        const transcript = await loadLectureTranscriptDetailed(lecture.id, sessionToken);
        return [lecture.id, transcript?.segments ?? null] as const;
      }),
    ).then((entries) => {
      if (!alive) {
        return;
      }

      setTranscriptMap(Object.fromEntries(entries));
    });

    return () => {
      alive = false;
    };
  }, [courseDetail?.id, courseDetail?.lectures, sessionToken]);

  useEffect(() => {
    let alive = true;

    loadShortformCommunity(activeCourseId, sessionToken).then((items) => {
      if (alive) {
        setCommunityItems(items.slice(0, 4));
      }
    });

    return () => {
      alive = false;
    };
  }, [activeCourseId, sessionToken]);

  const clipSuggestions = useMemo(() => buildClipSuggestions(courseDetail, transcriptMap), [courseDetail, transcriptMap]);
  const lectureTabs = useMemo(() => {
    if (!courseDetail) {
      return [];
    }

    return courseDetail.lectures.map((lecture, index) => ({
      id: lecture.id,
      title: lecture.title,
      label: `${lecture.week_number ?? 1}주차 · ${lecture.session_number ?? index + 1}차시`,
    }));
  }, [courseDetail]);

  const filteredSuggestions = useMemo(() => {
    if (lectureFilter === 'all') {
      return clipSuggestions;
    }

    return clipSuggestions.filter((clip) => clip.lecture_id === lectureFilter);
  }, [clipSuggestions, lectureFilter]);

  const selectedClipKeys = useMemo(() => selectedClips.map((clip) => clipKey(clip)), [selectedClips]);

  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);
  const totalDurationLabel = formatDuration(totalDurationMs);
  const stepLabel = step === 1 ? '강좌 선택' : step === 2 ? '구간 선택' : '미리보기 / 저장';

  async function handleCompose() {
    if (!courseDetail || selectedClips.length === 0) {
      setStatus('조립할 강의와 클립이 필요합니다.');
      return;
    }

    const result = await composeCustomCourseDraft(
      {
        course_id: courseDetail.id,
        title: title.trim() || `${courseDetail.title} 개인 코스`,
        description,
        clips: selectedClips.map((clip) => ({
          lecture_id: clip.lecture_id,
          start_time_ms: clip.start_time_ms,
          end_time_ms: clip.end_time_ms,
          label: clip.label,
          description: clip.description,
        })),
      },
      sessionToken,
    );

    if (!result) {
      setStatus('개인 코스를 조립하지 못했습니다.');
      return;
    }

    setCreatedCourseId(result.id);
    setStatus(`개인 코스 ${result.title}를 만들었습니다. 공유하거나 복사할 수 있습니다.`);
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems(refreshed.slice(0, 4));
    setStep(3);
  }

  async function handleShare() {
    if (!createdCourseId || !courseDetail) {
      setStatus('먼저 개인 코스를 만들어야 공유할 수 있습니다.');
      return;
    }

    const shared = await shareCustomCourseDraft(createdCourseId, { message: '개인 코스를 코스 참여자와 공유합니다.' }, sessionToken);
    setStatus(shared ? '개인 코스를 공유했습니다.' : '공유에 실패했습니다.');
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems(refreshed.slice(0, 4));
  }

  function toggleClip(clip: ClipSuggestion) {
    const key = clipKey(clip);
    setSelectedClips((current) => (current.some((item) => clipKey(item) === key) ? current.filter((item) => clipKey(item) !== key) : [...current, clip]));
  }

  function removeClip(key: string) {
    setSelectedClips((current) => current.filter((item) => clipKey(item) !== key));
  }

  function updateClipTimes(key: string, startTimeMs: number, endTimeMs: number) {
    setSelectedClips((current) =>
      current.map((clip) => {
        if (clipKey(clip) !== key) {
          return clip;
        }

        const safeStart = Math.max(0, Math.min(startTimeMs, endTimeMs - 1_000));
        const safeEnd = Math.max(safeStart + 1_000, endTimeMs);

        return {
          ...clip,
          start_time_ms: safeStart,
          end_time_ms: safeEnd,
        };
      }),
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-scissors-cut-line" />
              숏폼 제작 허브
            </div>
            <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[30px]">선택이 쉬운 숏폼 제작 화면</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">
              강좌 선택, 추천 구간 선택, 미리보기 저장을 하나의 흐름으로 정리해 중간에 길을 잃지 않도록 바꿨습니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 강좌</div>
              <div className="mt-1">{courseDetail?.title ?? '강좌 선택 필요'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">선택 클립</div>
              <div className="mt-1">{selectedClips.length}개 · {totalDurationLabel}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 단계</div>
              <div className="mt-1">{stepLabel}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur">
            <div className="font-semibold text-white">차시 바로 시작</div>
            <div className="mt-1">현재 보고 있는 강의에서 곧바로 구간을 좁힐 수 있습니다.</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur">
            <div className="font-semibold text-white">추천 구간 확인</div>
            <div className="mt-1">차시별 추천 후보를 탭으로 빠르게 좁힙니다.</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur">
            <div className="font-semibold text-white">저장 전 확인</div>
            <div className="mt-1">미리보기와 제목을 마지막에 정리할 수 있습니다.</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">제작 흐름</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              강좌 선택 → 차시별 구간 선택 → 제목/미리보기/저장의 3단계로 정리했습니다.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
            {selectedClips.length}개 클립
          </span>
        </div>

        <div className="mt-5 flex items-center gap-0 overflow-x-auto pb-1">
          {(['강좌 선택', '구간 선택', '미리보기 / 저장'] as const).map((label, index) => {
            const current = (index + 1) as WizardStep;
            const active = step === current;
            const completed = step > current;

            return (
              <div key={label} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                {index > 0 ? (
                  <div className={`mx-2 h-0.5 flex-1 rounded ${completed || active ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                ) : null}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      completed ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {completed ? <i className="ri-check-line" /> : index + 1}
                  </div>
                  <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="space-y-5">
          {step === 1 ? (
            <ShortformWizardStep1
              courses={courses}
              activeCourseId={activeCourseId}
              courseTitle={courseDetail?.title ?? null}
              highlightedLecture={highlightedLecture}
              onSelectCourse={(courseId) => setActiveCourseId(courseId)}
              onUseHighlightedLecture={() => {
                if (highlightedLecture?.id) {
                  setLectureFilter(highlightedLecture.id);
                }
                setStep(2);
              }}
              onNext={() => setStep(2)}
              canContinue={Boolean(courseDetail?.lectures.length)}
            />
          ) : null}

          {step === 2 ? (
            <ShortformWizardStep2
              lectureFilter={lectureFilter}
              lectureTabs={lectureTabs}
              filteredSuggestions={filteredSuggestions}
              selectedClipKeys={selectedClipKeys}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onToggleClip={toggleClip}
              onFilterChange={setLectureFilter}
            />
          ) : null}

          {step === 3 ? (
            <ShortformWizardStep3
              courseTitle={courseDetail?.title ?? null}
              selectedClips={selectedClips}
              title={title}
              description={description}
              createdCourseId={createdCourseId}
              status={status}
              onBack={() => setStep(2)}
              onSave={() => void handleCompose()}
              onShare={() => void handleShare()}
              onRemoveClip={removeClip}
              onUpdateClipTimes={updateClipTimes}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              formatDuration={formatDuration}
            />
          ) : null}
        </section>

        <ShortformWizardSidebar
          courseTitle={courseDetail?.title ?? null}
          selectedClipsCount={selectedClips.length}
          selectedDurationLabel={totalDurationLabel}
          highlightedLectureTitle={highlightedLecture?.title ?? null}
          communityItems={communityItems}
        />
      </div>
    </div>
  );
}
