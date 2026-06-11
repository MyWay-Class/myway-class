import { describe, expect, it, vi } from 'vitest';
import { seekLectureVideo } from './lectureSeek';

class ReadOnlyCurrentTimeVideo {
  private _currentTime = 0;

  fastSeek = vi.fn((time: number) => {
    this._currentTime = time;
  });

  play = vi.fn(() => Promise.resolve());

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(_value: number) {
    throw new Error('currentTime is read only');
  }
}

describe('seekLectureVideo', () => {
  it('falls back to fastSeek when currentTime cannot be assigned', () => {
    const video = new ReadOnlyCurrentTimeVideo();

    const result = seekLectureVideo(video, 19_000);

    expect(result).toBe(true);
    expect(video.fastSeek).toHaveBeenCalledWith(19);
    expect(video.play).toHaveBeenCalled();
    expect(video.currentTime).toBe(19);
  });
});
