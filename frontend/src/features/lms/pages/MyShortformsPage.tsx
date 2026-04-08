import type { CourseCard } from '@myway/shared';

type MyShortformsPageProps = {
  courses: CourseCard[];
};

export function MyShortformsPage({ courses }: MyShortformsPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">내 숏폼</h2>
        <p className="mt-1 text-[12px] text-slate-500">내가 만든 숏폼이나 저장한 학습 클립을 정리하는 페이지입니다.</p>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.slice(0, 3).map((course) => (
          <article key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="aspect-video bg-[linear-gradient(135deg,#312e81,#4f46e5)]" />
            <div className="px-5 py-4">
              <div className="text-[14px] font-semibold text-slate-900">{course.title}</div>
              <div className="mt-1 text-[12px] text-slate-500">{course.instructor_name}</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
