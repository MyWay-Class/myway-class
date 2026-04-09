import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';

type CoursesPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
};

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

function formatLectureUrl(url: string): string {
  return url.replace('/static/media/', '/media/');
}

function formatLectureLabel(lectureId: string): string {
  return lectureId.replace(/^lec_/, '').toUpperCase();
}

export function CoursesPage({
  courses,
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  onSelectCourse,
  onSelectLecture,
}: CoursesPageProps) {
  const course = selectedCourse;
  const detailLecture = highlightedLecture;

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
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">코스 상세</h3>
              <p className="mt-1 text-[12px] text-slate-500">선택한 코스의 전반적인 메타데이터와 강의 상세를 함께 확인합니다.</p>
            </div>
            {selectedCourse ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">{selectedCourse.category}</span> : null}
          </div>

          {course ? (
            <div className="mt-4 space-y-4">
              <div className={`overflow-hidden rounded-3xl ${paletteClasses[course.thumbnail_palette].panel} p-5 text-white`}>
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold opacity-90">
                  <span>{difficultyLabel[course.difficulty]}</span>
                  <span>{course.rating.toFixed(1)} / 5.0</span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[13px] font-semibold opacity-90">{course.instructor_name}</div>
                    <div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em]">{course.title}</div>
                  </div>
                  <div className="text-right text-[11px] opacity-90">
                    <div>수강생 {course.student_count}명</div>
                    <div>{formatDuration(course.total_duration_minutes)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <div className="text-[12px] font-semibold text-slate-500">설명</div>
                <p className="mt-2 text-[13px] leading-7 text-slate-500">{course.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <StatePanel
                compact
                icon="ri-cursor-line"
                tone="violet"
                title="코스를 선택하세요."
                description="선택한 코스의 메타데이터, 강의 목록, 태그를 오른쪽 패널에서 확인할 수 있습니다."
              />
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">강의 상세</h3>
          {detailLecture ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">{detailLecture.course_title}</div>
                <div className="mt-1 text-[16px] font-bold text-slate-900">{detailLecture.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span>{detailLecture.course_instructor}</span>
                  <span>·</span>
                  <span>{formatDuration(detailLecture.duration_minutes)}</span>
                  <span>·</span>
                  <span>{formatLectureLabel(detailLecture.id)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-[12px] text-slate-500">비디오 URL</div>
                  <div className="mt-1 break-all text-[12px] font-semibold text-slate-900">{formatLectureUrl(detailLecture.video_url)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-[12px] text-slate-500">키워드</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailLecture.keywords.map((keyword) => (
                      <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[12px] font-semibold text-slate-500">전사 미리보기</div>
                <p className="mt-2 text-[13px] leading-7 text-slate-600">{detailLecture.transcript_excerpt}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-[12px] font-semibold text-slate-500">강의 목록</div>
                <div className="mt-3 space-y-2">
                  {course!.lectures.map((lecture) => {
                    const isActive = lecture.id === selectedLectureId;
                    return (
                      <button
                        key={lecture.id}
                        type="button"
                        onClick={() => onSelectLecture(lecture.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          isActive ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-[13px] font-semibold text-slate-900">{lecture.title}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{formatDuration(lecture.duration_minutes)} · {lecture.content_type}</div>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500">
                          {isActive ? '선택됨' : '보기'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <StatePanel
                compact
                icon="ri-play-circle-line"
                tone="amber"
                title="강의를 선택하면 상세가 펼쳐집니다."
                description="transcript 미리보기, 비디오 URL, 키워드가 여기에 표시됩니다."
              />
            </div>
          )}
        </section>

        {course ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
            <h3 className="text-[15px] font-bold text-slate-900">부가 정보</h3>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">materials</div>
                <div className="mt-1 text-[14px] font-semibold text-slate-900">{course.materials.length}개</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">notices</div>
                <div className="mt-1 text-[14px] font-semibold text-slate-900">{course.notices.length}개</div>
              </div>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
