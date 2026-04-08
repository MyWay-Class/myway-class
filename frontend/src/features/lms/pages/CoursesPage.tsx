import type { CourseCard } from '@myway/shared';

type CoursesPageProps = {
  courses: CourseCard[];
  onSelectCourse: (courseId: string) => void;
};

const difficultyLabel: Record<CourseCard['difficulty'], string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

export function CoursesPage({ courses, onSelectCourse }: CoursesPageProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">강의 목록</h2>
            <p className="mt-1 text-[12px] text-slate-500">우리 프로젝트의 코스 데이터를 레퍼런스 스타일 카드에 연결한 화면입니다.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">{courses.length}개 강의</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:grid-cols-2">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelectCourse(course.id)}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          >
            <div className="h-32 bg-[linear-gradient(135deg,#eef2ff,#f5f3ff)]" />
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">{difficultyLabel[course.difficulty]}</span>
                <span className="text-[12px] text-slate-400">{course.lecture_count} 강의</span>
              </div>
              <h3 className="text-[15px] font-bold leading-7 tracking-[-0.02em] text-slate-900">{course.title}</h3>
              <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500">{course.description}</p>
              <div className="mt-4 flex items-center justify-between text-[12px] text-slate-500">
                <span>{course.instructor_name}</span>
                <span>{course.enrolled ? `${course.progress_percent}% 진행` : course.category}</span>
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
