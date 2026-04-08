import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white shadow-[0_18px_35px_rgba(111,99,246,0.28)] hover:brightness-105 focus-visible:outline-[var(--accent)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] focus-visible:outline-[var(--accent)]',
  outline:
    'border border-[color:var(--line-strong)] bg-white text-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-[var(--accent)]',
};

export function Button({ variant = 'primary', className = '', children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANT_STYLES[variant],
        className,
      ].join(' ')}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
