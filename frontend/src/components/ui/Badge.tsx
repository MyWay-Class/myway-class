import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'neutral';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  primary: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
};

export function Badge({ children, variant = 'primary' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={[
      'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
      BADGE_STYLES[variant],
    ].join(' ')}>
      {children}
    </span>
  );
}
