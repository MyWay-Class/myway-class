import { useEffect, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseSessionTimeline } from '../components/CourseSessionTimeline';
import { StatePanel } from '../components/StatePanel';

type CoursesPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
};

type CourseTab = '강의' | '공지' | '자료' | 'Q&A';

const difficultyLabel: Record<CourseCard['difficulty'], string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

const paletteClasses: Record<CourseCard['thumbnail_palette'], { panel: string; chip: string; line: string; icon: string }> = {
  indigo: {
    panel: 'bg-[linear-gradient(135deg,#4338ca,#1d4ed8)]',
    chip: 'bg-indigo-50 text-indigo-600',
    line: 'bg-indigo-500',
    icon: 'ri-brain-line',
  },
  emerald: {
    panel: 'bg-[linear-gradient(135deg,#047857,#10b981)]',
    chip: 'bg-emerald-50 text-emerald-600',
    line: 'bg-emerald-500',
    icon: 'ri-layout-grid-line',
  },
  violet: {
    panel: 'bg-[linear-gradient(135deg,#6d28d9,#8b5cf6)]',
    chip: 'bg-violet-50 text-violet-600',
    line: 'bg-violet-500',
    icon: 'ri-video-line',
  },
  amber: {
    panel: 'bg-[linear-gradient(135deg,#b45309,#f59e0b)]',
    chip: 'bg-amber-50 text-amber-700',
    line: 'bg-amber-500',
    icon: 'ri-lightbulb-flash-line',
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

const courseTabs: { key: CourseTab; label: string; icon: string }[] = [
  { key: '강의', label: '강의', icon: 'ri-play-circle-line' },
  { key: '공지', label: '공지', icon: 'ri-megaphone-line' },
  { key: '자료', label: '자료', icon: 'ri-folder-line' },
  { key: 'Q&A', label: 'Q&A', icon: 'ri-question-line' },
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

export function CoursesPage({
  courses,
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  onSelectCourse,
  onSelectLecture,
}: CoursesPageProps) {
  const [activeTab, setActiveTab] = useState<CourseTab>('강의');
  const course = selectedCourse;
  const detailLecture = highlightedLecture;

  useEffect(() => {
    setActiveTab('강의');
  }, [course?.id]);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">강의 목록</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                썸네일, 평점, 수강생 수, 총 러닝타임을 함께 보여주어 코스 선택에 필요한 신호를 한눈에 확인합니다.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">{courses.length}개 강의</span>
          </div>
        </article>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          {courses.length > 0 ? courses.map((course) => {
            const palette = paletteClasses[course.thumbnail_palette];
            const selected = selectedCourse?.id === course.id;

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
                className={`overflow-hidden rounded-3xl border bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
                  selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <div className={`flex h-36 flex-col justify-between px-5 py-4 text-white ${palette.panel}`}>
                  <div className="flex items-center justify-between gap-3 text-[11px] font-semibold opacity-90">
                    <span>{course.category}</span>
                    <span>{difficultyLabel[course.difficulty]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold opacity-90">{course.instructor_name}</div>
                      <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em]">{course.title}</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[24px]">
                      <i className={palette.icon} />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${palette.chip}`}>{course.rating.toFixed(1)}점</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      수강생 {course.student_count}명
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      {formatDuration(course.total_duration_minutes)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px] text-slate-500">
                      <span>{course.lecture_count}개 강의</span>
                      <span>{course.enrolled ? `${course.progress_percent}% 진행` : course.category}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-2 ${palette.line}`} style={{ width: `${Math.max(course.progress_percent, 12)}%` }} />
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-[13px] leading-6 text-slate-500">{course.description}</p>
                </div>
              </button>
            );
          }) : (
            <div className="md:col-span-2">
              <StatePanel
                icon="ri-book-open-line"
                tone="indigo"
                title="수강 가능한 강의가 아직 없습니다."
                description="강의가 추가되면 카드형 목록, 평점, 러닝타임, 수강 현황이 함께 표시됩니다."
              />
            </div>
          )}
        </section>
      </section>

      <aside className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          {course ? (
            <div className={`px-5 py-5 text-white ${paletteClasses[course.thumbnail_palette].panel}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold opacity-90">
                    <span className="rounded-full bg-white/15 px-2.5 py-1">{course.category}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1">{difficultyLabel[course.difficulty]}</span>
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
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0.5">
            {courseTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                    active
                      ? 'border-indigo-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <i className={`${tab.icon} text-[15px]`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pt-5">
            {course ? (
              <>
                {activeTab === '강의' ? (
                  <div className="space-y-5">
                    <CourseSessionTimeline course={course} selectedLectureId={selectedLectureId} onSelectLecture={onSelectLecture} />
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
                              <span>{formatDuration(detailLecture.duration_minutes)}</span>
                            </div>
                          </div>
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[18px] text-indigo-500 shadow-sm">
                            <i className="ri-play-circle-line" />
                          </div>
                        </div>
                        <p className="mt-4 text-[13px] leading-7 text-slate-600">{detailLecture.transcript_excerpt}</p>
                      </div>
                    ) : null}
                  </div>
                ) : activeTab === '공지' ? (
                  renderNoticeList(course)
                ) : activeTab === '자료' ? (
                  renderMaterialList(course)
                ) : (
                  <StatePanel
                    compact
                    icon="ri-question-line"
                    tone="slate"
                    title="Q&A 영역은 준비 중입니다."
                    description="레퍼런스의 탭 레이아웃은 유지하고, 실제 Q&A 데이터는 다음 단계에서 연결할 수 있게 비워두었습니다."
                  />
                )}
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
      </aside>
    </div>
  );
}
