import type { CourseCard } from '@myway/shared';

type AssignmentCheckPageProps = {
  courses: CourseCard[];
};

export function AssignmentCheckPage({ courses }: AssignmentCheckPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">과제 검사</h2>
        <p className="mt-1 text-[12px] text-slate-500">과제 제출물 점검, 피드백, 검수 상태를 한 번에 보는 교강사용 화면입니다.</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div className="space-y-2">
          {courses.slice(0, 3).map((course, index) => (
            <div key={course.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <i className="ri-file-check-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">검토 대기 제출물 {index + 2}건</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
