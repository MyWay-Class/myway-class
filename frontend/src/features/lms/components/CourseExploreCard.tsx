import type { CourseCard } from '@myway/shared';

type CourseExploreCardProps = {
  course: CourseCard;
  selected: boolean;
  onSelect: (courseId: string) => void;
  onOpen?: (courseId: string) => void;
};

const difficultyLabel: Record<CourseCard['difficulty'], string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

const paletteClasses: Record<CourseCard['thumbnail_palette'], { panel: string; chip: string; line: string; icon: string }> = {
  indigo: {
    panel: 'bg-[linear-gradient(135deg,#4338ca,#1d4ed8)]',
    chip: 'bg-indigo-50 text-indigo-600',
    line: 'bg-indigo-500',
    icon: 'ri-brain-line',
  },
  emerald: {
    panel: 'bg-[linear-gradient(135deg,#047857,#10b981)]',
    chip: 'bg-emerald-50 text-emerald-600',
    line: 'bg-emerald-500',
    icon: 'ri-layout-grid-line',
  },
  violet: {
    panel: 'bg-[linear-gradient(135deg,#6d28d9,#8b5cf6)]',
    chip: 'bg-violet-50 text-violet-600',
    line: 'bg-violet-500',
    icon: 'ri-video-line',
  },
  amber: {
    panel: 'bg-[linear-gradient(135deg,#b45309,#f59e0b)]',
    chip: 'bg-amber-50 text-amber-700',
    line: 'bg-amber-500',
    icon: 'ri-lightbulb-flash-line',
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function CourseExploreCard({ course, selected, onSelect, onOpen }: CourseExploreCardProps) {
  const palette = paletteClasses[course.thumbnail_palette] ?? paletteClasses.indigo;
  const tags = Array.isArray(course.tags) ? course.tags : [];
  const safeRating = Number.isFinite(course.rating) ? course.rating : 0;
  const safeStudentCount = Number.isFinite(course.student_count) ? course.student_count : 0;
  const safeDurationMinutes = Number.isFinite(course.total_duration_minutes) ? course.total_duration_minutes : 0;
  const safeLectureCount = Number.isFinite(course.lecture_count) ? course.lecture_count : 0;
  const safeProgressPercent = Number.isFinite(course.progress_percent) ? course.progress_percent : 0;

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(course.id);
        onOpen?.(course.id);
      }}
      className={`group overflow-hidden rounded-[24px] border bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-[var(--app-border)]'
      }`}
    >
      <div className={`relative flex h-32 flex-col justify-between px-5 py-4 text-white ${palette.panel}`}>
        <div className="absolute inset-0 opacity-15">
          <i className={`${palette.icon} absolute -right-4 -bottom-4 text-[104px]`} />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3 text-[11px] font-semibold opacity-90">
          <span>{course.category}</span>
          <span>{difficultyLabel[course.difficulty]}</span>
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold opacity-90">{course.instructor_name}</div>
            <div className="mt-1 line-clamp-2 text-[18px] font-extrabold">{course.title}</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[24px]">
            <i className={palette.icon} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${palette.chip}`}>{safeRating.toFixed(1)}점</span>
          <span className="rounded-full bg-[var(--app-surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-text-secondary)]">
            수강생 {safeStudentCount}명
          </span>
          <span className="rounded-full bg-[var(--app-surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-text-secondary)]">
            {formatDuration(safeDurationMinutes)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px] text-[var(--app-text-secondary)]">
            <span>{safeLectureCount}개 강의</span>
            <span>{course.enrolled ? `${safeProgressPercent}% 진행` : '수강 대기'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
            <div className={`h-2 ${palette.line}`} style={{ width: `${Math.max(safeProgressPercent, 12)}%` }} />
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-[13px] leading-6 text-[var(--app-text-secondary)]">{course.description}</p>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[var(--app-surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-text-secondary)]">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}
