import type { BatchPipelineStatus } from '../../../lib/api-admin-automation';

export function normalizeBatchPipelineStatus(input: BatchPipelineStatus | null | undefined): BatchPipelineStatus {
  if (!input) {
    return {
      success_count: 0,
      failure_count: 0,
      pending_count: 0,
      last_run_at: null,
      failed_lectures: [],
    };
  }

  return {
    success_count: Number.isFinite(input.success_count) ? Math.max(0, input.success_count) : 0,
    failure_count: Number.isFinite(input.failure_count) ? Math.max(0, input.failure_count) : 0,
    pending_count: Number.isFinite(input.pending_count) ? Math.max(0, input.pending_count) : 0,
    last_run_at: input.last_run_at ?? null,
    failed_lectures: Array.isArray(input.failed_lectures)
      ? input.failed_lectures.map((lecture) =>
          typeof lecture === 'string'
            ? {
                lecture_id: lecture,
                lecture_title: lecture,
              }
            : lecture
        )
      : [],
  };
}
