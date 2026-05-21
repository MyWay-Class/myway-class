import { describe, expect, it } from 'vitest';
import { normalizeBatchPipelineStatus } from './admin-automation-utils';

describe('normalizeBatchPipelineStatus', () => {
  it('returns non-negative counts and safe defaults', () => {
    const normalized = normalizeBatchPipelineStatus({
      success_count: -3,
      failure_count: 2,
      pending_count: Number.NaN,
      last_run_at: null,
      failed_lectures: [] as never[],
    });

    expect(normalized.success_count).toBe(0);
    expect(normalized.failure_count).toBe(2);
    expect(normalized.pending_count).toBe(0);
    expect(normalized.last_run_at).toBeNull();
    expect(normalized.failed_lectures).toEqual([]);
  });
});
