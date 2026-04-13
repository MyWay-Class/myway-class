import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail, LectureTranscript } from '@myway/shared';
import { CourseSessionTimeline } from '../components/CourseSessionTimeline';
import { LectureSideChatPanel } from '../components/LectureSideChatPanel';
import { StatePanel } from '../components/StatePanel';
import { loadLectureTranscriptDetailed } from '../../../lib/api-media';
import { buildProtectedVideoUrl } from '../../../lib/video-url';

type LectureWatchPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onEnroll: (courseId: string) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

type RightTab = 'sessions' | 'script' | 'chat';
type ScriptTab = RightTab;

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function LectureWatchPage({
  courses,
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onEnroll,
  onSelectCourse,
  onSelectLecture,
  onNavigate,
}: LectureWatchPageProps) {
  const [activePanelTab, setActivePanelTab] = useState<ScriptTab>('sessions');
  const [transcript, setTranscript] = useState<LectureTranscript | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const isLocked = Boolean(selectedCourse && !selectedCourse.enrolled && !canManageCurrent);
  const currentLecture = useMemo(() => {
    if (!selectedCourse) {
      return highlightedLecture;
    }

    return selectedCourse.lectures.find((lecture) => lecture.id === selectedLectureId) ?? highlightedLecture ?? selectedCourse.lectures[0] ?? null;
  }, [highlightedLecture, selectedCourse, selectedLectureId]);

  const upcomingLectures = useMemo(() => {
    if (!selectedCourse || !currentLecture) {
      return [];
    }

    const currentIndex = selectedCourse.lectures.findIndex((lecture) => lecture.id === currentLecture.id);
    return selectedCourse.lectures.slice(Math.max(currentIndex + 1, 0), currentIndex + 5);
  }, [currentLecture, selectedCourse]);

  useEffect(() => {
    let active = true;

    if (!currentLecture?.id || isLocked) {
      setTranscript(null);
      return () => {
        active = false;
      };
    }

    setTranscriptLoading(true);
    void loadLectureTranscriptDetailed(currentLecture.id, sessionToken)
      .then((nextTranscript) => {
        if (active) {
          setTranscript(nextTranscript);
        }
      })
      .finally(() => {
        if (active) {
          setTranscriptLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentLecture?.id, isLocked, sessionToken]);

  function formatTimecode(value: number): string {
    const totalSeconds = Math.max(0, Math.floor(value / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-play-circle-line" />
              영상 시청
            </div>
            <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[30px]">{selectedCourse.title}</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">
              {currentLecture?.title ?? '차시를 선택하세요'} · {selectedCourse.category} · {selectedCourse.progress_percent}% 진행
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold text-white/90 backdrop-blur">
            {canManageCurrent ? '교강사 시청 모드' : '학습자 시청 모드'}
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
              {isLocked ? (
                <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#1e293b_100%)] text-white">
                  <div className="max-w-md px-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[30px] text-white/90">
                      <i className="ri-lock-line" />
                    </div>
                    <div className="mt-4 text-[15px] font-semibold">수강 신청 후 영상을 볼 수 있습니다.</div>
                    <div className="mt-1 text-[12px] text-white/65">
                      상세 페이지에서 수강 신청을 완료하면 이 차시의 영상과 스크립트, 챗봇이 열립니다.
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectedCourse && onEnroll(selectedCourse.id)}
                        className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        수강 신청하기
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('courses')}
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/15"
                      >
                        강의 상세로 이동
                      </button>
                    </div>
                  </div>
                </div>
              ) : currentLecture?.video_url ? (
                <video
                  className="aspect-video w-full bg-black"
                  controls
                  preload="metadata"
                  src={buildProtectedVideoUrl(currentLecture.video_url, sessionToken)}
                />
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
                {transcript?.duration_ms ? (
                  <div className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                    실제 재생 길이 {formatTimecode(transcript.duration_ms)}
                  </div>
                ) : null}
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
          {isLocked ? (
            <div className="p-5">
              <StatePanel
                icon="ri-lock-line"
                tone="amber"
                title="수강 신청 후 시청 패널이 열립니다."
                description="차시 목록, 스크립트, 챗봇은 수강 신청이 완료된 뒤 사용할 수 있습니다."
              />
              <button
                type="button"
                onClick={() => onEnroll(selectedCourse.id)}
                className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
              >
                수강 신청하기
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--app-border)] px-4 py-4">
                <div className="flex gap-2">
                  {[
                    { key: 'sessions', label: '차시 목록', icon: 'ri-list-check-2' },
                    { key: 'script', label: '스크립트', icon: 'ri-subtitle' },
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
                    <CourseSessionTimeline
                      course={selectedCourse}
                      selectedLectureId={selectedLectureId}
                      onSelectLecture={onSelectLecture}
                      onOpenLecture={(lectureId) => {
                        onSelectLecture(lectureId);
                        onNavigate('lecture-watch');
                      }}
                    />
                  </div>
                ) : null}

                {activePanelTab === 'script' ? (
                  <div className="space-y-4">
                    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                      <div className="text-[12px] font-semibold text-indigo-600">스크립트</div>
                      <div className="mt-1 text-[16px] font-bold text-[var(--app-text)]">타임스탬프 기준으로 바로 찾아볼 수 있습니다.</div>
                      <p className="mt-2 text-[12px] leading-6 text-[var(--app-text-muted)]">
                        필요한 구간의 시작 시간을 눌러 복사하거나, 차시 이동 전에 먼저 확인할 수 있습니다.
                      </p>
                    </div>

                    {transcriptLoading ? (
                      <StatePanel compact icon="ri-loader-4-line" tone="slate" title="스크립트를 불러오는 중입니다." description="전사 데이터를 가져오고 있습니다." />
                    ) : transcript?.segments?.length ? (
                      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                        {transcript.segments.map((segment) => (
                          <article key={segment.index} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(formatTimecode(segment.start_ms));
                                }}
                                className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-600"
                              >
                                {formatTimecode(segment.start_ms)} - {formatTimecode(segment.end_ms)}
                              </button>
                              <span className="text-[11px] font-semibold text-slate-400">#{segment.index + 1}</span>
                            </div>
                            <p className="mt-3 text-[13px] leading-7 text-[var(--app-text)]">{segment.text}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <StatePanel
                        compact
                        icon="ri-subtitle"
                        tone="slate"
                        title="스크립트가 아직 없습니다."
                        description="전사 완료 후에 타임스탬프 기반 스크립트가 표시됩니다."
                      />
                    )}
                  </div>
                ) : null}

                {activePanelTab === 'chat' ? <LectureSideChatPanel highlightedLecture={highlightedLecture} sessionToken={sessionToken} /> : null}
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
