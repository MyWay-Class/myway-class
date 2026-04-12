import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export async function ensureWorkDirs(workDir: string): Promise<void> {
  await fs.mkdir(path.join(workDir, 'input'), { recursive: true });
  await fs.mkdir(path.join(workDir, 'output'), { recursive: true });
  await fs.mkdir(path.join(workDir, 'tmp'), { recursive: true });
}

export function buildJobPaths(workDir: string, jobId: string): {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  tempDir: string;
} {
  return {
    videoPath: path.join(workDir, 'input', `${jobId}.video`),
    audioPath: path.join(workDir, 'output', `${jobId}.wav`),
    outputPath: path.join(workDir, 'output', `${jobId}.mp4`),
    tempDir: path.join(workDir, 'tmp', jobId),
  };
}

export async function downloadSourceVideo(
  sourceUrl: string,
  targetPath: string,
  headers?: Record<string, string>,
): Promise<void> {
  const response = await fetch(sourceUrl, {
    headers,
  });
  if (!response.ok || !response.body) {
    throw new Error(`영상 다운로드에 실패했습니다. (${response.status})`);
  }

  await pipeline(Readable.fromWeb(response.body as globalThis.ReadableStream<Uint8Array>), createWriteStream(targetPath));
}

export async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
