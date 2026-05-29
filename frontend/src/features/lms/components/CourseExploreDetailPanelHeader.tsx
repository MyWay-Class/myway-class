import type { CourseDetail } from '@myway/shared';
import { StatePanel } from './StatePanel';
import { formatDuration } from './CourseExploreDetailPanelSections';

export function CourseExploreDetailHeader({ course }: { course: CourseDetail | null }) {
  if (!course) {
    return (
      <div className="px-5 py-5">
        <StatePanel icon="ri-cursor-line" tone="violet" title="코스를 선택하세요." description="선택한 코스의 메타데이터, 주차/차시 타임라인, 공지와 자료를 오른쪽 패널에서 확인할 수 있습니다." />
      </div>
    );
  }

  const safeRating = Number.isFinite(course.rating) ? course.rating : 0;

  return (
    <>
      <div className="bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-5 py-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold opacity-90">
              <span className="rounded-full bg-white/15 px-2.5 py-1">{course.category}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">{course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}</span>
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.04em]">{course.title}</h1>
            <p className="mt-2 text-[13px] leading-6 text-white/80">{course.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-white/80">
              <span>{course.instructor_name}</span><span>·</span><span>{course.lecture_count}강의</span><span>·</span><span>{course.student_count}명 수강</span><span>·</span><span>{formatDuration(course.total_duration_minutes)}</span>
            </div>
          </div>
          <div className="flex-shrink-0 rounded-3xl bg-white/10 px-4 py-4 text-center backdrop-blur">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray={`${course.progress_percent} ${100 - course.progress_percent}`} strokeLinecap="round" />
              </svg>
              <span className="absolute text-[13px] font-bold">{course.progress_percent}%</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-white/70">{course.enrolled ? '진행률' : '미수강'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-5 text-[var(--app-text)] md:grid-cols-4">
        <div className="rounded-2xl bg-white px-4 py-4"><div className="text-[12px] text-[var(--app-text-muted)]">총 강의 수</div><div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{course.lecture_count}</div></div>
        <div className="rounded-2xl bg-white px-4 py-4"><div className="text-[12px] text-[var(--app-text-muted)]">총 러닝타임</div><div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{formatDuration(course.total_duration_minutes)}</div></div>
        <div className="rounded-2xl bg-white px-4 py-4"><div className="text-[12px] text-[var(--app-text-muted)]">평점</div><div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{safeRating.toFixed(1)}</div></div>
        <div className="rounded-2xl bg-white px-4 py-4"><div className="text-[12px] text-[var(--app-text-muted)]">수강생</div><div className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--app-text)]">{course.student_count}</div></div>
      </div>
    </>
  );
}
