import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseSessionTimeline } from '../components/CourseSessionTimeline';
import { LectureSideChatPanel } from '../components/LectureSideChatPanel';
import { StatePanel } from '../components/StatePanel';
import { useLectureWatchPlayback } from './useLectureWatchPlayback';
import { formatWatchDuration, formatWatchTimecode, lectureWatchTabs, type LectureWatchPanelTab } from './lectureWatchPageUtils';

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
  const {
    activePanelTab,
    setActivePanelTab,
    transcript,
    transcriptLoading,
    videoErrorKind,
    setVideoErrorKind,
    videoErrorMessage,
    setVideoErrorMessage,
    videoChecking,
    remapAssetKey,
    setRemapAssetKey,
    remapMessage,
    remapBusy,
    currentLecture,
    isLocked,
    protectedVideoUrl,
    upcomingLectures,
    videoRef,
    seekVideoTo,
    handleSeekFromChat,
    handleRemapAssetKey,
  } = useLectureWatchPlayback({
    selectedCourse,
    highlightedLecture,
    selectedLectureId,
    canManageCurrent,
    sessionToken,
    onSelectLecture,
    onNavigate,
  });

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
      <section className="overflow-hidden rounded-[32px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-7 text-white shadow-[0_30px_70px_rgba(8,47,73,0.28)]">
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
        <article className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-cyan-700">내 강의 / 영상 시청</div>
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
                  className="rounded-full bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500"
                >
                  내 강의
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-black shadow-[0_16px_32px_rgba(15,23,42,0.20)]">
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
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="aspect-video w-full bg-black"
                    controls
                    preload="metadata"
                    src={protectedVideoUrl}
                    onError={() => {
                      if (!videoErrorKind) {
                        setVideoErrorKind('unknown');
                        setVideoErrorMessage('브라우저 재생 중 오류가 발생했습니다.');
                      }
                    }}
                  />
                  {videoChecking ? (
                    <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white/90">
                      재생 상태 확인 중...
                    </div>
                  ) : null}
                  {videoErrorKind ? (
                    <div className="border-t border-white/10 bg-slate-950/90 px-4 py-3 text-[12px] text-white/90">
                      <div className="font-semibold">
                        {videoErrorKind === 'forbidden'
                          ? '403 권한 오류'
                          : videoErrorKind === 'not_found'
                            ? '404 파일 없음'
                            : '재생 오류'}
                      </div>
                      <div className="mt-1 text-white/70">{videoErrorMessage ?? '영상 상태를 확인해 주세요.'}</div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#1e293b_100%)] text-white">
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[30px] text-white/90">
                      <i className="ri-play-circle-fill" />
                    </div>
                    <div className="mt-4 text-[15px] font-semibold">재생 가능한 영상이 없습니다.</div>
                    <div className="mt-1 text-[12px] text-white/65">이 차시는 텍스트/자료 기반으로 확인할 수 있습니다.</div>
                    {canManageCurrent ? (
                      <div className="mx-auto mt-4 flex max-w-xl flex-col gap-2 text-left">
                        <label htmlFor="lecture-remap-asset-key" className="text-[11px] font-semibold text-white/80">
                          관리자: R2 asset key 재매핑
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <input
                            id="lecture-remap-asset-key"
                            type="text"
                            value={remapAssetKey}
                            onChange={(event) => setRemapAssetKey(event.target.value)}
                            placeholder="media/crs_xxx/lec_xxx.mp4"
                            className="min-w-[260px] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/45 focus:border-cyan-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={remapBusy}
                            onClick={() => void handleRemapAssetKey()}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-[12px] font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                          >
                            R2 재매핑
                          </button>
                        </div>
                        {remapMessage ? <div className="text-[11px] text-white/70">{remapMessage}</div> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5">
                    <div className="text-[12px] font-semibold text-cyan-700">현재 차시</div>
                <div className="mt-1 text-[18px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{currentLecture?.title ?? '차시를 선택하세요'}</div>
                <p className="mt-3 text-[13px] leading-7 text-[var(--app-text-muted)]">
                  {highlightedLecture?.transcript_excerpt ?? currentLecture?.content_text ?? '선택한 차시의 핵심 내용과 메모를 이곳에서 확인합니다.'}
                </p>
                {transcript?.duration_ms ? (
                  <div className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                    실제 재생 길이 {formatWatchTimecode(transcript.duration_ms)}
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
                    className="rounded-full bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500"
                  >
                    숏폼 만들기
                  </button>
                  {canManageCurrent ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('media-pipeline')}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[12px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
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
                    <div>{formatWatchDuration(selectedCourse.total_duration_minutes)}</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(selectedCourse.progress_percent, 8)}%` }} />
                </div>
                <div className="mt-3 text-[12px] leading-6 text-[var(--app-text-muted)]">
                  {upcomingLectures.length > 0 ? `다음 차시는 ${upcomingLectures[0].title}입니다.` : '다음 차시가 없습니다.'}
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
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
              <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                <div className="flex gap-2">
                  {lectureWatchTabs.map((tab) => {
                    const active = activePanelTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActivePanelTab(tab.key as LectureWatchPanelTab)}
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
                        필요한 구간의 시작 시간을 누르면 영상이 해당 위치로 이동하고 재생을 시도합니다.
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
                                  seekVideoTo(segment.start_ms);
                                }}
                                className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-600"
                              >
                                {formatWatchTimecode(segment.start_ms)} - {formatWatchTimecode(segment.end_ms)}
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

                {activePanelTab === 'chat' ? (
                  <LectureSideChatPanel
                    highlightedLecture={highlightedLecture}
                    sessionToken={sessionToken}
                    onSeekTimestamp={handleSeekFromChat}
                  />
                ) : null}
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
