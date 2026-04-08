import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'neutral';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  primary: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  neutral: 'bg-[#f3f5fb] text-[#6d7891]',
};

export function Badge({ children, variant = 'primary' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={[
      'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold',
      BADGE_STYLES[variant],
    ].join(' ')}>
      {children}
    </span>
  );
}
