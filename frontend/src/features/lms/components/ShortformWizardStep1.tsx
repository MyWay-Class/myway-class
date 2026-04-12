import type { CourseCard, LectureDetail } from '@myway/shared';

type ShortformWizardStep1Props = {
  courses: CourseCard[];
  activeCourseId: string | null;
  courseTitle?: string | null;
  highlightedLecture?: LectureDetail | null;
  onSelectCourse: (courseId: string) => void;
  onUseHighlightedLecture: () => void;
  onNext: () => void;
  canContinue: boolean;
};

export function ShortformWizardStep1({
  courses,
  activeCourseId,
  courseTitle,
  highlightedLecture,
  onSelectCourse,
  onUseHighlightedLecture,
  onNext,
  canContinue,
}: ShortformWizardStep1Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center gap-2">
        <i className="ri-book-open-line text-[18px] text-indigo-500" />
        <h2 className="text-[15px] font-bold text-slate-900">강좌 선택</h2>
      </div>
      <p className="mt-1 text-[12px] text-slate-500">
        내 강의 목록에서 숏폼을 조립할 강좌를 선택합니다. 선택 후 다음 단계로 넘어가면 차시별 구간이 펼쳐집니다.
      </p>
      {highlightedLecture ? (
        <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-indigo-600">현재 차시</div>
              <div className="mt-1 text-[14px] font-bold text-slate-900">{highlightedLecture.title}</div>
              <div className="mt-1 text-[12px] leading-6 text-slate-500">
                선택한 차시를 기준으로 바로 숏폼 구간을 좁혀볼 수 있습니다.
              </div>
            </div>
            <button
              type="button"
              onClick={onUseHighlightedLecture}
              className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
            >
              이 차시로 시작
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {courses.map((course) => {
          const active = activeCourseId === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course.id)}
              className={`overflow-hidden rounded-3xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
                active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="bg-[linear-gradient(135deg,#4338ca,#1d4ed8)] px-5 py-4 text-white">
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold opacity-90">
                  <span>{course.category}</span>
                  <span>{course.enrolled ? '수강 중' : '전체'}</span>
                </div>
                <div className="mt-4">
                  <div className="text-[13px] font-semibold opacity-90">{course.instructor_name}</div>
                  <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em]">{course.title}</div>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600">{course.lecture_count}강의</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">{course.student_count}명</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-slate-500">{course.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-slate-500">{courseTitle ?? '선택된 강좌가 없습니다.'}</p>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
        >
          다음: 구간 선택 <i className="ri-arrow-right-line ml-1" />
        </button>
      </div>
    </article>
  );
}
