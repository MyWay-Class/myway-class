import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export async function ensureWorkDirs(workDir) {
  await fs.mkdir(path.join(workDir, 'input'), { recursive: true });
  await fs.mkdir(path.join(workDir, 'output'), { recursive: true });
}

export function buildJobPaths(workDir, jobId) {
  return {
    videoPath: path.join(workDir, 'input', `${jobId}.video`),
    audioPath: path.join(workDir, 'output', `${jobId}.wav`),
  };
}

export async function downloadSourceVideo(sourceUrl, targetPath) {
  const response = await fetch(sourceUrl);
  if (!response.ok || !response.body) {
    throw new Error(`영상 다운로드에 실패했습니다. (${response.status})`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(targetPath));
}

export async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
