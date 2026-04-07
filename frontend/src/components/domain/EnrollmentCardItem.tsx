import type { CourseCard } from '@myway/shared';
import { Card } from '../ui/Card';

export function EnrollmentCardItem({ course }: { course: CourseCard }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <strong className="text-[0.98rem]">{course.title}</strong>
        <span className="font-extrabold text-teal-700 dark:text-teal-300">{course.progress_percent}%</span>
      </div>
      <p className="mb-3 m-0 text-sm leading-6 text-[var(--muted)]">
        완료 {course.completed_lectures} / {course.lecture_count} · {course.category}
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-700"
          style={{ width: `${course.progress_percent}%` }}
        />
      </div>
    </Card>
  );
}
