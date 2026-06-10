import { describe, expect, it } from 'vitest';
import { buildLectureTranscriptFallback } from './lectureTranscriptFallback';

describe('lecture transcript fallback', () => {
  it('builds timestamped chunks from lecture content', () => {
    const transcript = buildLectureTranscriptFallback({
      id: 'lec-test-1',
      course_id: 'crs-test-1',
      title: '테스트 강의',
      content_text: '첫 문장입니다. 두 번째 문장입니다.',
      duration_minutes: 2,
    } as never);

    expect(transcript).not.toBeNull();
    expect(transcript?.lecture_id).toBe('lec-test-1');
    expect(transcript?.segments.length).toBeGreaterThan(0);
    expect(transcript?.segments[0]?.start_ms).toBe(0);
    expect(transcript?.segments[0]?.end_ms).toBeGreaterThan(0);
    expect(transcript?.full_text).toContain('첫 문장입니다');
  });
});
