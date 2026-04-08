import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, isActive = false, onClick, className = '' }: CardProps) {
  const interactive = Boolean(onClick);

  return (
    <article
      className={[
        'rounded-[28px] border bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] transition',
        'border-[color:var(--line)] text-[color:var(--text)]',
        interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:shadow-[var(--shadow)]' : '',
        isActive ? 'border-[color:var(--line-strong)] ring-1 ring-[color:var(--accent-soft-strong)]' : '',
        className,
      ].join(' ')}
      onClick={onClick}
      role={interactive ? 'button' : 'region'}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </article>
  );
}
