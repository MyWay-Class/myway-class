import type { DashboardActivity } from '@myway/shared';

type DashboardTimelineProps = {
  title: string;
  subtitle: string;
  activities: DashboardActivity[];
  emptyMessage: string;
};

const toneClasses: Record<DashboardActivity['tone'], { icon: string; line: string; badge: string }> = {
  indigo: {
    icon: 'bg-cyan-100 text-cyan-700',
    line: 'border-cyan-200',
    badge: 'bg-cyan-50 text-cyan-700',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    line: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-600',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    line: 'border-violet-200',
    badge: 'bg-violet-50 text-violet-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    line: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-600',
    line: 'border-slate-200',
    badge: 'bg-slate-50 text-slate-600',
  },
};

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return '방금 전';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}일 전`;
}

export function DashboardTimeline({ title, subtitle, activities, emptyMessage }: DashboardTimelineProps) {
  return (
    <section className="rounded-[30px] border border-[var(--app-border)] bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--app-text)]">{title}</h3>
          <p className="mt-1 text-[12px] text-[var(--app-text-muted)]">{subtitle}</p>
        </div>
        <span className="rounded-full bg-[var(--app-surface-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--app-text-secondary)]">{activities.length}개 활동</span>
      </div>

      {activities.length ? (
        <div className="mt-4 space-y-3">
          {activities.map((activity) => {
            const tone = toneClasses[activity.tone];
            const meta = [activity.course_title, activity.lecture_title].filter(Boolean).join(' · ');

            return (
              <article key={activity.id} className={`rounded-[24px] border px-4 py-4 ${tone.line} bg-[var(--app-surface-soft)]`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl text-[18px] ${tone.icon}`}>
                    <i className={activity.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-[var(--app-text)]">{activity.title}</h4>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>{formatRelativeTime(activity.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-6 text-[var(--app-text-secondary)]">{activity.detail}</p>
                    {meta ? <div className="mt-2 text-[11px] text-[var(--app-text-muted)]">{meta}</div> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-6 text-center text-[13px] leading-6 text-[var(--app-text-secondary)]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
