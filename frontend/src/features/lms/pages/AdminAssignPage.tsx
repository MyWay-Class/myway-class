import type { AuthUser, CourseCard } from '@myway/shared';

type AdminAssignPageProps = {
  users: AuthUser[];
  courses: CourseCard[];
};

export function AdminAssignPage({ users, courses }: AdminAssignPageProps) {
  const students = users.filter((user) => user.role === 'STUDENT');
  const instructors = users.filter((user) => user.role === 'INSTRUCTOR');

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">강사 배정</h2>
        <p className="mt-1 text-[12px] text-slate-500">강의별 담당 교강사를 정리한 운영용 매핑 화면입니다.</p>
        <div className="mt-4 space-y-2">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <i className="ri-book-open-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{course.instructor_name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">수강생 그룹</h2>
        <p className="mt-1 text-[12px] text-slate-500">운영자가 역할별 분포와 수강생 배정 대상을 빠르게 확인할 수 있습니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-slate-500">교강사</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{instructors.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-slate-500">수강생</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{students.length}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {students.slice(0, 6).map((student) => (
            <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <i className="ri-user-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{student.name}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{student.department}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
