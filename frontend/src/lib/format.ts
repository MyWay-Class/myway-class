import type { CourseDifficulty } from '@myway/shared';

export function formatDifficulty(value: CourseDifficulty): string {
  switch (value) {
    case 'beginner':
      return '입문';
    case 'intermediate':
      return '중급';
    case 'advanced':
      return '고급';
    default:
      return value;
  }
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}
