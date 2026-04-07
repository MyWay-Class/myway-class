import type { CourseCard } from '@myway/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDifficulty, formatPercentage } from '../../lib/format';

interface CourseCardItemProps {
  course: CourseCard;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function CourseCardItem({ course, isActive, onSelect }: CourseCardItemProps) {
  return (
    <Card isActive={isActive} onClick={() => onSelect(course.id)}>
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{course.category}</Badge>
        {course.enrolled && <Badge variant="neutral">수강 중</Badge>}
      </div>
      <strong className="mt-1 block">{course.title}</strong>
      <p className="m-0 leading-6 text-[var(--muted)]">{course.description}</p>

      <dl className="m-0 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-[0.76rem] text-[var(--muted)]">난이도</dt>
          <dd className="mt-0.5 font-bold">{formatDifficulty(course.difficulty)}</dd>
        </div>
        <div>
          <dt className="text-[0.76rem] text-[var(--muted)]">강의</dt>
          <dd className="mt-0.5 font-bold">{course.lecture_count}개</dd>
        </div>
        <div>
          <dt className="text-[0.76rem] text-[var(--muted)]">진도</dt>
          <dd className="mt-0.5 font-bold">{formatPercentage(course.progress_percent)}</dd>
        </div>
      </dl>
    </Card>
  );
}
