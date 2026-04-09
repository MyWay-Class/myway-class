import { spawn } from 'node:child_process';

function collectOutput(child) {
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    output += String(chunk);
  });
  return () => output;
}

export async function extractAudioWithFfmpeg(ffmpegPath, videoPath, audioPath) {
  await new Promise((resolve, reject) => {
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
