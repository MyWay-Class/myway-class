import fs from 'node:fs/promises';
import path from 'node:path';
import { sendExtractionCallback, sendShortformExportCallback } from './callback';
import { concatVideoSegmentsWithFfmpeg, extractAudioWithFfmpeg, trimVideoSegmentWithFfmpeg } from './ffmpeg';
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
  jobStore.updateJob(job.id, {
    files: paths,
    status: 'PROCESSING',
    stage: 'downloading',
    step: '원본 영상을 내려받는 중',
    errorMessage: null,
  });

  try {
    await ensureWorkDirs(config.workDir);
    await downloadSourceVideo(job.sourceVideoUrl, paths.videoPath, {
      Authorization: `Bearer ${config.token}`,
    });
    jobStore.updateJob(job.id, {
      stage: 'extracting',
      step: 'FFmpeg로 오디오를 추출하는 중',
    });
    await extractAudioWithFfmpeg(config.ffmpegPath, paths.videoPath, paths.audioPath);

    if (!(await fileExists(paths.audioPath))) {
      throw new Error('오디오 파일이 생성되지 않았습니다.');
    }

    const audioUrl = `${config.publicBaseUrl}/assets/${job.id}.wav`;
    jobStore.updateJob(job.id, {
      stage: 'callback',
      step: 'callback으로 결과를 전달하는 중',
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

    jobStore.updateJob(job.id, {
      status: 'COMPLETED',
      stage: 'completed',
      step: '오디오 추출과 callback이 완료됨',
      callbackStatus: 200,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '오디오 추출에 실패했습니다.';
    jobStore.updateJob(job.id, {
      status: 'FAILED',
      stage: 'failed',
      step: '실패',
      errorMessage: message,
      files: paths,
      completedAt: new Date().toISOString(),
    });

    try {
      const failedJob = jobStore.getJob(job.id);
      if (failedJob) {
        await sendExtractionCallback(failedJob, {
          status: 'FAILED',
          error_message: message,
        });
        jobStore.updateJob(job.id, {
          callbackStatus: 200,
        });
      }
    } catch {
      // callback failure is reflected in the local job state; keep the original extraction error.
      jobStore.updateJob(job.id, {
        callbackStatus: 500,
        step: 'callback 전달 실패',
      });
    }
  } finally {
    await fs.rm(paths.videoPath, { force: true }).catch(() => undefined);
  }
}

export async function processShortformExportJob(
  jobStore: JobStore,
  config: ProcessorConfig,
  job: ProcessorJob,
): Promise<void> {
  const paths = buildJobPaths(config.workDir, job.id);
  jobStore.updateJob(job.id, {
    files: paths,
    status: 'PROCESSING',
    stage: 'downloading',
    step: '원본 클립을 내려받는 중',
    errorMessage: null,
  });

  const trimPaths: string[] = [];

  try {
    await ensureWorkDirs(config.workDir);
    await fs.mkdir(paths.tempDir, { recursive: true });

    for (let index = 0; index < job.clips.length; index += 1) {
      const clip = job.clips[index];
      const clipSourcePath = path.join(paths.tempDir, `source_${index}.mp4`);
      const clipOutputPath = path.join(paths.tempDir, `segment_${index}.mp4`);
      jobStore.updateJob(job.id, {
        stage: 'downloading',
        step: `${index + 1}/${job.clips.length} 클립 원본을 내려받는 중`,
      });
      await downloadSourceVideo(clip.source_video_url, clipSourcePath, {
        Authorization: `Bearer ${config.token}`,
      });

      jobStore.updateJob(job.id, {
        stage: 'extracting',
        step: `${index + 1}/${job.clips.length} 구간을 자르는 중`,
      });
      await trimVideoSegmentWithFfmpeg(config.ffmpegPath, clipSourcePath, clip.start_time_ms, clip.end_time_ms, clipOutputPath);
      trimPaths.push(clipOutputPath);
    }

    if (trimPaths.length === 0) {
      throw new Error('잘라 붙일 클립이 없습니다.');
    }

    jobStore.updateJob(job.id, {
      stage: 'composing',
      step: '클립을 하나의 영상으로 이어 붙이는 중',
    });
    await concatVideoSegmentsWithFfmpeg(config.ffmpegPath, trimPaths, paths.outputPath, paths.tempDir);

    if (!(await fileExists(paths.outputPath))) {
      throw new Error('최종 영상 파일이 생성되지 않았습니다.');
    }

    const videoUrl = `${config.publicBaseUrl}/assets/${job.id}.mp4`;
    jobStore.updateJob(job.id, {
      stage: 'callback',
      step: 'callback으로 결과를 전달하는 중',
      videoUrl,
      files: paths,
      errorMessage: null,
    });

    const completedJob = jobStore.getJob(job.id);
    if (!completedJob) {
      throw new Error('완료된 job 상태를 찾을 수 없습니다.');
    }

    await sendShortformExportCallback(completedJob, {
      status: 'COMPLETED',
      video_url: videoUrl,
    });

    jobStore.updateJob(job.id, {
      status: 'COMPLETED',
      stage: 'completed',
      step: '숏폼 export와 callback이 완료됨',
      callbackStatus: 200,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '숏폼 export에 실패했습니다.';
    jobStore.updateJob(job.id, {
      status: 'FAILED',
      stage: 'failed',
      step: '실패',
      errorMessage: message,
      files: paths,
      completedAt: new Date().toISOString(),
    });

    try {
      const failedJob = jobStore.getJob(job.id);
      if (failedJob) {
        await sendShortformExportCallback(failedJob, {
          status: 'FAILED',
          error_message: message,
          failure_reason: message.includes('ffmpeg 구간') ? 'trim_failed' : message.includes('ffmpeg 합치기') ? 'concat_failed' : 'export_failed',
        });
        jobStore.updateJob(job.id, {
          callbackStatus: 200,
        });
      }
    } catch {
      jobStore.updateJob(job.id, {
        callbackStatus: 500,
        step: 'callback 전달 실패',
      });
    }
  } finally {
    await Promise.all(trimPaths.map((filePath) => fs.rm(filePath, { force: true }).catch(() => undefined)));
    await fs.rm(paths.videoPath, { force: true }).catch(() => undefined);
    await fs.rm(paths.outputPath, { force: true }).catch(() => undefined);
    await fs.rm(paths.tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
