import { request, unwrap } from './api-core';

export type BatchPipelineFailedLecture = {
  lecture_id: string;
  lecture_title?: string;
  course_title?: string;
  failed_reason?: string;
  failed_at?: string;
};

export type BatchPipelineStatus = {
  success_count: number;
  failure_count: number;
  pending_count: number;
  last_run_at: string | null;
  failed_lectures: BatchPipelineFailedLecture[];
};

export type BatchPipelineRerunMode = 'all' | 'failed-only';

export type BatchPipelineRerunResult = {
  mode: BatchPipelineRerunMode;
  accepted_at?: string;
  triggered_count?: number;
  status?: BatchPipelineStatus;
};

const EMPTY_STATUS: BatchPipelineStatus = {
  success_count: 0,
  failure_count: 0,
  pending_count: 0,
  last_run_at: null,
  failed_lectures: [],
};

export async function loadBatchPipelineStatus(): Promise<BatchPipelineStatus> {
  const response = await request<BatchPipelineStatus>('/api/v1/admin/media/batch/status', {
    method: 'GET',
  });

  return unwrap(response, () => EMPTY_STATUS);
}

export async function rerunBatchPipeline(mode: BatchPipelineRerunMode): Promise<BatchPipelineRerunResult | null> {
  const response = await request<BatchPipelineRerunResult>('/api/v1/admin/media/batch/run', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });

  return response?.success && response.data ? response.data : null;
}
