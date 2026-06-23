type SeekableVideoElement = {
  currentTime: number;
  fastSeek?: (time: number) => void;
  play?: () => PromiseLike<void> | void;
};

export function seekLectureVideo(video: SeekableVideoElement | null | undefined, startMs: number): boolean {
  if (!video) {
    return false;
  }

  const targetSeconds = Math.max(0, Math.floor(startMs / 1000));

  if (typeof video.fastSeek === 'function') {
    try {
      video.fastSeek(targetSeconds);
    } catch {
      // Fall through to currentTime below when fastSeek is unavailable or rejected.
    }
  }

  try {
    video.currentTime = targetSeconds;
  } catch {
    // Some player wrappers expose a read-only currentTime getter; keep the seek best-effort.
  }

  const playResult = video.play?.();
  if (playResult && typeof playResult.catch === 'function') {
    void playResult.catch(() => {});
  }

  return true;
}
