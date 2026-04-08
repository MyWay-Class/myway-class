import type { CourseCard } from '@myway/shared';

type QuizGenPageProps = {
  courses: CourseCard[];
};

export function QuizGenPage({ courses }: QuizGenPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">시험·퀴즈 자동 생성</h2>
        <p className="mt-1 text-[12px] text-slate-500">강의 기반 문제 생성 화면을 레퍼런스 톤으로 정리한 페이지입니다.</p>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {courses.slice(0, 2).map((course) => (
          <article key={course.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
            <div className="text-[14px] font-semibold text-slate-900">{course.title}</div>
            <div className="mt-1 text-[12px] text-slate-500">{course.instructor_name}</div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[13px] leading-7 text-slate-600">
              객관식 5문항, 단답형 2문항, 서술형 1문항 구성을 추천합니다.
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
