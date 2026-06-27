type SeekableVideoElement = {
  currentTime: number;
  fastSeek?: (time: number) => void;
  seekTo?: (time: number) => void;
  play?: () => PromiseLike<void> | void;
};

function setCurrentTimeViaPrototype(video: SeekableVideoElement, targetSeconds: number): boolean {
  const prototype = Object.getPrototypeOf(video);
  const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, 'currentTime') : null;

  if (typeof descriptor?.set !== 'function') {
    return false;
  }

  try {
    descriptor.set.call(video, targetSeconds);
    return true;
  } catch {
    return false;
  }
}

export function seekLectureVideo(video: SeekableVideoElement | null | undefined, startMs: number): boolean {
  if (!video) {
    return false;
  }

  const targetSeconds = Math.max(0, Math.floor(startMs / 1000));

  if (typeof video.seekTo === 'function') {
    try {
      video.seekTo(targetSeconds);
    } catch {
      // Fall through to the media element fallbacks below.
    }
  }

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
    // Some player wrappers expose a read-only currentTime getter; try the prototype setter.
    setCurrentTimeViaPrototype(video, targetSeconds);
  }

  const playResult = video.play?.();
  if (playResult && typeof playResult.catch === 'function') {
    void playResult.catch(() => {});
  }

  return true;
}
