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
        'rounded-2xl border bg-[var(--bg-card)] p-4 shadow-sm transition',
        'border-[color:var(--line)] text-[color:var(--text)]',
        interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : '',
        isActive ? 'border-teal-300 ring-1 ring-teal-200/80' : '',
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
