import type { AudioExtractionJobRequest, ProcessorJob } from './types';

export function createJobStore() {
  const jobs = new Map<string, ProcessorJob>();

  function createJob(input: AudioExtractionJobRequest): ProcessorJob {
    const job: ProcessorJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      extractionId: input.extraction_id,
      lectureId: input.lecture_id,
      sourceVideoUrl: input.source_video_url,
      callbackUrl: input.callback.url,
      callbackSecret: input.callback.secret ?? null,
      status: 'PROCESSING',
      stage: 'queued',
      step: 'job 등록됨',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      audioUrl: null,
      errorMessage: null,
      ffmpegOutput: null,
      callbackStatus: null,
      files: {
        videoPath: null,
        audioPath: null,
      },
    };

    jobs.set(job.id, job);
    return job;
  }

  function updateJob(jobId: string, partial: Partial<ProcessorJob>): ProcessorJob | null {
    const current = jobs.get(jobId);
    if (!current) {
      return null;
    }

    const next: ProcessorJob = {
      ...current,
      ...partial,
      files: {
        ...current.files,
        ...(partial.files ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    jobs.set(jobId, next);
    return next;
  }

  function getJob(jobId: string): ProcessorJob | null {
    return jobs.get(jobId) ?? null;
  }

  function listJobs(): ProcessorJob[] {
    return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    createJob,
    updateJob,
    getJob,
    listJobs,
  };
}
