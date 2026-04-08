import type { AuthUser, CourseCard } from '@myway/shared';

type AdminInstructorsPageProps = {
  instructors: AuthUser[];
  courses: CourseCard[];
};

export function AdminInstructorsPage({ instructors, courses }: AdminInstructorsPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">강사 관리</h2>
            <p className="mt-1 text-[12px] text-slate-500">교강사별 담당 과목과 상태를 운영자가 한 번에 보는 화면입니다.</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-600">{instructors.length}명</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {instructors.map((instructor) => {
          const ownCourses = courses.filter((course) => course.instructor_name === instructor.name);
          return (
            <article key={instructor.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-[16px] font-bold text-violet-600">
                  {instructor.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">{instructor.name}</div>
                  <div className="mt-1 text-[12px] text-slate-500">
                    {instructor.email} · {instructor.department}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ownCourses.length ? (
                      ownCourses.map((course) => (
                        <span key={course.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {course.title}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">배정 과목 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
