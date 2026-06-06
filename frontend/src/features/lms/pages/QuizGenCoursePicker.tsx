import type { CourseCard } from '@myway/shared';

export function QuizGenCoursePicker({
  courses,
  selectedCourseId,
  onSelectCourse,
}: {
  courses: CourseCard[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <i className="ri-book-open-line text-cyan-700" />
        강의 선택
      </h3>
      <div className="mt-4 space-y-2">
        {courses.map((course) => {
          const active = selectedCourseId === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course.id)}
              className={`flex w-full items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                active ? 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-100' : 'border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-white'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-[20px] text-cyan-700">
                <i className="ri-play-circle-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-1 text-[12px] text-slate-500">
                  {course.category} · {course.instructor_name} · {course.lecture_count}차시
                </div>
              </div>
              <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-700">{course.progress_percent}%</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
