import fs from 'node:fs/promises';
import { sendExtractionCallback } from './callback';
import { extractAudioWithFfmpeg } from './ffmpeg';
import type { createJobStore } from './jobs';
import { buildJobPaths, downloadSourceVideo, ensureWorkDirs, fileExists } from './storage';
import type { ProcessorConfig, ProcessorJob } from './types';

type JobStore = ReturnType<typeof createJobStore>;

export async function processAudioExtractionJob(
  jobStore: JobStore,
  config: ProcessorConfig,
  job: ProcessorJob,
): Promise<void> {
  const paths = buildJobPaths(config.workDir, job.id);
  jobStore.updateJob(job.id, { files: paths, status: 'PROCESSING', errorMessage: null });

  try {
    await ensureWorkDirs(config.workDir);
    await downloadSourceVideo(job.sourceVideoUrl, paths.videoPath);
    await extractAudioWithFfmpeg(config.ffmpegPath, paths.videoPath, paths.audioPath);

    if (!(await fileExists(paths.audioPath))) {
      throw new Error('오디오 파일이 생성되지 않았습니다.');
    }

    const audioUrl = `${config.publicBaseUrl}/assets/${job.id}.wav`;
    jobStore.updateJob(job.id, {
      status: 'COMPLETED',
      audioUrl,
      files: paths,
      errorMessage: null,
    });

    const completedJob = jobStore.getJob(job.id);
    if (!completedJob) {
      throw new Error('완료된 job 상태를 찾을 수 없습니다.');
    }

    await sendExtractionCallback(completedJob, {
      status: 'COMPLETED',
      audio_url: audioUrl,
      audio_format: 'wav',
      sample_rate: 16000,
      channels: 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '오디오 추출에 실패했습니다.';
    jobStore.updateJob(job.id, {
      status: 'FAILED',
      errorMessage: message,
      files: paths,
    });

    try {
      const failedJob = jobStore.getJob(job.id);
      if (failedJob) {
        await sendExtractionCallback(failedJob, {
          status: 'FAILED',
          error_message: message,
        });
      }
    } catch {
      // callback failure is reflected in the local job state; keep the original extraction error.
    }
  } finally {
    await fs.rm(paths.videoPath, { force: true }).catch(() => undefined);
  }
}
