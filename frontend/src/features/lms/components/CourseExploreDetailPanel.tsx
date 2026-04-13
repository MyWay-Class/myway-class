import { getLectureDisplayDurationMinutes, type CourseDetail, type LectureDetail } from '@myway/shared';
import { CourseSessionTimeline } from './CourseSessionTimeline';
import { StatePanel } from './StatePanel';
import { buildProtectedVideoUrl } from '../../../lib/video-url';

type CourseExploreDetailPanelProps = {
  course: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  viewMode: 'detail' | 'watch';
  activeTab: '강의' | '공지' | '자료';
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
  onTabChange: (tab: '강의' | '공지' | '자료') => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

const courseTabs: { key: '강의' | '공지' | '자료'; label: string; icon: string }[] = [
  { key: '강의', label: '강의', icon: 'ri-play-circle-line' },
  { key: '공지', label: '공지', icon: 'ri-megaphone-line' },
  { key: '자료', label: '자료', icon: 'ri-folder-line' },
];

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

function renderNoticeList(course: CourseDetail) {
  if (course.notices.length === 0) {
    return (
      <StatePanel
        compact
        icon="ri-megaphone-line"
        tone="slate"
        title="등록된 공지가 없습니다."
        description="공지사항이 추가되면 이 영역에서 최신 안내를 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-2">
      {course.notices.map((notice) => (
        <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <i className={`${notice.pinned ? 'ri-pushpin-fill text-indigo-500' : 'ri-megaphone-line text-slate-400'} mt-0.5 flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-slate-900">{notice.title}</p>
                {notice.pinned ? <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">고정</span> : null}
              </div>
              <p className="mt-1 whitespace-pre-line text-[12px] leading-6 text-slate-500">{notice.content}</p>
              <p className="mt-2 text-[11px] text-slate-400">{formatDisplayDate(notice.created_at)}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function renderMaterialList(course: CourseDetail) {
  if (course.materials.length === 0) {
    return (
      <StatePanel
        compact
        icon="ri-folder-line"
        tone="amber"
        title="등록된 자료가 없습니다."
        description="강의 자료가 올라오면 파일명, 요약, 업로드 시점을 함께 보여줍니다."
      />
    );
  }

  return (
    <div className="space-y-2">
      {course.materials.map((material) => (
        <article key={material.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[18px] text-indigo-500 shadow-sm">
              <i className="ri-file-pdf-2-line" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">{material.title}</p>
              <p className="mt-1 text-[12px] leading-6 text-slate-500">{material.summary}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {material.file_name} · {formatDisplayDate(material.uploaded_at)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CourseExploreDetailPanel({
  course,
  highlightedLecture,
  selectedLectureId,
  viewMode,
  activeTab,
  canManageCurrent,
  sessionToken,
  onSelectLecture,
  onEnroll,
  onTabChange,
  onNavigate,
}: CourseExploreDetailPanelProps) {
  const detailLecture = highlightedLecture;
  const isLocked = Boolean(course && !course.enrolled && !canManageCurrent);
  const protectedVideoUrl = buildProtectedVideoUrl(detailLecture?.video_url, sessionToken);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      {course ? (
        <div className="bg-[linear-gradient(135deg,#1f2937,#4338ca)] px-5 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold opacity-90">
                <span className="rounded-full bg-white/15 px-2.5 py-1">{course.category}</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1">
                  {course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}
                </span>
              </div>
              <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.04em]">{course.title}</h1>
              <p className="mt-2 text-[13px] leading-6 text-white/80">{course.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-white/80">
                <span>{course.instructor_name}</span>
                <span>·</span>
                <span>{course.lecture_count}강의</span>
                <span>·</span>
                <span>{course.student_count}명 수강</span>
                <span>·</span>
                <span>{formatDuration(course.total_duration_minutes)}</span>
              </div>
            </div>

            <div className="flex-shrink-0 rounded-3xl bg-white/10 px-4 py-4 text-center backdrop-blur">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray={`${course.progress_percent} ${100 - course.progress_percent}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[13px] font-bold">{course.progress_percent}%</span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-white/70">{course.enrolled ? '진행률' : '미수강'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-5">
          <StatePanel
            icon="ri-cursor-line"
            tone="violet"
            title="코스를 선택하세요."
            description="선택한 코스의 메타데이터, 주차/차시 타임라인, 공지와 자료를 오른쪽 패널에서 확인할 수 있습니다."
          />
        </div>
      )}

      {course ? (
        <div className="grid grid-cols-2 gap-3 border-t border-white/10 bg-white px-5 py-5 text-slate-900 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">총 강의 수</div>
            <div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">{course.lecture_count}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">총 러닝타임</div>
            <div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">{formatDuration(course.total_duration_minutes)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">평점</div>
            <div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">{course.rating.toFixed(1)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">수강생</div>
            <div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">{course.student_count}</div>
          </div>
        </div>
      ) : null}

      <div className="px-5 py-5">
        {course ? (
          <>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0.5">
              {courseTabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                      active ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <i className={`${tab.icon} text-[15px]`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-5">
              {activeTab === '강의' ? (
                <div className="space-y-5">
                  <CourseSessionTimeline
                    course={course}
                    selectedLectureId={selectedLectureId}
                    onSelectLecture={onSelectLecture}
                    onOpenLecture={(lectureId) => {
                      onSelectLecture(lectureId);
                      onNavigate('lecture-watch');
                    }}
                  />
                  {detailLecture ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-slate-500">선택한 차시</div>
                          <div className="mt-1 text-[16px] font-bold text-slate-900">{detailLecture.title}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>{detailLecture.course_title}</span>
                            <span>·</span>
                            <span>{detailLecture.course_instructor}</span>
                            <span>·</span>
                            <span>{formatDuration(getLectureDisplayDurationMinutes(detailLecture))}</span>
                          </div>
                        </div>
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[18px] text-indigo-500 shadow-sm">
                          <i className="ri-play-circle-line" />
                        </div>
                      </div>
                      <p className="mt-4 text-[13px] leading-7 text-slate-600">
                        {viewMode === 'watch' ? detailLecture.transcript_excerpt : course.description}
                      </p>
                      {viewMode === 'watch' && detailLecture.video_url ? (
                        isLocked ? (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                            <div className="text-[12px] font-semibold text-amber-700">수강 신청이 필요합니다.</div>
                            <p className="mt-2 text-[13px] leading-6 text-amber-900/80">
                              이 차시의 영상을 보려면 먼저 강의를 수강 신청해야 합니다.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => course && onEnroll(course.id)}
                                className="rounded-full bg-amber-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-amber-400"
                              >
                                수강 신청하기
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigate('my-courses')}
                                className="rounded-full border border-amber-200 bg-white px-4 py-2 text-[12px] font-semibold text-amber-700 transition hover:bg-amber-100"
                              >
                                내 강의로 이동
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black">
                            <video
                              className="h-auto w-full max-h-[240px]"
                              controls
                              preload="metadata"
                              src={protectedVideoUrl}
                            />
                          </div>
                        )
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {viewMode === 'watch' ? (
                          <>
                            {isLocked ? (
                              <button
                                type="button"
                                onClick={() => course && onEnroll(course.id)}
                                className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                              >
                                수강 신청하기
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onNavigate('courses')}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  강의 상세로 돌아가기
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
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {isLocked ? (
                              <button
                                type="button"
                                onClick={() => course && onEnroll(course.id)}
                                className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                              >
                                수강 신청하기
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectLecture(detailLecture.id);
                                    onNavigate('lecture-watch');
                                  }}
                                  className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                                >
                                  강의 시청으로 이동
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigate('ai-chat')}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  챗봇으로 질문
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : activeTab === '공지' ? (
                renderNoticeList(course)
              ) : activeTab === '자료' ? (
                renderMaterialList(course)
              ) : (
                <div className="space-y-3">
                  {isLocked ? (
                    <StatePanel
                      compact
                      icon="ri-lock-line"
                      tone="amber"
                      title="수강 신청 후 Q&A를 사용할 수 있습니다."
                      description="질문 검색과 강의 내용 탐색은 수강 신청한 뒤 활성화됩니다."
                    />
                  ) : (
                    <StatePanel
                      compact
                      icon="ri-question-line"
                      tone="slate"
                      title="Q&A는 강의 내용 검색으로 연결됩니다."
                      description="질문은 우측 챗봇에서 먼저 바로 물어보고, 필요한 경우 강의 시청 화면으로 이어서 확인할 수 있습니다."
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => course && onEnroll(course.id)}
                        className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                      >
                        수강 신청하기
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigate('ai-chat')}
                          className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                        >
                          AI 챗봇으로 질문하기
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('lecture-watch')}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                          강의 시청으로 이동
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <StatePanel
            compact
            icon="ri-play-circle-line"
            tone="amber"
            title="강의를 선택하면 상세가 펼쳐집니다."
            description="선택한 코스의 주차/차시 타임라인, 공지, 자료가 이 영역에 표시됩니다."
          />
        )}
      </div>
    </section>
  );
}
