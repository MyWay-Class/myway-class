import { describe, expect, it } from 'vitest';
import type { AIReference } from '@myway/shared';
import { extractReferenceStartMs, formatSeekTimecode } from './chat-reference-time';

function createReference(overrides: Partial<AIReference> = {}): AIReference {
  return {
    id: 'ref-1',
    lecture_id: 'lec-1',
    source_type: 'transcript',
    source_id: 'src-1',
    title: '참고',
    excerpt: '본문',
    content: '본문',
    similarity: 0.87,
    chunk_index: 0,
    ...overrides,
  };
}

describe('chat reference time', () => {
  it('prefers explicit start_ms when present', () => {
    const ref = createReference({}) as AIReference & { start_ms: number };
    ref.start_ms = 91_000;
    expect(extractReferenceStartMs(ref)).toBe(91_000);
  });

  it('extracts mm:ss from excerpt when explicit fields are absent', () => {
    const ref = createReference({ excerpt: '핵심 정리 (02:35) 구간' });
    expect(extractReferenceStartMs(ref)).toBe(155_000);
  });

  it('formats seek timecode with hours when needed', () => {
    expect(formatSeekTimecode(3_661_000)).toBe('1:01:01');
  });
});
