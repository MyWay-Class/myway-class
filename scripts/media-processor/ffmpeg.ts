import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

function collectOutput(child: ReturnType<typeof spawn>): () => string {
  let output = '';
  child.stdout?.on('data', (chunk: Buffer | string) => {
    output += String(chunk);
  });
  child.stderr?.on('data', (chunk: Buffer | string) => {
    output += String(chunk);
  });
  return () => output;
}

export async function extractAudioWithFfmpeg(ffmpegPath: string, videoPath: string, audioPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'pcm_s16le',
      '-ar',
      '16000',
      '-ac',
      '1',
      audioPath,
    ]);

    const getOutput = collectOutput(child);
    child.on('error', (error) => {
      reject(new Error(`ffmpeg 실행에 실패했습니다. ${error.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg 변환에 실패했습니다. ${getOutput().trim()}`));
    });
  });
}

function formatSeconds(milliseconds: number): string {
  return `${(Math.max(0, milliseconds) / 1000).toFixed(3)}`;
}

export async function trimVideoSegmentWithFfmpeg(
  ffmpegPath: string,
  sourcePath: string,
  startTimeMs: number,
  endTimeMs: number,
  outputPath: string,
): Promise<void> {
  const durationMs = Math.max(1000, endTimeMs - startTimeMs);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      '-y',
      '-i',
      sourcePath,
      '-ss',
      formatSeconds(startTimeMs),
      '-t',
      formatSeconds(durationMs),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    const getOutput = collectOutput(child);
    child.on('error', (error) => {
      reject(new Error(`ffmpeg 실행에 실패했습니다. ${error.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg 구간 자르기에 실패했습니다. ${getOutput().trim()}`));
    });
  });
}

export async function concatVideoSegmentsWithFfmpeg(
  ffmpegPath: string,
  segmentPaths: string[],
  outputPath: string,
  tempDir: string,
): Promise<void> {
  const listPath = path.join(tempDir, 'concat.txt');
  const listContent = segmentPaths
    .map((segmentPath) => `file '${segmentPath.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`)
    .join('\n');
  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(listPath, `${listContent}\n`, 'utf8');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    const getOutput = collectOutput(child);
    child.on('error', (error) => {
      reject(new Error(`ffmpeg 실행에 실패했습니다. ${error.message}`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg 합치기에 실패했습니다. ${getOutput().trim()}`));
    });
  });
}

export async function probeFfmpeg(ffmpegPath: string): Promise<{
  available: boolean;
  version?: string;
  output?: string;
}> {
  return await new Promise((resolve) => {
    const child = spawn(ffmpegPath, ['-version']);
    const getOutput = collectOutput(child);
    child.on('error', () => {
      resolve({ available: false });
    });
    child.on('close', (code) => {
      const output = getOutput().trim();
      if (code === 0) {
        resolve({
          available: true,
          version: output.split('\n')[0]?.trim(),
          output,
        });
        return;
      }

      resolve({
        available: false,
        output,
      });
    });
  });
}
