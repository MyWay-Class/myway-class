import { useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseSessionTimeline } from '../components/CourseSessionTimeline';
import { LectureSideChatPanel } from '../components/LectureSideChatPanel';
import { StatePanel } from '../components/StatePanel';

type LectureWatchPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

type RightTab = 'sessions' | 'categories' | 'chat';

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

function getRelatedCourses(courses: CourseCard[], selectedCourse: CourseDetail | null): CourseCard[] {
  if (!selectedCourse) {
    return [];
  }

  const selectedTags = new Set(selectedCourse.tags);
  return courses
    .filter((course) => course.id !== selectedCourse.id)
    .sort((left, right) => {
      const leftScore = left.category === selectedCourse.category ? 2 : 0;
      const rightScore = right.category === selectedCourse.category ? 2 : 0;
      const leftTags = left.tags.filter((tag) => selectedTags.has(tag)).length;
      const rightTags = right.tags.filter((tag) => selectedTags.has(tag)).length;
      return rightScore + rightTags - (leftScore + leftTags);
    })
    .slice(0, 4);
}

export function LectureWatchPage({
  courses,
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onSelectCourse,
  onSelectLecture,
  onNavigate,
}: LectureWatchPageProps) {
  const [activePanelTab, setActivePanelTab] = useState<RightTab>('sessions');
  const [selectedRelatedFilter, setSelectedRelatedFilter] = useState<string>('전체');
  const currentLecture = useMemo(() => {
    if (!selectedCourse) {
      return highlightedLecture;
    }

    return selectedCourse.lectures.find((lecture) => lecture.id === selectedLectureId) ?? highlightedLecture ?? selectedCourse.lectures[0] ?? null;
  }, [highlightedLecture, selectedCourse, selectedLectureId]);

  const relatedCourses = useMemo(() => getRelatedCourses(courses, selectedCourse), [courses, selectedCourse]);
  const relatedFilters = useMemo(() => {
    if (!selectedCourse) {
      return ['전체'];
    }

    return ['전체', selectedCourse.category, ...selectedCourse.tags].filter((value, index, array) => array.indexOf(value) === index);
  }, [selectedCourse]);
  const filteredRelatedCourses = useMemo(() => {
    if (!selectedCourse || selectedRelatedFilter === '전체') {
      return relatedCourses;
    }

    return relatedCourses.filter(
      (course) => course.category === selectedRelatedFilter || course.tags.includes(selectedRelatedFilter),
    );
  }, [relatedCourses, selectedCourse, selectedRelatedFilter]);
  const upcomingLectures = useMemo(() => {
    if (!selectedCourse || !currentLecture) {
      return [];
    }

    const currentIndex = selectedCourse.lectures.findIndex((lecture) => lecture.id === currentLecture.id);
    return selectedCourse.lectures.slice(Math.max(currentIndex + 1, 0), currentIndex + 5);
  }, [currentLecture, selectedCourse]);

  if (!selectedCourse) {
    return (
      <StatePanel
        icon="ri-play-circle-line"
        tone="indigo"
        title="시청할 강의를 먼저 선택하세요."
        description="내 강의에서 코스를 고르면 상세/진도율 화면을 지나 시청 페이지로 들어갈 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-play-circle-line" />
              영상 시청
            </div>
            <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[30px]">
              상세는 한 단계 뒤, 시청은 지금 바로
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">
              화면은 재생과 다음 차시 이동에 집중하고, 우측 패널에서 차시 목록, 카테고리, 챗봇을 탭으로 전환합니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">선택 강의</div>
              <div className="mt-1">{selectedCourse.title}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 차시</div>
              <div className="mt-1">{currentLecture?.title ?? '차시 미선택'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">역할</div>
              <div className="mt-1">{canManageCurrent ? '교강사 시청 모드' : '학습자 시청 모드'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <article className="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-soft">
          <div className="border-b border-[var(--app-border)] px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-indigo-600">내 강의 / 영상 시청</div>
                <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{selectedCourse.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-[var(--app-text-muted)]">
                  {selectedCourse.category} · {selectedCourse.difficulty} · {selectedCourse.lecture_count}차시 · {selectedCourse.progress_percent}% 진행
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('courses')}
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-soft)]"
                >
                  상세/진도율
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('my-courses')}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                >
                  내 강의
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-black">
              {currentLecture?.video_url ? (
                <video className="aspect-video w-full bg-black" controls preload="metadata" src={currentLecture.video_url} />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#1e293b_100%)] text-white">
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[30px] text-white/90">
                      <i className="ri-play-circle-fill" />
                    </div>
                    <div className="mt-4 text-[15px] font-semibold">재생 가능한 영상이 없습니다.</div>
                    <div className="mt-1 text-[12px] text-white/65">이 차시는 텍스트/자료 기반으로 확인할 수 있습니다.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
                <div className="text-[12px] font-semibold text-indigo-600">현재 차시</div>
                <div className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{currentLecture?.title ?? '차시를 선택하세요'}</div>
                <p className="mt-3 text-[13px] leading-7 text-[var(--app-text-muted)]">
                  {currentLecture?.transcript_excerpt ?? '선택한 차시의 핵심 내용과 메모를 이곳에서 확인합니다.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('courses')}
                    className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-soft)]"
                  >
                    강의 상세로
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('shortform')}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                  >
                    숏폼 만들기
                  </button>
                  {canManageCurrent ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('media-pipeline')}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[12px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      업로드/전사 관리
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
                <div className="text-[12px] font-semibold text-[var(--app-text-muted)]">진도율</div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-[30px] font-extrabold tracking-[-0.05em] text-[var(--app-text)]">{selectedCourse.progress_percent}%</div>
                  <div className="text-right text-[11px] text-[var(--app-text-muted)]">
                    <div>{selectedCourse.completed_lectures}/{selectedCourse.lecture_count}차시</div>
                    <div>{formatDuration(selectedCourse.total_duration_minutes)}</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(selectedCourse.progress_percent, 8)}%` }} />
                </div>
                <div className="mt-3 text-[12px] leading-6 text-[var(--app-text-muted)]">
                  {upcomingLectures.length > 0 ? `다음 차시는 ${upcomingLectures[0].title}입니다.` : '다음 차시가 없습니다.'}
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-soft">
          <div className="border-b border-[var(--app-border)] px-4 py-4">
            <div className="flex gap-2">
              {[
                { key: 'sessions', label: '차시 목록', icon: 'ri-list-check-2' },
                { key: 'categories', label: '카테고리', icon: 'ri-grid-line' },
                { key: 'chat', label: '챗봇', icon: 'ri-robot-line' },
              ].map((tab) => {
                const active = activePanelTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePanelTab(tab.key as RightTab)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-semibold transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    <i className={tab.icon} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            {activePanelTab === 'sessions' ? (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <div className="text-[12px] font-semibold text-indigo-600">다음 차시 선택</div>
                  <div className="mt-1 text-[14px] font-bold text-[var(--app-text)]">현재 강의의 차시 목록을 바로 전환합니다.</div>
                  <p className="mt-2 text-[12px] leading-6 text-[var(--app-text-muted)]">
                    원하는 주차를 눌러 선택하고, 이어서 영상 시청과 챗봇 질문으로 연결할 수 있습니다.
                  </p>
                </div>
                <CourseSessionTimeline course={selectedCourse} selectedLectureId={selectedLectureId} onSelectLecture={onSelectLecture} />
              </div>
            ) : null}

            {activePanelTab === 'categories' ? (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <div className="text-[12px] font-semibold text-indigo-600">강의 카테고리</div>
                  <div className="mt-1 text-[16px] font-bold text-[var(--app-text)]">{selectedCourse.category}</div>
                  <p className="mt-2 text-[12px] leading-6 text-[var(--app-text-muted)]">
                    {selectedCourse.difficulty} · {selectedCourse.lecture_count}차시 · {selectedCourse.student_count}명 수강
                  </p>
                </div>

                <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <div className="text-[12px] font-semibold text-[var(--app-text-muted)]">선택 가능 카테고리</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {relatedFilters.map((filter) => {
                      const active = selectedRelatedFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setSelectedRelatedFilter(filter)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                            active ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {filter === '전체' ? filter : `#${filter}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <div className="text-[12px] font-semibold text-[var(--app-text-muted)]">추천 강의</div>
                  <div className="mt-3 space-y-2">
                    {filteredRelatedCourses.length > 0 ? (
                      filteredRelatedCourses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            onSelectCourse(course.id);
                            onNavigate('courses');
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-[16px] text-indigo-600">
                            <i className="ri-play-circle-line" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold text-[var(--app-text)]">{course.title}</div>
                            <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
                              {course.category} · {course.progress_percent}% 진행
                            </div>
                          </div>
                          </button>
                      ))
                    ) : (
                      <StatePanel
                        compact
                        icon="ri-compass-3-line"
                        tone="slate"
                        title="비슷한 강의를 찾지 못했습니다."
                          description="현재 선택한 강의와 연결할 다른 코스를 다음 단계에서 추천할 수 있습니다."
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activePanelTab === 'chat' ? <LectureSideChatPanel highlightedLecture={currentLecture} sessionToken={sessionToken} /> : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
