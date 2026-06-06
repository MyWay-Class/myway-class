import type { CourseCard } from '@myway/shared';

type AdminAssignPageInstructorSectionProps = {
  selectedCourse: CourseCard | null;
  courses: CourseCard[];
  onSelectedCourseChange: (courseId: string) => void;
};

export function AdminAssignPageInstructorSection({ selectedCourse, courses, onSelectedCourseChange }: AdminAssignPageInstructorSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <h2 className="text-[15px] font-bold text-slate-900">강사 배정</h2>
      <p className="mt-1 text-[12px] text-slate-500">강의별 담당 교강사를 정리한 운영용 매핑 화면입니다.</p>
      <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">현재 선택 강의</div>
        <div className="mt-1 text-[14px] font-bold text-slate-900">{selectedCourse?.title ?? '강의 없음'}</div>
        <div className="mt-1 text-[12px] text-slate-600">{selectedCourse?.instructor_name ?? '담당 교강사 없음'}</div>
      </div>
      <div className="mt-4 space-y-2">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelectedCourseChange(course.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              selectedCourse?.id === course.id ? 'border-cyan-300 bg-cyan-50/60' : 'border-slate-200 hover:border-cyan-200 hover:bg-cyan-50/30'
            }`}
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <i className="ri-book-open-line" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
              <div className="mt-0.5 text-[12px] text-slate-500">{course.instructor_name}</div>
            </div>
            <i className="ri-arrow-right-s-line text-slate-400" />
          </button>
        ))}
      </div>
    </section>
  );
}
