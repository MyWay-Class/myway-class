import type { CSSProperties } from 'react';

type SkeletonType = 'text' | 'title' | 'card' | 'avatar';

const SKELETON_STYLES: Record<SkeletonType, string> = {
  text: 'h-3 w-24 rounded-full',
  title: 'h-7 w-40 rounded-xl',
  card: 'h-44 rounded-2xl',
  avatar: 'h-12 w-12 rounded-full',
};

export function Skeleton({
  type = 'text',
  className = '',
  style,
}: {
  type?: SkeletonType;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse bg-slate-200/90 dark:bg-white/10', SKELETON_STYLES[type], className].join(' ')}
      style={style}
    />
  );
}
