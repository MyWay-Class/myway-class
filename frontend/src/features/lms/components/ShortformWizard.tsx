import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail, ShortformCommunityItem } from '@myway/shared';
import { composeCustomCourseDraft, loadCourseDetail, loadShortformCommunity, shareCustomCourseDraft } from '../../../lib/api';
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

function buildClipSuggestions(course: CourseDetail | null): ClipSuggestion[] {
  if (!course) {
    return [];
  }

  return course.lectures.flatMap((lecture, lectureIndex) => {
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
  const [lectureFilter, setLectureFilter] = useState<string>('all');
  const [selectedClipKeys, setSelectedClipKeys] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('핵심 구간을 이어 붙여 학습용 개인 코스로 정리합니다.');
  const [status, setStatus] = useState('아직 조립된 개인 코스가 없습니다.');
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [communityItems, setCommunityItems] = useState<ShortformCommunityItem[]>([]);

  useEffect(() => {
    if (selectedCourse?.id) {
      setActiveCourseId(selectedCourse.id);
      setCourseDetail(selectedCourse);
    }
  }, [selectedCourse?.id, selectedCourse]);

  useEffect(() => {
    setSelectedClipKeys([]);
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

    loadShortformCommunity(activeCourseId, sessionToken).then((items) => {
      if (alive) {
        setCommunityItems(items.slice(0, 4));
      }
    });

    return () => {
      alive = false;
    };
  }, [activeCourseId, sessionToken]);

  const clipSuggestions = useMemo(() => buildClipSuggestions(courseDetail), [courseDetail]);
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

  const selectedClips = useMemo(
    () =>
      clipSuggestions.filter((clip) =>
        selectedClipKeys.includes(`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`),
      ),
    [clipSuggestions, selectedClipKeys],
  );

  const totalDurationMs = selectedClips.reduce((sum, clip) => sum + (clip.end_time_ms - clip.start_time_ms), 0);
  const totalDurationLabel = formatDuration(totalDurationMs);

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
    const key = `${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`;
    setSelectedClipKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function removeClip(key: string) {
    setSelectedClipKeys((current) => current.filter((item) => item !== key));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">숏폼 제작</h1>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              강좌 선택 → 차시별 구간 선택 → 제목/미리보기/저장의 3단계로 구성해, 레퍼런스와 같은 제작 흐름을 유지합니다.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
            {courseDetail?.title ?? '강좌 선택 필요'}
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
              onSelectCourse={(courseId) => setActiveCourseId(courseId)}
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
