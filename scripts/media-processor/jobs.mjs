export function createJobStore() {
  const jobs = new Map();

  function createJob(input) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      extractionId: input.extraction_id,
      lectureId: input.lecture_id,
      sourceVideoUrl: input.source_video_url,
      callbackUrl: input.callback?.url,
      callbackSecret: input.callback?.secret ?? null,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioUrl: null,
      errorMessage: null,
      files: {
        videoPath: null,
        audioPath: null,
      },
    };

    jobs.set(job.id, job);
    return job;
  }

  function updateJob(jobId, partial) {
    const current = jobs.get(jobId);
    if (!current) {
      return null;
    }

    const next = {
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

  function getJob(jobId) {
    return jobs.get(jobId) ?? null;
  }

  function listJobs() {
    return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    createJob,
    updateJob,
    getJob,
    listJobs,
  };
}
